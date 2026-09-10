<div align="center">

# Bobby Protocol

### *Refuted before execution. Published before the outcome.*

**The verification layer for AI market opinions — live on Base.**

[![Live](https://img.shields.io/badge/Live-bobbyprotocol.xyz-0052ff?style=for-the-badge)](https://bobbyprotocol.xyz)
[![Base mainnet](https://img.shields.io/badge/Base_mainnet-7_contracts_·_chain_8453-0052ff?style=for-the-badge)](https://basescan.org/address/0x822DB0DbbCAB398e610fcBA86DA9BB92d2493321)
[![MCP](https://img.shields.io/badge/MCP-11_public_tools-1f6feb?style=for-the-badge)](https://bobbyprotocol.xyz/protocol/docs)
[![Safe 2-of-3](https://img.shields.io/badge/Owner-Safe_2--of--3-12b981?style=for-the-badge)](https://basescan.org/address/0x8BE60853F27b944e11486285d95c3e06596553b4)

</div>

## What Bobby is

Anyone can ask an AI about an asset and get a fluent, confident answer with zero consequences. If it is wrong, nothing happens and nobody writes it down. Asking an AI is no longer an advantage; **verifying** is.

Bobby is that verification layer. Before a user sees an answer, three agents argue it out: **Alpha Hunter** builds the thesis, **Red Team** tries to break it, **CIO** decides. A deterministic risk gate can veto the result. If nothing survives, the verdict is *no trade* — the answer a model that always answers will never give you.

Every verdict is committed **before the market resolves it**, so the track record is falsifiable instead of marketing. Losses are published, not filtered.

**The two rules**

1. No idea is approved without an independent system working against it.
2. No verdict is published after its outcome is known.

Bobby runs on the same commercial models everyone else uses. The difference is not the model; it is the procedure around it.

## What is live (2026-09-10)

| Surface | Status |
|---|---|
| **Public record** | 863 debates · 793 resolved · 54.5 % hit rate (432 W / 244 L / 117 BE) · 91.9 % resolution — live at [`/api/bobby-protocol-stats`](https://bobbyprotocol.xyz/api/bobby-protocol-stats), rendered on [`/protocol`](https://bobbyprotocol.xyz/protocol) |
| **On-chain record (Base)** | `BobbyTrackRecord` V2 open since the September cut-over; first commitment created and resolved. The published record is being migrated forward, not backfilled — we do not claim on-chain history we cannot prove. |
| **Execution** | Users swap Base assets — including Coinbase's tokenized equities — through **Uniswap V3 from their own wallet**. First real swap 2026-09-09: 1 USDC → 0.00443554 NVDAc, [tx `0xfaa897…de670`](https://basescan.org/tx/0xfaa8977480f5f77c18aa50f34dbc18f7200d5fb51b97263a21fbed9fabede670). Swaps run under a $1 canary cap until the security review closes. |
| **Agent interface** | MCP server with 11 public tools, plus a paid tier settled on Base (below). |
| **Apps** | Web ([the Desk](https://bobbyprotocol.xyz/desk)), iOS (TestFlight), Telegram bot. |

Bobby **never signs a transaction and never custodies funds.** It prepares bounded calldata, the user's wallet signs, and only confirmed receipts enter the ledger.

## Contracts — Base mainnet (8453)

All seven are owned by the production Safe, **2-of-3**: [`0x8BE60853F27b944e11486285d95c3e06596553b4`](https://basescan.org/address/0x8BE60853F27b944e11486285d95c3e06596553b4).

| Contract | Address | Role |
|---|---|---|
| BobbyTrackRecord V2 | [`0x822DB0DbbCAB398e610fcBA86DA9BB92d2493321`](https://basescan.org/address/0x822DB0DbbCAB398e610fcBA86DA9BB92d2493321) | Fixes the time of entry **before its price exists**, verifies entry and exit through Pyth/Hermes, keeps price-verified outcomes separate from attested claims |
| BobbyConvictionOracle | [`0x27f51D711171c830dd796D4B03914a8C6c46D75e`](https://basescan.org/address/0x27f51D711171c830dd796D4B03914a8C6c46D75e) | Pre-execution conviction commitments, readable by any contract |
| BobbyAgentEconomyV2 | [`0x009de59e0e7f4109fF9E89E744A4412082AD2aaF`](https://basescan.org/address/0x009de59e0e7f4109fF9E89E744A4412082AD2aaF) | Native-fee settlement for paid MCP calls (x402) |
| BobbyAdversarialBounties | [`0x73fD6c77ff0403Ea071e8721c76f88cE34ac9968`](https://basescan.org/address/0x73fD6c77ff0403Ea071e8721c76f88cE34ac9968) | Pay to break Bobby's own reasoning; challengers submit evidence, resolver settles |
| HardnessRegistry | [`0x15800F40b8988765AD3F46030B73bC8109A793f5`](https://basescan.org/address/0x15800F40b8988765AD3F46030B73bC8109A793f5) | Difficulty-weighted decision scoring |
| BobbyAgentRegistry | [`0xB3137D7afE26fbdBcAA95573C7A20be896efde93`](https://basescan.org/address/0xB3137D7afE26fbdBcAA95573C7A20be896efde93) | ERC-721 staked agent identities |
| BobbyIntentEscrow | [`0x5D9d534419421B7Edfe9Bb509E4c48512256BC97`](https://basescan.org/address/0x5D9d534419421B7Edfe9Bb509E4c48512256BC97) | Attested-intent ledger, isolated from verified calls |

Deployment manifest: [`contracts/deployments/8453.json`](contracts/deployments/8453.json). Live heartbeat: [`/protocol/heartbeat`](https://bobbyprotocol.xyz/protocol/heartbeat). Chain provenance (live / canary / archive): [`/api/registry`](https://bobbyprotocol.xyz/api/registry).

## Connect an AI agent

One command for any MCP-compatible client:

```bash
claude mcp add bobby-trader https://bobbyprotocol.xyz/api/mcp-bobby
```

Or hand any model the integration guide: **https://bobbyprotocol.xyz/llms.txt**

```bash
# Discover the live schema — do not trust a hardcoded list
curl -s -X POST https://bobbyprotocol.xyz/api/mcp-bobby \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Public track record, no auth
curl -s -X POST https://bobbyprotocol.xyz/api/mcp-bobby \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"bobby_stats","arguments":{}}}'
```

**Public endpoint — `/api/mcp-bobby` (11 tools, free):**
`bobby_analyze` · `bobby_debate` · `bobby_ta` · `bobby_intel` · `bobby_uniswap_quote` · `bobby_stats` · `bobby_wallet_balance` · `bobby_wallet_portfolio` · `bobby_security_scan` · `bobby_dex_trending` · `bobby_dex_signals`

**Paid tier — `/api/mcp-http` (x402 on Base):** the same engine plus `bobby_judge`, bounty and b1nary-wheel tools. Premium calls return a JSON-RPC `-32402` challenge; the agent pays the current on-chain fee (0.000025 ETH at the time of writing) to `BobbyAgentEconomyV2.payMCPCall(challengeId, toolName)` and retries with the proof. `GET /api/mcp-http` returns the live price list.

Solidity consumers can read conviction directly:

```solidity
interface IBobbyOracle {
    function getConviction(string calldata symbol)
        external view returns (uint8 direction, uint8 conviction, uint96 entryPrice, bool active);
}
IBobbyOracle oracle = IBobbyOracle(0x27f51D711171c830dd796D4B03914a8C6c46D75e);
```

## How a decision moves

```
signal ──▶ debate ──▶ risk gate ──▶ commit on Base ──▶ (user-signed execution) ──▶ resolve vs oracle
           Alpha      size, downside,   TrackRecord     Uniswap V3, own wallet,      Pyth/Hermes evidence;
           Red Team   invalidation      before price    Bobby never signs            permissionless challenge
           CIO        pass·park·block   exists
```

Everything the pipeline emits — signals, debates, guardrails fired, receipts, MCP calls — streams to the [harness console](https://bobbyprotocol.xyz/protocol/harness). The [sandbox](https://bobbyprotocol.xyz/protocol/sandbox) runs the full debate on live data without moving capital.

## Repository map

```
api/                Vercel serverless functions (debate cycle, MCP servers, swap rail, protocol stats)
api/_lib/           chains, protocol payments, write-safety latches, LLM wrapper
src/                React 18 + TypeScript + Vite front end (Desk, /protocol pages, Trader Land)
contracts/          Foundry — Solidity sources, tests, deployment manifests, Safe batches
public/llms.txt     integration guide served to AI agents
docs/audit/         audit rounds, runbooks, cut-over records
docs/infra/         launch-readiness, migration gates, evidence
scripts/            test gates (api security, record auth, write safety, risk gate, commit policy)
```

## Running locally

```bash
git clone https://github.com/anthonysurfermx/Bobby-Agent-Trader.git
cd Bobby-Agent-Trader
npm install
cp .env.example .env.local   # fill from your own providers; nothing here is committed
npm run dev
```

```bash
npm run build                 # type-checks the API and builds the front end — run before every push
cd contracts && forge test    # contract suite
```

## Security posture

- **Bobby is never a signer.** Quotes are public; a write requires wallet-session proof, origin and rate-limit checks, an explicit operations switch, eligibility gates and the user's own signature.
- **Every `.sol` ships only after three review rounds** (self, adversarial, external). Rounds and findings live in [`docs/audit/`](docs/audit/); the TrackRecord V2 release closed four P1 integrity issues before freeze.
- **Production ownership sits with a 2-of-3 Safe**, not an EOA. Legacy-chain writers are disabled by a fail-closed latch (`api/_lib/protocol-write-safety.ts`).
- Backend: isolated Supabase project, RLS on every user-facing table, SIWE auth, a release gate of scripted checks and a rehearsed rollback.

## History

Bobby started in April 2026 as an entry to the OKX X Layer Build X hackathon. In September 2026 the protocol was rebuilt and redeployed on **Base**, which is now its only production chain. The X Layer contracts remain as a **read-only archive** (`/api/registry` → `provenance.archive`); nothing is written there and none of the numbers above come from it.

## Team

**Anthony Chávez** — founder. Ex-Uniswap Labs, ex-OKX, founder of DeFi México.
[GitHub](https://github.com/anthonysurfermx) · [X](https://x.com/bobbyprotocol)

---

<div align="center">

*Refuted before execution. Published before the outcome.*

</div>
