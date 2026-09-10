// Native Realtime transport. Only an ephemeral token enters the app; the
// provider key and market tools stay behind Bobby's existing API endpoints.
import Foundation
import AVFoundation
import Combine

@MainActor
final class RealtimeVoice: ObservableObject {
    enum State { case idle, connecting, listening, thinking, speaking }
    @Published private(set) var state: State = .idle
    @Published private(set) var level: CGFloat = 0
    @Published private(set) var muted = true
    @Published private(set) var caption = ""
    @Published private(set) var error: String?
    var active: Bool { state != .idle }
    var speaking: Bool { state == .speaking }
    var listening: Bool { active && !muted && state != .connecting }

    var onTranscript: ((Bool, String) -> Void)?
    var onEvidence: ((String, [String: Any]) -> Void)?
    var onChart: ((String, String) -> Void)?

    private var socket: URLSessionWebSocketTask?
    private var engine: AVAudioEngine?
    private var player: AVAudioPlayerNode?
    private var receiveTask: Task<Void, Never>?
    private var connectTask: Task<Void, Never>?
    private var timeoutTask: Task<Void, Never>?
    private var sendTask: Task<Void, Never>?
    private var sendQueue: [String] = []
    private var toolTasks: [String: Task<Void, Never>] = [:]
    private var dispatched = Set<String>()
    private var callNames: [String: String] = [:]
    private var generation = UUID()
    private var playbackGeneration = UUID()
    private var pendingAudio = 0
    private var playedSamples = 0
    private var audioItemID: String?
    private var audioObservers = Set<AnyCancellable>()
    private var audioComplete = false
    private var responseActive = false
    private var responseOwed = false
    private var instructions = ""
    private var symbol = "BTC"
    private var timeframe = "1H"
    private var evidenceCache: [String: (Date, [String: Any])] = [:]

    init() {
        NotificationCenter.default.publisher(for: AVAudioSession.interruptionNotification)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in self?.stop() }
            .store(in: &audioObservers)
    }

    static func screen(symbol: String, timeframe: String) -> (String, String) {
        let ticker = symbol.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        let valid = ticker.range(of: "^[A-Z0-9][A-Z0-9.-]{0,14}$", options: .regularExpression) != nil
        return (valid ? ticker : "BTC", ["5m", "15m", "1H", "4H", "1D"].contains(timeframe) ? timeframe : "1H")
    }

    func start(symbol: String, timeframe: String, voice: String?) {
        guard !active else { return }
        (self.symbol, self.timeframe) = Self.screen(symbol: symbol, timeframe: timeframe)
        generation = UUID()
        let token = generation
        state = .connecting
        error = nil
        caption = ""
        connectTask = Task { [weak self] in
            guard let self else { return }
            do {
                let granted = await AVAudioApplication.requestRecordPermission()
                guard self.generation == token, !Task.isCancelled else { return }
                guard granted else { throw VoiceError.microphone }
                try self.configureAudio(token: token)
                var body: [String: Any] = ["lang": L.ttsLang, "autoLanguage": true,
                                          "symbol": self.symbol, "timeframe": self.timeframe]
                if let voice { body["voice"] = voice }
                guard let session = try await BobbyAPI.json("api/realtime-session", method: "POST", body: body,
                                                           allowedStatus: 200...299) as? [String: Any],
                      let secret = session["client_secret"] as? String,
                      let baseInstructions = session["instructions"] as? String else { throw VoiceError.connection }
                guard self.generation == token, !Task.isCancelled else { return }
                self.instructions = baseInstructions
                var request = URLRequest(url: URL(string: "wss://api.openai.com/v1/realtime?model=gpt-realtime-2.1")!)
                request.setValue("Bearer \(secret)", forHTTPHeaderField: "Authorization")
                request.timeoutInterval = 20
                let ws = URLSession.shared.webSocketTask(with: request)
                self.socket = ws
                ws.resume()
                self.receiveTask = Task { [weak self] in
                    while let self, self.generation == token, !Task.isCancelled {
                        do {
                            let message = try await ws.receive()
                            guard self.generation == token else { return }
                            let data: Data
                            switch message {
                            case .data(let value): data = value
                            case .string(let value): data = Data(value.utf8)
                            @unknown default: continue
                            }
                            if let event = try JSONSerialization.jsonObject(with: data) as? [String: Any] {
                                self.handle(event)
                            }
                        } catch {
                            if self.generation == token, !Task.isCancelled { self.fail(.connection) }
                            return
                        }
                    }
                }
                self.timeoutTask = Task { [weak self] in
                    try? await Task.sleep(for: .seconds(20))
                    guard let self, !Task.isCancelled, self.generation == token, self.state == .connecting else { return }
                    self.fail(.connection)
                }
            } catch {
                guard self.generation == token, !Task.isCancelled else { return }
                self.fail((error as? VoiceError) ?? .connection)
            }
        }
    }

    func stop() {
        generation = UUID()
        connectTask?.cancel(); connectTask = nil
        receiveTask?.cancel(); receiveTask = nil
        timeoutTask?.cancel(); timeoutTask = nil
        sendTask?.cancel(); sendTask = nil
        toolTasks.values.forEach { $0.cancel() }; toolTasks.removeAll()
        socket?.cancel(with: .normalClosure, reason: nil); socket = nil
        sendQueue.removeAll()
        if let engine {
            engine.inputNode.removeTap(onBus: 0)
            engine.stop()
        }
        clearPlayback()
        engine = nil; player = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        instructions = ""
        dispatched.removeAll(); callNames.removeAll(); evidenceCache.removeAll()
        responseActive = false; responseOwed = false
        state = .idle; muted = true; level = 0
    }

    func toggleMicrophone() {
        guard active, state != .connecting else { return }
        if !muted {
            // WebSockets do not synthesize silence when capture is muted.
            // Flush the VAD pause before stopping microphone uploads.
            send(["type": "input_audio_buffer.append", "audio": Data(count: 24_000).base64EncodedString()])
            muted = true
            return
        }
        if responseActive { send(["type": "response.cancel"]) }
        if let audioItemID, state == .speaking {
            send(["type": "conversation.item.truncate", "item_id": audioItemID,
                  "content_index": 0, "audio_end_ms": playedSamples * 1000 / 24_000])
        }
        clearPlayback()
        send(["type": "input_audio_buffer.clear"])
        muted = false
        state = .listening
    }

    func sendText(_ text: String) {
        guard active, state != .connecting, !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        if responseActive { return }
        muted = true
        onTranscript?(false, text)
        send(["type": "conversation.item.create", "item": ["type": "message", "role": "user",
              "content": [["type": "input_text", "text": String(text.prefix(1500))]]]])
        requestResponse()
    }

    func updateScreen(symbol: String, timeframe: String) {
        (self.symbol, self.timeframe) = Self.screen(symbol: symbol, timeframe: timeframe)
        guard active, !instructions.isEmpty else { return }
        send(["type": "session.update", "session": ["type": "realtime", "instructions": screenInstructions]])
    }

    private var screenInstructions: String {
        let context = ["symbol": symbol, "timeframe": timeframe]
        let json = (try? JSONSerialization.data(withJSONObject: context)).flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
        return instructions + "\nCURRENT SCREEN (selection only, fetch tools for live facts): " + json
            + "\nNATIVE DISPLAY: the app renders the tool's canonical technical plan. UI tools cannot override its risk gate."
    }

    private func requestResponse() {
        if responseActive { responseOwed = true; return }
        responseActive = true
        send(["type": "response.create"])
    }

    private func send(_ event: [String: Any]) {
        guard let socket, let data = try? JSONSerialization.data(withJSONObject: event),
              let text = String(data: data, encoding: .utf8) else { return }
        // Bound a stalled connection's audio backlog; never buffer indefinitely.
        guard sendQueue.count < 100 else { fail(.connection); return }
        sendQueue.append(text)
        guard sendTask == nil else { return }
        let token = generation
        sendTask = Task { [weak self] in
            while let self, self.generation == token, !Task.isCancelled, !self.sendQueue.isEmpty {
                let next = self.sendQueue.removeFirst()
                do { try await socket.send(.string(next)) }
                catch { if self.generation == token { self.fail(.connection) }; return }
            }
            if self?.generation == token { self?.sendTask = nil }
        }
    }

    private func configureAudio(token: UUID) throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .voiceChat, options: [.defaultToSpeaker, .allowBluetooth])
        try session.setActive(true)
        let engine = AVAudioEngine()
        let input = engine.inputNode
        try input.setVoiceProcessingEnabled(true)
        let sourceFormat = input.outputFormat(forBus: 0)
        guard sourceFormat.sampleRate > 0, sourceFormat.channelCount > 0,
              let wireFormat = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: 24_000, channels: 1, interleaved: true),
              let converter = AVAudioConverter(from: sourceFormat, to: wireFormat),
              let outputFormat = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: 24_000, channels: 1, interleaved: false)
        else { throw VoiceError.microphone }
        let player = AVAudioPlayerNode()
        engine.attach(player)
        engine.connect(player, to: engine.mainMixerNode, format: outputFormat)
        self.engine = engine; self.player = player
        input.installTap(onBus: 0, bufferSize: 2048, format: sourceFormat) { [weak self] buffer, _ in
            let capacity = AVAudioFrameCount(ceil(Double(buffer.frameLength) * 24_000 / sourceFormat.sampleRate)) + 16
            guard let converted = AVAudioPCMBuffer(pcmFormat: wireFormat, frameCapacity: capacity) else { return }
            var consumed = false
            var conversionError: NSError?
            converter.convert(to: converted, error: &conversionError) { _, status in
                if consumed { status.pointee = .noDataNow; return nil }
                consumed = true; status.pointee = .haveData; return buffer
            }
            guard conversionError == nil, converted.frameLength > 0, let samples = converted.int16ChannelData?[0] else { return }
            let pcm = Data(bytes: samples, count: Int(converted.frameLength) * 2)
            let amplitude = CGFloat((0..<Int(converted.frameLength)).map { abs(Double(samples[$0])) / 32768 }.max() ?? 0)
            Task { @MainActor [weak self] in
                guard let self, self.generation == token, self.listening else { return }
                self.level = min(1, amplitude * 2)
                self.send(["type": "input_audio_buffer.append", "audio": pcm.base64EncodedString()])
            }
        }
        engine.prepare()
        try engine.start()
        player.play()
    }

    static func audioSamples(_ pcm: Data) -> [Float]? {
        guard !pcm.isEmpty, pcm.count.isMultiple(of: 2), pcm.count <= 480_000 else { return nil }
        let bytes = [UInt8](pcm)
        return stride(from: 0, to: bytes.count, by: 2).map {
            Float(Int16(bitPattern: Swift.UInt16(truncatingIfNeeded: bytes[$0]) | Swift.UInt16(truncatingIfNeeded: bytes[$0 + 1]) << 8)) / 32768
        }
    }

    private func play(_ encoded: String) {
        guard let pcm = Data(base64Encoded: encoded), let samples = Self.audioSamples(pcm),
              let player, let format = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: 24_000, channels: 1, interleaved: false),
              let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(samples.count)),
              let channel = buffer.floatChannelData?[0] else { return }
        buffer.frameLength = AVAudioFrameCount(samples.count)
        samples.withUnsafeBufferPointer { channel.update(from: $0.baseAddress!, count: samples.count) }
        muted = true; state = .speaking
        level = CGFloat(min(1, (samples.map { abs($0) }.max() ?? 0) * 2))
        pendingAudio += 1
        let token = playbackGeneration
        player.scheduleBuffer(buffer, completionCallbackType: .dataPlayedBack) { [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self, self.playbackGeneration == token else { return }
                self.pendingAudio = max(0, self.pendingAudio - 1)
                self.playedSamples += samples.count
                self.finishPlaybackIfReady()
            }
        }
        if !player.isPlaying { player.play() }
    }

    private func clearPlayback() {
        playbackGeneration = UUID()
        player?.stop()
        pendingAudio = 0; playedSamples = 0; audioItemID = nil; audioComplete = false; level = 0
    }

    private func finishPlaybackIfReady() {
        guard audioComplete, pendingAudio == 0 else { return }
        level = 0
        if active { state = .listening }
    }

    // Internal for deterministic event tests. No credentials or audio are logged.
    func handle(_ event: [String: Any]) {
        switch event["type"] as? String {
        case "session.created":
            send(["type": "session.update", "session": ["type": "realtime", "instructions": screenInstructions]])
        case "session.updated":
            if state == .connecting {
                state = .listening; muted = false
                timeoutTask?.cancel()
                let token = generation
                timeoutTask = Task { [weak self] in
                    try? await Task.sleep(for: .seconds(300))
                    guard let self, !Task.isCancelled, self.generation == token else { return }
                    self.stop()
                    self.error = L.t("Session ended (5 min). Tap to reconnect.", "Sesión terminada (5 min). Toca para volver.")
                }
            }
        case "input_audio_buffer.speech_started": state = .listening
        case "input_audio_buffer.speech_stopped": state = .thinking
        case "response.created":
            responseActive = true; audioComplete = false; caption = ""
            if pendingAudio == 0 { playedSamples = 0 }
        case "response.output_audio.delta":
            audioItemID = event["item_id"] as? String ?? audioItemID
            if let audio = event["delta"] as? String { play(audio) }
        case "response.output_audio.done":
            audioComplete = true; finishPlaybackIfReady()
        case "response.output_audio_transcript.delta": caption += event["delta"] as? String ?? ""
        case "response.output_audio_transcript.done":
            if let text = event["transcript"] as? String { caption = text; onTranscript?(true, text) }
        case "conversation.item.input_audio_transcription.completed":
            if let text = event["transcript"] as? String, !text.isEmpty { onTranscript?(false, text) }
        case "response.output_item.added":
            if let item = event["item"] as? [String: Any], let id = item["call_id"] as? String, let name = item["name"] as? String { callNames[id] = name }
        case "response.function_call_arguments.done":
            if let id = event["call_id"] as? String, let name = event["name"] as? String ?? callNames[id] {
                dispatch(name: name, id: id, arguments: event["arguments"] as? String ?? "{}")
            }
        case "response.done":
            responseActive = false
            let response = event["response"] as? [String: Any] ?? [:]
            for item in response["output"] as? [[String: Any]] ?? [] where item["type"] as? String == "function_call" {
                if let name = item["name"] as? String, let id = item["call_id"] as? String {
                    dispatch(name: name, id: id, arguments: item["arguments"] as? String ?? "{}")
                }
            }
            if responseOwed { responseOwed = false; requestResponse() }
            if pendingAudio == 0, active { state = .listening }
        case "error":
            let code = (event["error"] as? [String: Any])?["code"] as? String
            if code != "response_cancel_not_active" { fail(.connection) }
        default: break
        }
    }

    private func dispatch(name: String, id: String, arguments: String) {
        guard !dispatched.contains(id), let data = arguments.data(using: .utf8),
              let args = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return }
        // A client guard against runaway tool loops; account quotas still belong on the server.
        guard dispatched.count < 48 else { fail(.limit); return }
        dispatched.insert(id)
        let token = generation
        toolTasks[id] = Task { [weak self] in
            guard let self else { return }
            let result: [String: Any]
            do { result = try await self.runTool(name, args: args, token: token) }
            catch { result = ["error": "tool_failed"] }
            guard self.generation == token, !Task.isCancelled else { return }
            if let json = try? JSONSerialization.data(withJSONObject: result), let output = String(data: json, encoding: .utf8) {
                self.send(["type": "conversation.item.create", "item": ["type": "function_call_output", "call_id": id, "output": output]])
                if self.responseActive { self.responseOwed = true } else { self.requestResponse() }
            }
            self.toolTasks[id] = nil
        }
    }

    private func runTool(_ name: String, args: [String: Any], token: UUID) async throws -> [String: Any] {
        if name == "set_chart" {
            let screen = Self.screen(symbol: args["symbol"] as? String ?? symbol, timeframe: args["timeframe"] as? String ?? timeframe)
            updateScreen(symbol: screen.0, timeframe: screen.1)
            onChart?(screen.0, screen.1)
            return ["ok": true, "symbol": screen.0, "timeframe": screen.1]
        }
        if ["draw_levels", "show_debate", "update_thesis"].contains(name) {
            return ["ok": true, "native_display": "The app renders the canonical technical evidence and risk plan from run_debate; model-authored levels do not override it."]
        }
        guard ["get_market", "run_debate", "get_protocol_stats"].contains(name) else {
            return ["error": "unsupported_tool", "note": "No trades are executed in voice. Use the desk's manual controls."]
        }
        var requestArgs = args
        let ticker = Self.screen(symbol: args["symbol"] as? String ?? symbol, timeframe: timeframe).0
        if name != "get_protocol_stats" { requestArgs["symbol"] = ticker }
        if name == "run_debate", ticker != symbol {
            updateScreen(symbol: ticker, timeframe: timeframe)
            onChart?(ticker, timeframe)
        }
        if name == "run_debate", let cached = evidenceCache[ticker], Date().timeIntervalSince(cached.0) < 30 {
            onEvidence?(ticker, cached.1)
            return cached.1
        }
        guard let output = try await BobbyAPI.json("api/voice-tool", method: "POST", body: ["tool": name, "args": requestArgs], allowedStatus: 200...299) as? [String: Any] else { throw VoiceError.connection }
        guard generation == token else { throw CancellationError() }
        if name == "run_debate", output["error"] == nil {
            if evidenceCache.count >= 8 { evidenceCache.removeAll() }
            evidenceCache[ticker] = (Date(), output)
            if ticker == symbol { onEvidence?(ticker, output) }
        }
        return output
    }

    private enum VoiceError: Error { case microphone, connection, limit }
    private func fail(_ reason: VoiceError) {
        stop()
        switch reason {
        case .microphone: error = L.t("Allow microphone access in Settings, then try again.", "Permite el micrófono en Ajustes e intenta de nuevo.")
        case .connection: error = L.t("Voice disconnected. Tap to retry.", "Voz desconectada. Toca para reintentar.")
        case .limit: error = L.t("Session limit reached. Tap to reconnect.", "Llegaste al límite de la sesión. Toca para volver.")
        }
    }
}
