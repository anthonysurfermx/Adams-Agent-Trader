// ============================================================
// K3 THIRD-ROUND REVIEWER — ADVERSARIAL TESTS (mine, not the repo's).
// Written 2026-09-08 against pinned commit 1f8bcd8. Every test here was
// designed to FAIL on the pre-fix behaviour (b3f9b2b / pre-a55e009) and
// pass now. See /tmp/kimi-k3-ios/report.md for the hazard mapping.
// ============================================================
import XCTest
@testable import Bobby

final class K3BP02AdversarialTests: XCTestCase {
    private let walletA = "0x1111111111111111111111111111111111111111"
    private let walletB = "0x2222222222222222222222222222222222222222"
    private let deadline = 1_788_540_428
    private let now = Date(timeIntervalSince1970: 1_788_540_000)

    // MARK: fixtures

    private func token(_ symbol: String, address: String? = nil) -> BaseSwapTokenView {
        BaseSwapTokenView(symbol: symbol, name: symbol, address: address ?? BaseSwapGuard.tokenAddresses[symbol]!,
                          decimals: symbol == "USDC" ? 6 : 8)
    }

    /// Fully internally-consistent, fully allow-listed quote. Defaults to USDC -> NVDAc.
    private func quote(
        stock: String = "NVDAc",
        stockAddress: String? = nil,
        usdcAddress: String? = nil,
        reversed: Bool = false,
        recipient: String? = nil,
        tx: BaseSwapTransactionSet? = nil,
        reference: BaseSwapQuote.StockReference?? = nil,
        referenceSymbol: String? = nil,
        usable: Bool? = true,
        status: String? = "fresh",
        issuerPaused: Bool? = false,
        transferPaused: Bool = false,
        ageSec: Int = 60,
        deviation: Double = 0.5,
        usdPrice: Double = 231.14,
        multiplier: Double = 1
    ) -> BaseSwapQuote {
        let usdc = token("USDC", address: usdcAddress)
        let stockToken = token(stock, address: stockAddress)
        let ref = reference ?? BaseSwapQuote.StockReference(
            symbol: referenceSymbol ?? stock, usdPrice: usdPrice, ageSec: ageSec, multiplierHuman: multiplier,
            marketDeviationPct: deviation, pausedFeatures: "0", transferPaused: transferPaused,
            issuerPaused: issuerPaused, usable: usable, status: status)
        return BaseSwapQuote(
            chainId: 8453,
            venue: .init(name: "Uniswap V3 (SwapRouter02)", router: BaseSwapGuard.router),
            tokenIn: reversed ? stockToken : usdc,
            tokenOut: reversed ? usdc : stockToken,
            amountIn: "10", amountInRaw: "10000000",
            amountOut: "0.04304638", amountOutRaw: "4304638",
            minAmountOut: "0.04283114", minAmountOutRaw: "4283114",
            executionPrice: 0.004304638, priceImpactPct: 0.3, usdValue: 10,
            slippagePct: 0.5, deadline: deadline,
            route: .init(kind: "single", fees: [3000], description: "route", gasEstimate: "93242"),
            recipient: recipient ?? walletA,
            tx: tx, allowanceRaw: "10000000",
            simulation: .init(ran: true, ok: true, reason: nil),
            txWithheld: [], warnings: [],
            limits: .init(maxTicketUsd: 100, minTicketUsd: 1, defaultSlippagePct: 0.5, maxSlippagePct: 3, maxPriceImpactPct: 3, deadlineSec: 1200),
            requiresStockEligibility: true,
            stockReference: ref)
    }

    private func word(_ hex: String) -> String { String(repeating: "0", count: 64 - hex.count) + hex }

    private func approvalData(spender: String, amountHex: String) -> String {
        let address = String(spender.lowercased().dropFirst(2))
        return "0x095ea7b3" + word(address) + word(amountHex)
    }

    private func swapData(recipient: String, amountInHex: String = "989680", minOutHex: String = "415aea") -> String {
        "0x5ae401dc"
            + word("6a9af60c") + word("40") + word("1") + word("20") + word("e4")
            + "04e45aaf"
            + word(String(BaseSwapGuard.tokenAddresses["USDC"]!.dropFirst(2)))
            + word(String(BaseSwapGuard.tokenAddresses["NVDAc"]!.dropFirst(2)))
            + word("bb8")
            + word(String(recipient.dropFirst(2)))
            + word(amountInHex)
            + word(minOutHex)
            + word("0")
            + String(repeating: "0", count: 56)
    }

    private func approvalTx(amountHex: String = "989680", amount: String = "10000000") -> BaseSwapTransaction {
        BaseSwapTransaction(to: BaseSwapGuard.tokenAddresses["USDC"]!,
                            data: approvalData(spender: BaseSwapGuard.router, amountHex: amountHex),
                            value: "0x0", spender: BaseSwapGuard.router, amount: amount)
    }

    // MARK: Attack 1 — consistent GOOGLc quote when the user asked for AAPLc.
    // Must be refused at acceptance AND (via the same validateQuote gate the view
    // calls at BaseSwapView.swift:331/347/373) before approval and before swap.

    func testK3ConsistentQuoteForAnotherAllowListedStockIsRefusedEverywhere() {
        let forged = quote(stock: "GOOGLc") // pinned GOOGLc address, valid reference, valid amounts
        // sanity: the forged quote IS valid for what it is — would pass without pair binding
        XCTAssertNoThrow(try BaseSwapGuard.validateQuote(forged, requestedTokenIn: "USDC", requestedTokenOut: "GOOGLc",
                                                         inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now))
        // acceptance gate
        XCTAssertThrowsError(try BaseSwapGuard.validateQuote(forged, requestedTokenIn: "USDC", requestedTokenOut: "AAPLc",
                                                             inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now)) { error in
            XCTAssertEqual(error as? BaseSwapSecurityError, .refused("quote output is GOOGLc, you selected AAPLc"))
        }
        // pre-approval gate (quote carrying an approval for GOOGLc-path input)
        let withApprove = quote(stock: "GOOGLc", tx: .init(chainId: 8453, approve: approvalTx(), swap: nil, revoke: nil, deadline: deadline))
        XCTAssertThrowsError(try BaseSwapGuard.validateQuote(withApprove, requestedTokenIn: "USDC", requestedTokenOut: "AAPLc",
                                                             inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now))
        // pre-swap gate
        let withSwap = quote(stock: "GOOGLc", tx: .init(chainId: 8453, approve: nil, swap: BaseSwapTransaction(to: BaseSwapGuard.router, data: swapData(recipient: walletA), value: "0x0", spender: nil, amount: nil), revoke: nil, deadline: deadline))
        XCTAssertThrowsError(try BaseSwapGuard.validateQuote(withSwap, requestedTokenIn: "USDC", requestedTokenOut: "AAPLc",
                                                             inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now))
        // sell-side confusion: user asked to SELL AAPLc, server sent a BUY GOOGLc quote
        XCTAssertThrowsError(try BaseSwapGuard.validateQuote(forged, requestedTokenIn: "AAPLc", requestedTokenOut: "USDC",
                                                             inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now))
    }

    // MARK: Attack 2 — same symbol, look-alike address. The guard must compare
    // the PINNED ADDRESS, never the symbol string.

    func testK3LookAlikeAddressSameSymbolIsRefused() {
        // one-nibble-off AAPLc
        let evil = "0xb200000000000000000000c2e324d24d7eecd1fc"
        XCTAssertNotEqual(evil, BaseSwapGuard.tokenAddresses["AAPLc"]!)
        XCTAssertThrowsError(try BaseSwapGuard.validateQuote(quote(stock: "AAPLc", stockAddress: evil),
            requestedTokenIn: "USDC", requestedTokenOut: "AAPLc", inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now)) { error in
            XCTAssertEqual(error as? BaseSwapSecurityError, .refused("quote output address is not the pinned one"))
        }
        // look-alike USDC on the input side
        let evilUsdc = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02914"
        XCTAssertThrowsError(try BaseSwapGuard.validateQuote(quote(usdcAddress: evilUsdc),
            requestedTokenIn: "USDC", requestedTokenOut: "NVDAc", inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now))
        // no false rejection: checksummed (mixed-case) pinned addresses still pass
        let checksummed = "0xB20000000000000000000078Ee7cE2fE4908108c".lowercased() == BaseSwapGuard.tokenAddresses["NVDAc"]!
            ? "0xB20000000000000000000078Ee7cE2fE4908108c" : BaseSwapGuard.tokenAddresses["NVDAc"]!
        XCTAssertNoThrow(try BaseSwapGuard.validateQuote(quote(stockAddress: checksummed),
            requestedTokenIn: "USDC", requestedTokenOut: "NVDAc", inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now))
    }

    // MARK: Attack 3 — side flip, amount drift, slippage drift, wallet change.
    // Wallet change AFTER approval is the important one.

    func testK3SideAmountSlippageWalletChangesInvalidate() {
        let q = quote(tx: .init(chainId: 8453, approve: approvalTx(), swap: nil, revoke: nil, deadline: deadline))
        // side flip
        XCTAssertThrowsError(try BaseSwapGuard.validateQuote(q, requestedTokenIn: "NVDAc", requestedTokenOut: "USDC",
                                                             inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now))
        // amount drift
        XCTAssertThrowsError(try BaseSwapGuard.validateQuote(q, requestedTokenIn: "USDC", requestedTokenOut: "NVDAc",
                                                             inputAmount: "10.000001", slippagePct: 0.5, wallet: walletA, now: now))
        // slippage drift
        XCTAssertThrowsError(try BaseSwapGuard.validateQuote(q, requestedTokenIn: "USDC", requestedTokenOut: "NVDAc",
                                                             inputAmount: "10", slippagePct: 1.0, wallet: walletA, now: now))
        // wallet change after approval: quote recipient is walletA, signer is now walletB
        XCTAssertThrowsError(try BaseSwapGuard.validateQuote(q, requestedTokenIn: "USDC", requestedTokenOut: "NVDAc",
                                                             inputAmount: "10", slippagePct: 0.5, wallet: walletB, now: now)) { error in
            XCTAssertEqual(error as? BaseSwapSecurityError, .refused("recipient is not the connected wallet"))
        }
        // and the swap calldata itself binds the recipient: a swap whose calldata
        // pays walletA must be refused when walletB is connected
        let swap = BaseSwapTransaction(to: BaseSwapGuard.router, data: swapData(recipient: walletA), value: "0x0", spender: nil, amount: nil)
        let swapQuote = quote(tx: .init(chainId: 8453, approve: nil, swap: swap, revoke: nil, deadline: deadline))
        XCTAssertThrowsError(try BaseSwapGuard.validateSwap(swap, quote: swapQuote, wallet: walletB, now: now)) { error in
            XCTAssertEqual(error as? BaseSwapSecurityError, .refused("calldata recipient is not the connected wallet"))
        }
    }

    // MARK: Attack 4 — ABI amount equality (a55e009). Normalisation must not
    // make two DIFFERENT amounts compare equal.

    func testK3ABIAmountNormalizationCannotEquateDifferentValues() throws {
        // helper: embed the exact tx instance into the quote, then validate it
        func check(_ tx: BaseSwapTransaction, amountRaw: String) throws {
            try BaseSwapGuard.validateApproval(tx, quote: quote(amountRawOverride: amountRaw, approval: tx))
        }
        // 0x0a (10) must not satisfy amount 160 (0xa0), and vice versa
        XCTAssertThrowsError(try check(approvalTx(amountHex: "0a", amount: "160"), amountRaw: "160"))
        XCTAssertThrowsError(try check(approvalTx(amountHex: "a0", amount: "10"), amountRaw: "10"))
        // the a55e009 regression: 1 USDC = 1000000 = 0xf4240, ABI byte 0x0f — must PASS
        XCTAssertNoThrow(try check(approvalTx(amountHex: "0f4240", amount: "1000000"), amountRaw: "1000000"))
        // zero-padded odd-nibble forms of the SAME value pass; different value fails
        XCTAssertNoThrow(try check(approvalTx(amountHex: "0989680", amount: "10000000"), amountRaw: "10000000"))
        XCTAssertThrowsError(try check(approvalTx(amountHex: "0989681", amount: "10000000"), amountRaw: "10000000"))
        // empty string / non-canonical amounts never match
        XCTAssertThrowsError(try check(approvalTx(amountHex: "0", amount: ""), amountRaw: ""))
        XCTAssertThrowsError(try check(approvalTx(amountHex: "989680", amount: "010000000"), amountRaw: "010000000"))
        // > uint256 is refused even at the calldata layer (2^256, 78 digits)
        let over = "115792089237316195423570985008687907853269984665640564039457584007913129639936"
        XCTAssertThrowsError(try check(approvalTx(amountHex: String(repeating: "f", count: 64), amount: over), amountRaw: over)) { error in
            XCTAssertEqual(error as? BaseSwapSecurityError, .refused("calldata amount exceeds uint256"))
        }
        // max uint256 exactly still works (boundary)
        let max = "115792089237316195423570985008687907853269984665640564039457584007913129639935"
        XCTAssertNoThrow(try check(approvalTx(amountHex: String(repeating: "f", count: 64), amount: max), amountRaw: max))
        // malformed calldata
        let badHex = BaseSwapTransaction(to: BaseSwapGuard.tokenAddresses["USDC"]!, data: "0x095ea7b3zz", value: "0x0", spender: BaseSwapGuard.router, amount: "10000000")
        XCTAssertThrowsError(try check(badHex, amountRaw: "10000000"))
        let oddHex = BaseSwapTransaction(to: BaseSwapGuard.tokenAddresses["USDC"]!, data: "0x095ea7b", value: "0x0", spender: BaseSwapGuard.router, amount: "10000000")
        XCTAssertThrowsError(try check(oddHex, amountRaw: "10000000"))
        // rawAmount: empty / non-numeric / exponent notation all refused
        XCTAssertThrowsError(try BaseSwapGuard.rawAmount("", decimals: 6))
        XCTAssertThrowsError(try BaseSwapGuard.rawAmount("0x0a", decimals: 6))
        XCTAssertThrowsError(try BaseSwapGuard.rawAmount("1e3", decimals: 6))
        XCTAssertThrowsError(try BaseSwapGuard.rawAmount("-1", decimals: 6))
        XCTAssertThrowsError(try BaseSwapGuard.rawAmount("1.", decimals: 6))
        XCTAssertEqual(try BaseSwapGuard.rawAmount("007.500", decimals: 6), "7500000")
    }

    private func quote(amountRawOverride: String, approval: BaseSwapTransaction) -> BaseSwapQuote {
        let base = quote()
        return BaseSwapQuote(chainId: base.chainId, venue: base.venue, tokenIn: base.tokenIn, tokenOut: base.tokenOut,
                             amountIn: base.amountIn, amountInRaw: amountRawOverride,
                             amountOut: base.amountOut, amountOutRaw: base.amountOutRaw,
                             minAmountOut: base.minAmountOut, minAmountOutRaw: base.minAmountOutRaw,
                             executionPrice: base.executionPrice, priceImpactPct: base.priceImpactPct, usdValue: base.usdValue,
                             slippagePct: base.slippagePct, deadline: base.deadline, route: base.route,
                             recipient: base.recipient,
                             tx: .init(chainId: 8453, approve: approval, swap: nil, revoke: nil, deadline: deadline),
                             allowanceRaw: base.allowanceRaw, simulation: base.simulation, txWithheld: base.txWithheld,
                             warnings: base.warnings, limits: base.limits,
                             requiresStockEligibility: base.requiresStockEligibility, stockReference: base.stockReference)
    }

    // MARK: Attack 5 — issuer reference (1f8bcd8) fails closed.

    func testK3IssuerReferenceFailsClosed() {
        // missing entirely
        XCTAssertThrowsError(try BaseSwapGuard.validateQuote(quote(reference: .some(nil)),
            requestedTokenIn: "USDC", requestedTokenOut: "NVDAc", inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now)) { error in
            XCTAssertEqual(error as? BaseSwapSecurityError, .refused("stock reference is missing"))
        }
        // usable missing/false
        for u: Bool? in [nil, false] {
            XCTAssertThrowsError(try BaseSwapGuard.validateQuote(quote(usable: u),
                requestedTokenIn: "USDC", requestedTokenOut: "NVDAc", inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now))
        }
        // every non-pass status, including name-drift traps
        for s: String? in ["stale", "issuer-paused", "unusable", "unknown", nil,
                           "market_closed", "MARKET-CLOSED", "FRESH", "Fresh", " fresh", "fresh "] {
            XCTAssertThrowsError(try BaseSwapGuard.validateQuote(quote(status: s),
                requestedTokenIn: "USDC", requestedTokenOut: "NVDAc", inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now),
                "status \(String(describing: s)) must be refused")
        }
        // pause flags
        XCTAssertThrowsError(try BaseSwapGuard.validateQuote(quote(transferPaused: true),
            requestedTokenIn: "USDC", requestedTokenOut: "NVDAc", inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now))
        for p: Bool? in [true, nil] {
            XCTAssertThrowsError(try BaseSwapGuard.validateQuote(quote(issuerPaused: p),
                requestedTokenIn: "USDC", requestedTokenOut: "NVDAc", inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now))
        }
        // reference for ANOTHER stock attached to this quote
        XCTAssertThrowsError(try BaseSwapGuard.validateQuote(quote(referenceSymbol: "AAPLc"),
            requestedTokenIn: "USDC", requestedTokenOut: "NVDAc", inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now))
        // stale / negative age, excessive deviation, dead price/multiplier
        XCTAssertThrowsError(try BaseSwapGuard.validateQuote(quote(ageSec: 96 * 60 * 60 + 1),
            requestedTokenIn: "USDC", requestedTokenOut: "NVDAc", inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now))
        XCTAssertThrowsError(try BaseSwapGuard.validateQuote(quote(ageSec: -1),
            requestedTokenIn: "USDC", requestedTokenOut: "NVDAc", inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now))
        XCTAssertThrowsError(try BaseSwapGuard.validateQuote(quote(deviation: 5.01),
            requestedTokenIn: "USDC", requestedTokenOut: "NVDAc", inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now))
        XCTAssertThrowsError(try BaseSwapGuard.validateQuote(quote(usdPrice: 0),
            requestedTokenIn: "USDC", requestedTokenOut: "NVDAc", inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now))
        XCTAssertThrowsError(try BaseSwapGuard.validateQuote(quote(multiplier: 0),
            requestedTokenIn: "USDC", requestedTokenOut: "NVDAc", inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now))
        // the two pass cases, exactly as the server emits them
        XCTAssertNoThrow(try BaseSwapGuard.validateQuote(quote(status: "fresh"),
            requestedTokenIn: "USDC", requestedTokenOut: "NVDAc", inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now))
        XCTAssertNoThrow(try BaseSwapGuard.validateQuote(quote(status: "market-closed", ageSec: 30 * 3600),
            requestedTokenIn: "USDC", requestedTokenOut: "NVDAc", inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now))
    }

    // MARK: Attack 6 — server/client field-name drift must fail CLOSED:
    // a payload whose issuer fields are renamed decodes to nil and is refused.

    /// BaseSwapQuote is Decodable-only, so build the wire payload as a dictionary
    /// exactly as the server emits it (field names from server-base-swap.ts).
    private func quoteJSON() throws -> Data {
        let payload: [String: Any] = [
            "chainId": 8453,
            "venue": ["name": "Uniswap V3 (SwapRouter02)", "router": BaseSwapGuard.router],
            "tokenIn": ["symbol": "USDC", "name": "USD Coin", "address": BaseSwapGuard.tokenAddresses["USDC"]!, "decimals": 6],
            "tokenOut": ["symbol": "NVDAc", "name": "Coinbase Tokenized NVIDIA", "address": BaseSwapGuard.tokenAddresses["NVDAc"]!, "decimals": 8],
            "amountIn": "10", "amountInRaw": "10000000",
            "amountOut": "0.04304638", "amountOutRaw": "4304638",
            "minAmountOut": "0.04283114", "minAmountOutRaw": "4283114",
            "executionPrice": 0.004304638, "priceImpactPct": 0.3, "usdValue": 10,
            "slippagePct": 0.5, "deadline": deadline,
            "route": ["kind": "single", "fees": [3000], "description": "route", "gasEstimate": "93242"],
            "recipient": walletA, "allowanceRaw": "10000000",
            "simulation": ["ran": true, "ok": true],
            "txWithheld": [String](), "warnings": [String](),
            "limits": ["maxTicketUsd": 100, "minTicketUsd": 1, "defaultSlippagePct": 0.5,
                       "maxSlippagePct": 3, "maxPriceImpactPct": 3, "deadlineSec": 1200],
            "requiresStockEligibility": true,
            "stockReference": ["symbol": "NVDAc", "usdPrice": 231.14, "ageSec": 60,
                               "multiplierHuman": 1, "marketDeviationPct": 0.5,
                               "pausedFeatures": "0", "transferPaused": false,
                               "issuerPaused": false, "usable": true, "status": "fresh"],
        ]
        return try JSONSerialization.data(withJSONObject: payload)
    }

    func testK3ServerFieldNameDriftFailsClosed() throws {
        let good = try quoteJSON()
        // sanity: an undamaged payload round-trips and validates
        let intact = try JSONDecoder.bobby.decode(BaseSwapQuote.self, from: good)
        XCTAssertNoThrow(try BaseSwapGuard.validateQuote(intact, requestedTokenIn: "USDC", requestedTokenOut: "NVDAc",
                                                         inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now))
        // rename usable -> isUsable, status -> referenceStatus (drift scenario)
        var drifted = String(data: good, encoding: .utf8)!
        drifted = drifted.replacingOccurrences(of: "\"usable\"", with: "\"isUsable\"")
        drifted = drifted.replacingOccurrences(of: "\"status\"", with: "\"referenceStatus\"")
        XCTAssertFalse(drifted.contains("\"usable\""))
        let decoded = try JSONDecoder.bobby.decode(BaseSwapQuote.self, from: Data(drifted.utf8))
        XCTAssertEqual(decoded.stockReference?.usable, nil)
        XCTAssertEqual(decoded.stockReference?.status, nil)
        XCTAssertThrowsError(try BaseSwapGuard.validateQuote(decoded, requestedTokenIn: "USDC", requestedTokenOut: "NVDAc",
                                                             inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now))
        // whole stockReference key renamed -> missing -> refused
        let noRef = String(data: good, encoding: .utf8)!.replacingOccurrences(of: "\"stockReference\"", with: "\"reference\"")
        let decoded2 = try JSONDecoder.bobby.decode(BaseSwapQuote.self, from: Data(noRef.utf8))
        XCTAssertNil(decoded2.stockReference)
        XCTAssertThrowsError(try BaseSwapGuard.validateQuote(decoded2, requestedTokenIn: "USDC", requestedTokenOut: "NVDAc",
                                                             inputAmount: "10", slippagePct: 0.5, wallet: walletA, now: now))
    }
}

final class K3BP05AdversarialTests: XCTestCase {
    private let pending = PendingRPC(id: "right(1701)", topic: "topic-A", chain: "eip155:8453",
                                     method: "eth_sendTransaction", account: "0xabc")

    func testK3IdOfADifferentPendingRequestIsRejected() {
        // two sequential requests (approval right(1700) done, swap right(1701) pending):
        // a LATE approval response must not complete the swap request
        XCTAssertNotEqual(RPCCorrelator.check(responseID: "right(1700)", responseTopic: "topic-A",
                                              responseChain: "eip155:8453", pending: pending), .accepted)
        // near-miss ids
        for id in ["right(1701 )", " right(1701)", "right(1702)", "Right(1701)", "right(1701)\n", ""] {
            XCTAssertNotEqual(RPCCorrelator.check(responseID: id, responseTopic: "topic-A",
                                                  responseChain: "eip155:8453", pending: pending), .accepted,
                              "id \(id.debugDescription) must not be accepted")
        }
    }

    func testK3ChainAndTopicTricksAreRejected() {
        // prefix/suffix chain confusion (8453 vs 84532, 1, trailing space)
        for chain in ["eip155:84532", "eip155:845", "eip155:1", "eip155:8453 ", " eip155:8453", "EIP155:8453", "eip155:8453\n"] {
            XCTAssertEqual(RPCCorrelator.check(responseID: "right(1701)", responseTopic: "topic-A",
                                               responseChain: chain, pending: pending), .unrelated("chain mismatch"),
                           "chain \(chain.debugDescription) must be rejected")
        }
        // nil topic does not excuse a wrong chain
        XCTAssertEqual(RPCCorrelator.check(responseID: "right(1701)", responseTopic: nil,
                                           responseChain: "eip155:1", pending: pending), .unrelated("chain mismatch"))
        // nil chain does not excuse a wrong topic
        XCTAssertEqual(RPCCorrelator.check(responseID: "right(1701)", responseTopic: "topic-B",
                                           responseChain: nil, pending: pending), .unrelated("topic mismatch"))
        // case-variant topic
        XCTAssertEqual(RPCCorrelator.check(responseID: "right(1701)", responseTopic: "Topic-A",
                                           responseChain: "eip155:8453", pending: pending), .unrelated("topic mismatch"))
    }

    func testK3ResultShapeIsBoundToMethodStrictly() {
        let sig = "0x" + String(repeating: "a", count: 130)
        let hash = "0x" + String(repeating: "b", count: 64)
        // cross-method confusion both ways
        XCTAssertFalse(RPCCorrelator.resultLooksValid(hash, method: "personal_sign"))
        XCTAssertFalse(RPCCorrelator.resultLooksValid(sig, method: "eth_sendTransaction"))
        // eth_signTypedData (and any other method) is not an accepted shape at all
        XCTAssertFalse(RPCCorrelator.resultLooksValid(sig, method: "eth_signTypedData"))
        XCTAssertFalse(RPCCorrelator.resultLooksValid(sig, method: "eth_sign"))
        // length / alphabet / prefix tricks
        XCTAssertFalse(RPCCorrelator.resultLooksValid("0x" + String(repeating: "a", count: 129), method: "personal_sign"))
        XCTAssertFalse(RPCCorrelator.resultLooksValid("0x" + String(repeating: "a", count: 131), method: "personal_sign"))
        XCTAssertFalse(RPCCorrelator.resultLooksValid("0X" + String(repeating: "a", count: 130), method: "personal_sign"))
        XCTAssertFalse(RPCCorrelator.resultLooksValid("0x" + String(repeating: "g", count: 130), method: "personal_sign"))
        XCTAssertFalse(RPCCorrelator.resultLooksValid("", method: "personal_sign"))
        XCTAssertFalse(RPCCorrelator.resultLooksValid(String(repeating: "b", count: 64), method: "eth_sendTransaction"))
        XCTAssertFalse(RPCCorrelator.resultLooksValid("0x" + String(repeating: "b", count: 64) + "\n", method: "eth_sendTransaction"))
        // uppercase hex is legitimate and accepted
        XCTAssertTrue(RPCCorrelator.resultLooksValid("0x" + String(repeating: "A", count: 130), method: "personal_sign"))
        XCTAssertTrue(RPCCorrelator.resultLooksValid("0x" + String(repeating: "B", count: 64), method: "eth_sendTransaction"))
    }
}
