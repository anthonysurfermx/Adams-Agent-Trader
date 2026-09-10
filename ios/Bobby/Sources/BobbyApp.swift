// Bobby — the trading assistant. Thin native client over the live
// bobbyprotocol.xyz brain. Wallets sign externally; Bobby stores no keys.
import SwiftUI

@main
struct BobbyApp: App {
    private static var isUnitTestHost: Bool {
#if DEBUG
        ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] != nil
#else
        false
#endif
    }

    private static var isLandPreview: Bool {
#if DEBUG
        ProcessInfo.processInfo.arguments.contains("-trader-land-gate")
#else
        false
#endif
    }

    init() {
        // The offline island fixture must not create wallet pairings or depend
        // on keychain entitlements in an unsigned simulator build.
        if !Self.isLandPreview && !Self.isUnitTestHost { WalletBridge.configure() }
    }

    var body: some Scene {
        WindowGroup {
            Group {
#if DEBUG
                if Self.isUnitTestHost {
                    Color.clear
                } else if ProcessInfo.processInfo.arguments.contains("-trader-land-gate") {
                    TraderLandGateHarnessView()
                } else if ProcessInfo.processInfo.arguments.contains("-qa-skin") {
                    GearSkinQAFixtureView()
                } else {
                    ContentView()
                }
#else
                ContentView()
#endif
            }
            .preferredColorScheme(.dark)
            .onOpenURL { if !Self.isLandPreview { WalletBridge.shared.handleDeepLink($0) } }
        }
    }
}
