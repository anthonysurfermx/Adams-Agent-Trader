# B20 second wave — where the liquidity actually is (2026-09-07)

Base announced six more Coinbase Tokenized Stocks on 2026-09-04: AMZNc, MSFTc, MSTRc,
SNDKc, SPCXc, TSLAc. This note records, block-pinned and read-only, whether Bobby's
current rail (Uniswap V3 SwapRouter02, direct USDC pools) can execute them under the
existing guards (5% reference deviation, 3% price impact), and where the liquidity
really sits. No wallet, approval, signature or swap was made.

## Findings

Uniswap V3 direct USDC pools, block **50988803** (`scripts/check-b20-catalog.mts`,
evidence `2026-09-07-b20-second-wave-preflight.json`), buy of 100 USDC:

| Token | Uniswap pool | Buy deviation | Impact | Verdict under current guards |
|---|---|---:|---:|---|
| TSLAc | 1% fee, liq 6.6e10 | 1.34% | 1.08% | executable |
| MSTRc | 1% fee, liq 4.9e10 | 2.21% | 1.17% | executable |
| SPCXc | 1% fee, liq 4.5e11 (0.3% pool is thin: 9.1% impact at $100) | 3.26% | 1.02% | executable (per-quote route selection keeps the 1% pool) |
| MSFTc | 1% fee, liq 6.2e10 | 4.43% (8.1% on 2026-09-05) | 1.07% | borderline — listed, guards decide per quote |
| AMZNc | 1% fee, liq 5.9e10 | 10.6% | 1.10% | **not listed** — fails the 5% guard on every venue |
| SNDKc | 1% fee, liq **0** | — | — | **not listed** — no active liquidity |

Aerodrome Slipstream (factory `0xf8f2eB4940CFE7d13603DDDD87f123820Fc061Ef`, tick spacing 10,
0.05% fee), same day, quoter `0x514c8B5f54112481E28028F1166Bd78501089259`:

| Token | Slipstream pool (ts 10) | Active liquidity | Buy $100 vs reference | Round trip $100 |
|---|---|---:|---:|---:|
| AMZNc | 0xd03Bc8C7…6E9b | 3.27e12 | +8.93% | −0.10% |
| MSFTc | 0x7103eB3c…5D54 | 2.68e11 | +2.39% | −0.13% |
| MSTRc | 0x8b27f626…10E2 | 3.39e12 | +1.12% | −0.10% |
| SNDKc | 0x5A8236f5…246E | 1.99e11 | +3.14% | −0.12% |
| SPCXc | 0x0bf58fe0…8c0E | 4.28e12 | +1.68% | −0.10% |
| TSLAc | 0x469337fD…a7BB | 2.03e12 | +0.47% | −0.11% |
| NVDAc | 0x853F5f1B…7ab9 | 5.01e14 | — | −0.10% |
| AAPLc | 0xA3b1E3f9…94F0 | 1.59e14 | — | — |

For comparison the Uniswap pools Bobby routes through today: NVDAc 0.3% pool liq 4.2e11,
AAPLc 0.3% pool 1.4e11, METAc 0.3% pool 6.0e10, GOOGLc 1% pool 1.6e12.

## What this means

1. **The B20 launch liquidity lives on Aerodrome Slipstream**, not Uniswap. Every B20 token,
   including SNDKc, has a ts-10 Slipstream/USDC pool with one to three orders of magnitude
   more active liquidity than its Uniswap pool, and a $100 round trip costs ~0.10% there
   versus ~2% on the Uniswap 1% pools (two 1% legs). This matches Base's own framing that
   Aerodrome incentives were used to bootstrap stock liquidity.
2. **Reference deviation is venue-independent**: AMZNc is 9–11% above the Chainlink reference
   on both venues (reference age ~60 h — the feed runs 24/5 and this was read on a Monday
   before the US open). The 5% guard is doing its job; do not lower it to list Amazon.
3. **Today's rail can list four of the six** (TSLAc, MSTRc, SPCXc, MSFTc) with no code change
   beyond the catalogue. The other two need either Slipstream as a venue (SNDKc) or a
   narrower reference gap (AMZNc).

## Recommendation (product decision, not made here)

Add Aerodrome Slipstream as a second quoted venue with per-quote best-route selection.
`feat/base-builder-quest` already carries a reviewed quote + calldata path for Slipstream
(`api/_lib/b20.ts`: factory/router/quoter pinned, ts 10). Doing so re-opens the swap-rail
part of the security review (BP-01 binds router/spender to the pinned Uniswap addresses,
the calldata decoders and the iOS guards are Uniswap-shaped), so it should be scoped as
its own round after GO 3/3, not folded into the current release.

## Parity note

iOS (`codex/ios-base-swaps`) pins its own four-token allow-list by address and fails closed
on anything else; it will simply not offer the four new tokens until its list is updated
and its 18 guard tests re-run. That is the intended direction of failure.
