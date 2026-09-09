// Standalone contract tests. Compile this file with Sources/TraderLandSync.swift.
// The URLProtocol fixture intercepts every request; no real accounts or network.
import Foundation

enum L { static func t(_ english: String, _ spanish: String) -> String { english } }
enum BobbyAPI { static let base = URL(string: "https://trader-land.invalid")! }
struct StoredSession { let userId: String }
@MainActor final class AccountSession {
    static let shared = AccountSession()
    var session: StoredSession? = StoredSession(userId: "account-a")
    func accessToken() async -> String? { session == nil ? nil : "test-fixture-only" }
}

final class LandFixtureProtocol: URLProtocol {
    static var status = 200
    static var fail = false
    static var onRequest: (() -> Void)?
    static var requests: [URLRequest] = []
    static let body = Data("""
      {"ok":true,"land":{"size":8,"theme":"night"},"xp":24,"aura":2,
       "inventory":[{"id":"inventory-a","item_id":"crypto_bay_data_dock","state":"bloomed","placed":true}],
       "placements":[{"id":"placement-a","inventory_id":"inventory-a","x":1,"y":2,"rotation":90}]}
      """.utf8)
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        Self.requests.append(request)
        Self.onRequest?()
        if Self.fail { client?.urlProtocol(self, didFailWithError: URLError(.timedOut)); return }
        let response = HTTPURLResponse(url: request.url!, statusCode: Self.status, httpVersion: nil, headerFields: ["Content-Type":"application/json"])!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: Self.body)
        client?.urlProtocolDidFinishLoading(self)
    }
    override func stopLoading() {}
}

func expect(_ condition: Bool, _ message: String) { precondition(condition, message) }

@main struct TraderLandSyncContract {
    @MainActor static func main() async {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [LandFixtureProtocol.self]
        let session = URLSession(configuration: configuration)
        defer { session.invalidateAndCancel() }
        let sync = TraderLandSync(transport: session)
        await sync.load()
        expect(sync.world?.xp == 24 && !sync.busy && sync.error == nil, "Decode authoritative world")
        expect(LandFixtureProtocol.requests.last?.value(forHTTPHeaderField: "Authorization") == "Bearer test-fixture-only", "Use account auth")
        expect(sync.world?.placements.first?.rotation == 90, "Preserve rotation")
        let action = TraderLandMutation.move(placementID: "placement-a", x: 2, y: 3, rotation: 90)
        expect(action.body["placementId"] as? String == "placement-a", "Move by placement ID")
        expect(await sync.mutate(action) != nil, "Accept confirmed move")
        expect(LandFixtureProtocol.requests.last?.httpMethod == "POST", "Mutation uses POST")
        LandFixtureProtocol.status = 409
        expect(await sync.mutate(action) == nil, "Reject stale world")
        expect(sync.world?.xp == 24 && sync.error != nil, "Retain last confirmed state")
        let count = LandFixtureProtocol.requests.count
        expect(await sync.mutate(action) == nil && LandFixtureProtocol.requests.count == count, "Block retry until reload")
        LandFixtureProtocol.status = 200
        await sync.load()
        expect(sync.error == nil, "Successful reload unlocks editing")
        LandFixtureProtocol.fail = true
        expect(await sync.mutate(action) == nil && sync.error != nil, "Timeout is not success")
        LandFixtureProtocol.fail = false
        await sync.load()
        AccountSession.shared.session = StoredSession(userId: "account-b")
        let beforeIdentityChange = LandFixtureProtocol.requests.count
        expect(await sync.mutate(action) == nil && LandFixtureProtocol.requests.count == beforeIdentityChange, "Never mutate prior account world")
        sync.reset()
        expect(sync.world == nil && sync.error == nil && !sync.busy, "Clear account state")
        AccountSession.shared.session = nil
        await sync.load()
        expect(sync.world == nil, "Guest is not a server world")
        print("PASS: decode, auth, rotation, move, conflict, reload, timeout, identity isolation, sign-out")
    }
}
