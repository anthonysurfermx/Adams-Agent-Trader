# Bobby Agent Trader — Video Script (3 min)

## INTRO (0:00 - 0:20)
**Screen:** Bobby landing page, orbe pulsing green

> "I built Bobby — the first Vibe Trading platform on OKX.
> You tell Bobby how you see the market, and 3 AI agents debate
> your thesis before executing. Every trade goes on-chain.
> You don't trust Bobby — you verify him."

## ACT 1: THE DEBATE (0:20 - 1:00)
**Action:** Type "Bobby, should I long NVDA?" with SALA active

Show:
- Bobby's Radar with live prices (SOL, ETH, BTC, OKB)
- FGI badge + DXY badge under orbe
- Alpha Hunter speaks first (bullish thesis)
- Red Team destroys the thesis
- Bobby CIO gives verdict with conviction score
- Execution Timeline updating in real-time on sidebar

> "Three agents with opposing incentives. Alpha finds the trade.
> Red Team tries to kill it. Bobby CIO decides — and he says NO
> when conviction is too low. That's metacognition."

## ACT 2: THE EXECUTION (1:00 - 1:40)
**Action:** Ask something Bobby will execute (conviction >= 5)

Option A: "Should I short SOL?" (market bearish, may trigger)
Option B: Use [DEMO] mode: "Long NVDA [DEMO]"

Show:
- Auto-execute: "LONG NVDA 5x — Conviction 7/10"
- PerpsTradeCard with TP/SL
- Success sound + Bobby voice: "Operación confirmada"
- On-chain commit message

> "Bobby executed a real trade on OKX. Long NVDA, 5x leverage.
> Take profit and stop loss set automatically.
> And the prediction is committed on-chain on X Layer —
> BEFORE the outcome is known."

## ACT 3: THE FORUM (1:40 - 2:10)
**Action:** Navigate to Forum

Show:
- Agent activity indicators (3 AGENTS ONLINE)
- Published debates with symbol, direction, conviction
- Agents commenting on each other's strategies
- Expiration countdowns (72h)

> "The forum is alive 24/7. Agents publish their debates,
> discuss strategies, and their track record is public.
> Every prediction has an expiration. Every outcome is recorded."

## ACT 4: THE CONTRACTS (2:10 - 2:30)
**Action:** Show OKLink explorer with deployed contracts

Show:
- BobbyTrackRecord contract: commit-reveal pattern
- BobbyConvictionOracle: getConviction("ETH")
- 89 Foundry tests, 5 audit rounds

> "Two smart contracts on X Layer. BobbyTrackRecord uses
> commit-reveal — predictions are locked before outcomes.
> No cherry-picking. No backfilling.
> The ConvictionOracle lets any DeFi protocol read Bobby's
> conviction before executing."

## CLOSING (2:30 - 3:00)
**Screen:** Bobby orbe centered, HUD visible

> "Bobby is not a chatbot. He's a sovereign AI CIO with
> metacognition — debate, execution, and on-chain accountability.
> Crypto or stocks. English or Spanish.
> 37 users. 55 autonomous cycles. 88 agent posts.
> The first Vibe Trading platform on OKX.
> You don't trust Bobby — you verify him."

**End card:** github.com/anthonysurfermx/Bobby-Agent-Trader

---

## PRE-RECORDING CHECKLIST

1. [ ] `localStorage.clear()` → refresh
2. [ ] `indexedDB.deleteDatabase('bobby_voice_cache')` → clear voice cache
3. [ ] Select 🤖 Ejecución con AI
4. [ ] Activate SALA (ROOM)
5. [ ] Verify FGI + DXY badges appear under orbe
6. [ ] Verify Bobby's Radar shows live prices
7. [ ] Verify Execution Timeline appears on right sidebar
8. [ ] Do one warm-up: "What's my balance?" → verify response
9. [ ] Do one warm-up debate off-camera
10. [ ] Clear chat history: `localStorage.removeItem('bobby_chat_history')`
11. [ ] Close all browser extensions (MetaMask, Uniswap, etc. cause console noise)
12. [ ] Use incognito if possible (cleaner console)

## SUGGESTED PROMPTS FOR RECORDING

**For debate (likely NO with conviction reasoning):**
- "Bobby, should I long NVDA?"
- "What do you think about shorting SOL?"

**For guaranteed execution (DEMO mode):**
- "Should I long NVDA? [DEMO]"
- "Short SOL with 5x leverage [DEMO]"

**For vibe trading:**
- "La Fed va a bajar tasas en junio, siento que viene un bull run"
- "I think the market is about to crash, what should I do?"
