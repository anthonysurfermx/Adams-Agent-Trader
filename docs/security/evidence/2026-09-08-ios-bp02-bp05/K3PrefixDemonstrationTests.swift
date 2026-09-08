// ============================================================
// K3 THIRD-ROUND REVIEWER — PRE-FIX DEMONSTRATION (mine, not the repo's).
// Runs against BaseSwap.swift @ b3f9b2b (pre-BP-02-fix). The exploit input
// below is a fully allow-listed, internally consistent quote for GOOGLc
// while the user's form says AAPLc. The fix contract says this MUST throw.
// On the pre-fix code it does NOT — the test failure IS the vulnerability.
// ============================================================
import XCTest
@testable import Bobby

final class K3PrefixDemonstrationTests: XCTestCase {
    private let wallet = "0x1111111111111111111111111111111111111111"

    func testK3PreFixAcceptsQuoteForAnotherAllowListedStock() {
        let quote = BaseSwapQuote(
            chainId: 8453,
            venue: .init(name: "Uniswap V3 (SwapRouter02)", router: BaseSwapGuard.router),
            tokenIn: .init(symbol: "USDC", name: "USD Coin", address: BaseSwapGuard.tokenAddresses["USDC"]!, decimals: 6),
            tokenOut: .init(symbol: "GOOGLc", name: "Coinbase Tokenized Google", address: BaseSwapGuard.tokenAddresses["GOOGLc"]!, decimals: 8),
            amountIn: "10", amountInRaw: "10000000",
            amountOut: "0.04304638", amountOutRaw: "4304638",
            minAmountOut: "0.04283114", minAmountOutRaw: "4283114",
            executionPrice: 0.004304638, priceImpactPct: 0.3, usdValue: 10,
            slippagePct: 0.5, deadline: 1_788_540_428,
            route: .init(kind: "single", fees: [3000], description: "USDC → GOOGLc (0.3%)", gasEstimate: "93242"),
            recipient: wallet, tx: nil, allowanceRaw: "10000000",
            simulation: .init(ran: true, ok: true, reason: nil),
            txWithheld: [], warnings: [],
            limits: .init(maxTicketUsd: 100, minTicketUsd: 1, defaultSlippagePct: 0.5, maxSlippagePct: 3, maxPriceImpactPct: 3, deadlineSec: 1200),
            requiresStockEligibility: true,
            stockReference: .init(symbol: "GOOGLc", usdPrice: 231.14, ageSec: 60, multiplierHuman: 1,
                                  marketDeviationPct: 0.5, pausedFeatures: "0", transferPaused: false))
        // The user's picker says AAPLc; the server answered GOOGLc. The fix
        // requires refusal. Pre-fix validateQuote has no requested-pair
        // parameters at all — this assertion FAILS here and passes at 1f8bcd8.
        XCTAssertThrowsError(
            try BaseSwapGuard.validateQuote(quote, inputAmount: "10", slippagePct: 0.5, wallet: wallet,
                                            now: Date(timeIntervalSince1970: 1_788_540_000)),
            "PRE-FIX VULNERABILITY REPRODUCED: a consistent quote for GOOGLc was accepted while the user selected AAPLc"
        )
    }
}
