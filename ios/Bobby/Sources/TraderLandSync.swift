import Foundation
import Combine

/// The same authenticated contract used by the web island. Practice data is
/// deliberately never uploaded or used as a fallback for an account world.
struct TraderLandWorld: Decodable {
    struct Land: Decodable { let size: Int; let theme: String }
    struct Inventory: Decodable, Identifiable {
        let id: String
        let item_id: String
        let state: String
        let placed: Bool
    }
    struct Placement: Decodable, Identifiable {
        let id: String
        let inventory_id: String
        let x: Int
        let y: Int
        let rotation: Int
    }
    let ok: Bool
    let land: Land
    let inventory: [Inventory]
    let placements: [Placement]
    let xp: Int
    let aura: Int
}

enum TraderLandMutation {
    case place(inventoryID: String, x: Int, y: Int, rotation: Int)
    case move(placementID: String, x: Int, y: Int, rotation: Int)
    case remove(placementID: String)

    var body: [String: Any] {
        switch self {
        case let .place(id, x, y, rotation):
            return ["action": "place", "inventoryId": id, "x": x, "y": y, "rotation": rotation]
        case let .move(id, x, y, rotation):
            return ["action": "move", "placementId": id, "x": x, "y": y, "rotation": rotation]
        case let .remove(id):
            return ["action": "remove", "placementId": id]
        }
    }
}

@MainActor
final class TraderLandSync: ObservableObject {
    @Published private(set) var world: TraderLandWorld?
    @Published private(set) var busy = false
    @Published private(set) var error: String?
    private var generation = UUID()
    private var ownerID: String?
    private let transport: URLSession

    init(transport: URLSession = .shared) { self.transport = transport }

    func reset() {
        generation = UUID(); ownerID = nil; world = nil; error = nil; busy = false
    }

    func load() async {
        guard !busy else { return }
        if ownerID != AccountSession.shared.session?.userId { reset() }
        _ = await request(nil)
    }

    func mutate(_ action: TraderLandMutation) async -> TraderLandWorld? {
        guard !busy, error == nil, world != nil, ownerID == AccountSession.shared.session?.userId else { return nil }
        return await request(action)
    }

    private func request(_ action: TraderLandMutation?) async -> TraderLandWorld? {
        guard let userID = AccountSession.shared.session?.userId else { reset(); return nil }
        let epoch = generation
        ownerID = userID; busy = true; error = nil
        defer { if generation == epoch { busy = false } }
        do {
            guard let token = await AccountSession.shared.accessToken() else {
                throw URLError(.userAuthenticationRequired)
            }
            guard generation == epoch, AccountSession.shared.session?.userId == userID else { return nil }
            var request = URLRequest(url: BobbyAPI.base.appendingPathComponent("api/trader-land"))
            request.timeoutInterval = 20
            request.cachePolicy = .reloadIgnoringLocalCacheData
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            if let action {
                request.httpMethod = "POST"
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                request.httpBody = try JSONSerialization.data(withJSONObject: action.body)
            }
            let (data, response) = try await transport.data(for: request)
            guard generation == epoch, AccountSession.shared.session?.userId == userID else { return nil }
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            guard (200..<300).contains(status) else {
                let message = status == 409
                    ? L.t("The island changed. Reload before trying again.", "La isla cambió. Recarga antes de intentarlo de nuevo.")
                    : status == 401
                    ? L.t("Sign in again to save your island.", "Inicia sesión de nuevo para guardar tu isla.")
                    : L.t("Your island could not be updated. Reload to check its saved state.", "No se pudo actualizar tu isla. Recarga para comprobar su estado guardado.")
                throw NSError(domain: "TraderLand", code: status, userInfo: [NSLocalizedDescriptionKey: message])
            }
            let result = try JSONDecoder().decode(TraderLandWorld.self, from: data)
            guard result.ok, result.land.size == 8 else {
                throw NSError(domain: "TraderLand", code: 1, userInfo: [NSLocalizedDescriptionKey: L.t("This island version is not supported yet.", "Esta versión de isla todavía no es compatible.")])
            }
            world = result
            return result
        } catch {
            guard generation == epoch, AccountSession.shared.session?.userId == userID else { return nil }
            self.error = (error as NSError).domain == "TraderLand" ? error.localizedDescription
                : L.t("Connection interrupted. Reload to check your saved island; do not repeat the placement yet.", "Conexión interrumpida. Recarga para comprobar tu isla guardada; no repitas todavía la colocación.")
            return nil
        }
    }
}
