# Third-round independent security review — Kimi K3 (CLI)

Target: `security/remediation-r2` @ `a1055e9` (isolated clone, working tree clean before and after).
Brief: `docs/security/2026-09-05-third-round-brief.md`. Method: pin → every gate command →
per-finding exploit re-derivation (scratch only, `/tmp/kimi-k3-review/`) → deployment review.
Nothing was deployed, migrated, signed, pushed, or flipped. The only writes outside /tmp were
`forge script`'s own dry-run manifest overwrite of `contracts/deployments/8453.json` during the
reviewed-env simulation — restored byte-identical (md5 `a0b6eb93…` before and after;
`git status --porcelain` empty at the end).

Local toolchain: forge **1.5.1-stable** (CI pins 1.8.1 — counts recorded with this version),
node v25.9.0. Scratch Postgres at `postgres://postgres@127.0.0.1:54329/postgres` **was reachable**,
so the three `*-pg` suites RAN. iOS branch absent (`ls ios` → No such file; `git ls-tree HEAD ios/`
empty) → BP-02 / BP-05 INCONCLUSIVE as instructed.

## 0. Pin (gate for everything below)

Clean build (`cd contracts && forge clean && forge build`), then:

```
node -e 'const a=require("./contracts/out/HardnessRegistry.sol/HardnessRegistry.json");
const b=Buffer.from(a.deployedBytecode.object.replace(/^0x/,""),"hex");
const {keccak256}=require("viem"); console.log(b.length, keccak256("0x"+b.toString("hex")))'
→ 23471 0x3449ac0707c855588a1a0df8d45bddbd04aabfb1e35cb66f7a704006b043e0d5
```

**PIN MATCHES**: 23,471 B, `0x3449ac07…b043e0d5`. No reset.

## 1. Commands-to-execute gate (all run, in order; full log `/tmp/kimi-k3-review/gate.log`)

| Command | Result (forge 1.5.1 / node 25.9.0) |
|---|---|
| `npm ci` | skipped per brief (node_modules present) |
| `forge build` | exit 0 |
| `check-sizes.sh` | **7/7** within EIP-170 (TrackRecordV2 24,094 B / margin 482; HardnessRegistry 23,471 B / 1,105; other five far below) |
| `forge test --fuzz-runs 1000` | **286/286 across 14 suites**, 0 failed |
| `check-layout.sh` | OK (storage + struct-member layout matches baseline) |
| `forge test --match-contract DeploymentGatesTest` | **37/37** |
| `gen:hardness-abi` + `git diff --exit-code` (both ABI files) | exit 0, no drift |
| `test:hardness-abi-anvil` / `test:bounties-abi-anvil` | both pass |
| `test:rls-lockdown-pg` / `test:swap-ledger-pg` / `test:agent-registry-pg` (DATABASE_URL set) | all pass on the scratch Postgres |
| `CI=true npx tsx scripts/test-rls-lockdown-pg.mts` without DATABASE_URL | **exit 1** as required |
| `test:remediation-r2` | **45/45** |
| `test:rpc-redaction` | exit 0, **27 executed check blocks** (3 intro + 4 endpoints × 5 failure modes + stale-replay + scrubber + raw-error + helpers). The docs say "28 checks" — an off-by-one in the documentation; no behavior is missing (scripts/test-rpc-redaction.mts:104,152,166,176,192,203). Noted, not a reopen. |
| `test:mcp-payment-transport` | **13/13** |
| `test:base-swap` / `test:stock-ticker-routing` | pass / pass |
| `test:api-security` (dummy BOBBY_SUPABASE_* env) | **47/47** |
| `test:protocol-write-safety` | pass — executes `--phase=postdeploy` on a finalize-shaped manifest (GO) and on a stripped one (NO-GO "exactly one setTreasury(address) call") |
| `check:api` / `lint -- --quiet` / `npm run build` | exit 0 / exit 0 / built in 16.58s |

## 2. Round-13 reopens (attacked first)

### BP-01 (reopen) — execution view bound to the validated quote
- **Fix**: `src/lib/base-swap/quote-guard.ts:188-211` (`assertExecutionViewConsistent`), called on
  build and again inside `validated()` before each signature (`src/components/adams/SwapConfirm.tsx:174-175,186-187`);
  MIN RECEIVED renders from the validated full quote (`SwapConfirm.tsx:294,319`), pre-build preview labelled `≈`.
- **Exploit** (`/tmp/kimi-k3-review/bp01-exploit.mts`, exit 0, 10/10): the K03 reproduction — honest
  full quote (25 USDC → 0.0004 NVDAc, min 0.000398) with a lying reduced view (`minReceived: '0.001'`) —
  **refused** (`execution view differs … (minReceived)`). My additional variants refused:
  `disclosure.tokenContract` lie, `disclosure.spender` lie, `approveTx.to` mismatch. Boundary probes:
  min-out off by one wei refused; slippage ±1e-8 refused (±1e-10 tolerated — no economic effect, the
  minimum is derived from the *request's* slippage); deadline `now+15` refused, `now+16` accepted.
- **Non-vacuity**: the same script's pre-fix reconstruction (validate full quote, render the reduced
  view unbound) prints `shown 0.001, signed 39800` — the attack succeeds exactly as the finding
  describes; `scripts/test-base-swap.mts:216-226` asserts the refusal for 11 lying views incl. K03/K03b.
- **Verdict: CLOSED.** Observation (P3, display-only, no signature impact): `quote.executionPrice`
  (`SwapExecutor.tsx:305`) and `disclosure.priceImpactPct` (`SwapConfirm.tsx:320`) are rendered but not
  bound by the guards; the signed economics (amounts, min received, recipient, deadline, router) are
  all bound, so this is cosmetic inconsistency, not a consent defect.

### BP-08 (reopen) — uuid↔bytes32 mapping; failure is retryable, never a stored result
- **Fix**: `api/_lib/challenge-id.ts` (canonical mapping, strict inverse, zero-tail required);
  `verifyMcpPaymentTx` decodes before any DB read (`api/_lib/protocol-payments.ts:384-385`);
  transports refuse a non-canonical id pre-DB (`api/mcp-http.ts:916`, `api/mcp-bobby.ts:306`);
  claim/replay/fail lifecycle in `api/_lib/mcp-challenges.ts:119-172`.
- **Exploit** (`/tmp/kimi-k3-review/bp08-exploit.mts`, exit 0, 16/16) against the repo's uuid-typed
  PostgREST emulation (`scripts/harness/postgrest-emu.mts:26-30` throws 22P02 on a non-uuid literal):
  - **Pre-fix reproduction executed**: PATCH with the raw bytes32 as `challenge_id=eq.…` → HTTP 400
    `22P02` — the honest payer was refused after paying; the fixed `bytes32ToChallengeId` decodes the
    same bytes32 to the uuid.
  - Non-canonical bytes32 (no zero tail) → decodes to null, **zero DB reads**.
  - Wrong secret → refused; right secret + different request args → refused, row stays `pending`;
    replay after completion returns the stored result with no re-execution; stranger replay refused
    without leaking the result; tool failure → `retryable_failure`, same client retries without a
    second payment; stale in_progress boundary (4 min refused / 6 min reclaimed); expired refused;
    one tx hash cannot claim two challenges (UNIQUE `tx_hash` → 23505 → refusal).
- **Closure test**: `npm run test:mcp-payment-transport` 13/13 (gate), drives BOTH real handlers end
  to end. `atomicConsumeChallenge` survives only as dead code in `api/_lib/mcp-challenges.ts:178`
  (grep: no transport or endpoint calls it; remediation-r2:513-518 source-scan enforces this).
- **Verdict: CLOSED.**

### BP-03 (reopen) — EnvGate strict parsers; fork simulations
- **Pre-fix hazard confirmed empirically** (scratch foundry project
  `/tmp/kimi-k3-review/envprobe/`, forge 1.5.1): `PROBE_V2=3O forge script script/Probe.s.sol`
  prints `envOr returned: 60` — `vm.envOr` silently substitutes the default for a set-but-unparseable
  value. That is the whole bug.
- **Fix verified by reading**: `_v2Raw()` reads all seven `V2_*` through `EnvGate.uintOr`
  (`DeployBase.s.sol:156-174`), `requireSet` on all seven when `block.chainid == 8453` (:164-166);
  `V2ParamsGate.validate` full-width in `_validateConfig` (:363, pre-broadcast at :203 before
  `vm.startBroadcast()` at :254); `narrow` is the only path into the constructor
  (`grep new BobbyTrackRecordV2(` → script: only `DeployBase.s.sol:249→256`); post-deploy
  `assertMatches(live, reviewed)` (:409); `VerifyBaseDeployment._verifyV2Params` requires the
  `v2Params` block on 8453 and re-validates reviewed values even when the chain agrees
  (`VerifyBaseDeployment.s.sol:193-213`); readiness bounds-checks all seven at full width and
  cross-checks the manifest (`scripts/check-mainnet-readiness.mts:195-211, 358-363`). Gate bounds
  mirror `BobbyTrackRecordV2._validateParams` (contracts/src/BobbyTrackRecordV2.sol:1310-1326)
  exactly, incl. `challengeWindowSec > PYTH_ACTIVATION_DELAY`.
- **Narrowing arithmetic** (node): `65596` → uint16 `60` and `604800+2²⁴` → uint24 `604800` would
  have deployed on the old narrow-first path; both are now rejected at full width (width check fires
  first). `172800` (== 2 days) rejected by the strict `>` bound.
- **Fork simulation against the public Base RPC** (`https://mainnet.base.org`, read-only):
  - Malformed: `set -a; source deploy/base-mainnet.env.example; set +a; V2_ENTRY_WINDOW_SEC=3O
    forge script script/DeployBase.s.sol --rpc-url base --sender $DEPLOYER_ADDRESS`
    → **exit 1**, `vm.envUint: failed parsing $V2_ENTRY_WINDOW_SEC as type uint256` — the trace shows
    only `envExists`/`envUint` staticcalls, **zero CREATE/broadcast** (`grep -c "CREATE" = 0`);
    manifest untouched (md5 unchanged).
  - Reviewed env: same command without the override → **exit 0**, `post-deploy assertions: ALL PASSED`,
    manifest written (carries `v2Params`, `treasury`, `challengeBondWei`), then restored
    byte-identical. `SafeOwnerGate.validate` read the live Safe (codehash/singleton) successfully.
  - DeploymentGatesTest 37/37 (gate) includes the `3O`/`-5`/`60.0`/`1e80`/`abc`/`""` revert matrix
    (`contracts/test/DeploymentGates.t.sol:525-551`).
- **Verdict: CLOSED.** Noted: the one surviving `vm.envOr` (`RESOLVER_ADDRESSES`,
  `DeployBase.s.sol:226`) can still fall back silently, but on 8453 the fallback 1-of-1 then fails
  the explicit `>= 3 resolvers / threshold >= 2` requires (:233-236) — fail-closed where it matters.

### BP-06 (reopen) — CI actually executes the gates; check-sizes coupled to DeployBase
- **CI verified line by line** (`.github/workflows/ci.yml`): `application` job carries the job-level
  dummy `BOBBY_SUPABASE_*` env (:21-24) and runs test:base-swap, test:stock-ticker-routing,
  test:remediation-r2, test:rpc-redaction, test:mcp-payment-transport, build, lint, audit — no
  `continue-on-error`; `integration` job declares `postgres:17` on 54329 + submodules and runs
  forge build, both anvil suites, all three pg suites; `contracts` job order is build → check-sizes
  → `forge test --fuzz-runs 1000` → check-layout; triggers: `pull_request`, push to `main` +
  `security/**`, `workflow_dispatch`.
- **Module-load crash reproduced and its fix confirmed load-bearing**:
  `env -u BOBBY_SUPABASE_URL -u BOBBY_SUPABASE_SERVICE_ROLE_KEY -u BOBBY_SUPABASE_ANON_KEY CI=true
  npx tsx scripts/test-api-security.mts` → exit 1, `BobbyDbConfigError: database URL is not
  configured`. With the brief's dummy env (what the CI job sets): 47/47 (gate).
- **Drift probe** (`/tmp/kimi-k3-review/bp06/`, using the repo's unmodified `check-sizes.sh` against
  scratch copies of `DeployBase.s.sol`): an added `new SneakyNinth(` → `INVENTORY DRIFT`, exit 1;
  a removed `new BobbyAgentRegistry(` → `INVENTORY DRIFT`, exit 1; clean copy → drift check passes
  and missing artifacts fail (`MISSING:`, exit 1). Repo run: 7/7 OK exit 0 (gate).
- **pg CI guards**: all three `*-pg` scripts with `CI=true` and no `DATABASE_URL` → exit 1.
- **GitHub run id**: NOT citable from this clone — `git remote -v` is empty and
  `gh run list --branch security/remediation-r2` fails with "no git remotes found". The workflow
  file itself is verified above; the run-id citation remains a remote-side evidence gap (no bearing
  on the code).
- **Verdict: CLOSED** (with the run-id citation marked UNVERIFIABLE locally).

### Readiness ↔ finalize receipt mismatch (deploy-review P2)
- **Fix verified by reading both sides**: readiness expects exactly 12 CALL receipts — 1
  `setHardnessScorer` + 2 `setTreasury` + 2 bond calls + 7 `transferOwnership` — each matched on
  `to`, `function`, first argument AND `inputHash` recomputed with the same ethers `Interface`
  encodings finalize uses (`check-mainnet-readiness.mts:414-470` vs
  `scripts/finalize-base-manifest.mts:87-118,197` where `inputHash = keccak256(liveTransaction.input)`);
  any extra/duplicate non-CREATE call fails (:468-470). `DeployBase` produces exactly these 12 calls
  (`BountyEconomicsGate.configure` at :294 → 4 CALLs; scorer + 7 handoffs).
- **Executed** (gate): `test:protocol-write-safety` runs `--phase=postdeploy` on a finalize-shaped
  19-receipt manifest → GO, and on one with the treasury/bond receipts removed → NO-GO.
- **Verdict: CLOSED.**

### BP-12 (reopen) — scrubber vs ethers/viem/encoded/bare echoes
- **Fix**: `api/_lib/rpc-redact.ts` (fragments of every configured URL incl. userinfo, each path
  segment, each query value, percent-encoded copies, longest-first; `requestUrl:`/`URL:` masking;
  generic URL-shaped token masking; `parseRpcJson` never leaks a body).
- **Exploit** (`/tmp/kimi-k3-review/bp11-bp12-exploit.mts`, 21 substantive checks ok; one initial
  FAIL was my own wrong assertion about the payload shape — the real payload nests nulls under
  `reputation.*`, verified by dumping it): the real `api/reputation.ts` handler with
  `BASE_RPC_URL=https://rpc-user:SENTINEL-PASS@sentinel-host.example/v2/SENTINEL-PATH-KEY?apikey=SENTINEL-QUERY`
  plus a keyed fallback, driven through throw / ethers-shaped `info={ requestUrl: <url> }` /
  viem-shaped `URL: <url>` / HTTP 500 HTML-body paths; bodies and `util.format`-captured logs carry
  **no sentinel fragment** in any mode; `chain.rpc` is `https://mainnet.base.org`. Scrubber unit
  attacks: percent-encoded full URL, bare key echo, bare path segment, userinfo echo, raw `Error`
  object, JSON-escaped echo — all masked.
- **Verdict: CLOSED.** Observation: fragments shorter than 4 chars are not masked as bare tokens
  (`rpc-redact.ts:27`); the full URL, host, userinfo and ≥4-char segments are still masked, and a
  real provider key is never ≤3 chars — acceptable, recorded.

## 3. The remaining findings

### BP-02 (P1, iOS) — INCONCLUSIVE (branch absent)
- **Hazard model (from the finding, audit doc :79-102)**: pre-fix `validateQuote` (native revision
  `ios/Bobby/Sources/BaseSwap.swift:121`, call sites `BaseSwapView.swift:310/319/335/345/360`)
  received amount, slippage and wallet but NOT the requested tokens; it checked the response was
  *an* allowed USDC/stock pair while the form's receive label used the *locally selected* tokenOut.
  A mismatched-but-allow-listed quote response (correct amount/recipient/router) would be signed
  while the user believes they are buying a different stock. Second arm: the wallet changing after
  approval was not re-checked.
- **Required correction**: immutable requested pair (symbols + pinned addresses) into validation at
  response acceptance and immediately before signing, incl. after approval; invalidate the quote on
  side/stock/amount/slippage/wallet change.
- **Claimed closure** (unverifiable here): `BaseSwapGuardTests` 9/9 on an iPhone 17 Pro simulator.
  `ls ios` → No such file; `git ls-tree HEAD ios/` → empty. **Verdict: INCONCLUSIVE** — the web-side
  twin of this defect (BP-01) is closed and its guard is exact-pair (`quote-guard.ts:107-112`), which
  is consistent with, but no substitute for, the iOS evidence.

### BP-04 (P2) — CLOSED
- **Fix**: `api/_lib/control.ts:69-76` (`parseControlRecord` — plain object, literal booleans only,
  else fail-closed), `:43-45` (`envFlagIsOn`: `true|1|yes|on` case-insensitive), `:83-87` (env flags
  are an additive brake).
- **Exploit** (`/tmp/kimi-k3-review/bp04-exploit.mts`, 29/29): 11 malformed shapes (null, array,
  string, number, missing field, `"false"` string, `0`, note-as-number…) all freeze; well-formed
  `{false,false}` opens; `__proto__`-bearing JSON opens (correctly — the decision fields are exact
  booleans; prototype pollution is a JSON.parse concern, not the record's); unknown extra fields
  tolerated; all freeze spellings on, all non-spellings off. Precedence (dynamic decides, env only
  adds) covered by remediation-r2 (gate, 45/45).
- **Verdict: CLOSED.**

### BP-05 (P2, iOS) — INCONCLUSIVE (branch absent)
- **Hazard model (from the finding, audit doc :150-169)**: pre-fix the Reown/WalletConnect
  subscriber discarded `id`, `topic`, `chainId` from `W3MResponse` and forwarded only `result`
  (`ios/Bobby/Sources/WalletBridge.swift:275/382/405`); the app's UUID guarded the timeout task, not
  the JSON-RPC id, so the next response completed whichever continuation was pending — a late
  response after a timeout, a duplicate, a wrong-topic or wrong-chain response, an id-less response,
  or a tx hash answering a signature request could all satisfy the wrong pending action.
- **Required correction**: retain SDK RPC id + session topic + chain + expected method/account per
  request; ignore unrelated/late responses; fail pending work on disconnect/account change/session
  replacement; keep the on-chain receipt check independent.
- **Claimed closure** (unverifiable here): `RPCCorrelatorTests` on the simulator (normal accepted;
  late/duplicate/wrong-topic/wrong-chain/id-less ignored; tx hash cannot satisfy a signature request).
- **Verdict: INCONCLUSIVE.**

### BP-07 (P2) — CLOSED
- **Fix**: generated `api/_lib/adversarial-bounties.abi.ts` from the compiled artifact; six-state
  `BOUNTY_STATUS_NAMES` (`protocol-payments.ts:43`); `readBounty` with `bountyBond` /
  `resolutionFinalizeAfter` / `settlementAfter` / `disputedBy` and per-state `nextDeadline`
  (:107-173); `buildSubmitChallengeCalldata` resolves the bounty first, refuses non-OPEN/CHALLENGED
  and unposted ids, and returns the snapshotted bond as `value` (:249-269); `encodeSubmitChallenge`
  refuses a zero evidence hash (:233-241).
- **Contract cross-check** (`contracts/src/BobbyAdversarialBounties.sol`): `submitChallenge` requires
  status OPEN/CHALLENGED (:277-280) and `msg.value == bountyBond[id]` (:296), bond snapshotted at
  post time (:243); deadline arithmetic matches `createdAt+claimWindowSecs` (:291), grace
  (:73), `resolutionFinalizeAfter` (:350,362), `settlementAfter` (:394,441).
- **Exploit** (`/tmp/kimi-k3-review/bp07-exploit.mts`, 25/25): ABI parity (generated == artifact,
  semantic diff); unposted id → refusal (no 0x0 bond tx); zero evidence hash → refusal; all six
  states round-trip with `nextDeadline` equal to the contract's own clocks; terminal states refused
  by the builder; per-bounty bond (777 wei on bounty 7) is the tx value. The anvil suite (gate)
  drives the real `bobby_bounty_challenge` handler (`test-bounties-abi-anvil.mts:77,114`) and proves
  the built tx mines and the 0x0 variant reverts `Challenge bond required`.
- **Verdict: CLOSED.**

### BP-09 (P1) — CLOSED
- **Fix**: `api/_lib/cycle-provenance.ts` (positive provenance; `buildCycleRow` makes it win over
  the data); migration `20260903000011_cycle_provenance.sql` — `visibility text not null default
  'private'` + CHECK, cycles view requires `visibility='public'` with `security_barrier`, trades view
  JOINs the cycle and requires it public (a trade with NULL or private `cycle_id` can never surface);
  all four `logToSupabase` call sites carry provenance (remediation-r2:370-380).
- **Reader enumeration** (my grep over `api/` + `src/`): every public-surface read of
  `agent_cycles` carries `visibility=eq.public` — `api/agent-run.ts:388`, `api/protocol-heartbeat.ts:323`
  (the round-13 sbQuery form), `api/bobby-intel.ts:412`, `api/conviction-tiers.ts:44`,
  `api/harness-events.ts:57` (and its `forum_threads?scope=eq.public` pin). `bobby-pnl` reads the
  Base swap ledger: anonymous callers get aggregates only, identity-scoped callers their own rows
  (`api/bobby-pnl.ts:120-123`). Frontend reads the views.
- **Scan non-vacuity** (`/tmp/kimi-k3-review/bp09-scan-probe.mts`): the round-13 scanner (real
  logic copied from `test-remediation-r2.mts:385-395`) passes the real tree (4 refs found, all
  scoped) and **fails** a mutated `protocol-heartbeat.ts` with the filter dropped.
- **pg suite** (gate, real Postgres): writes rows through the real producers (wallet / scheduled /
  manual-unauth / pre-fix untagged) and reads the 0011 views as anon.
- **Verdict: CLOSED.**

### BP-10 (P2) — CLOSED
- **Fix**: migration `20260903000012_hardness_agent_cas.sql` — `row_version bigint` (the production
  trap: `version` already exists as TEXT; the pg fixture at `scripts/test-agent-registry-pg.mts:38-42`
  mirrors that shape and applies 0012 on top); `hardness_register_agent` = insert-only creation +
  owner-and-version CAS under `FOR UPDATE`, owner change refused; `hardness_transfer_agent` burns
  the `request_id` nonce first, then owner + version checks; both `security definer` with pinned
  `search_path`, EXECUTE revoked from anon/authenticated (:102-105).
  `api/agents/register.ts:86-97` (strict read → 502 on failure, owner change → 409 before any write),
  `:109-136` (CAS with the read's owner+row_version; STALE/MISMATCH → 409).
  `api/agents/transfer.ts:27-41` (strict read, signature by the CURRENT owner over the full payload,
  replay → 409).
- **Attack review**: stale `row_version` → CAS mismatch (SQL :56-58); owner change through
  registration → 409 at :95-97 and OWNER_CHANGE_REQUIRES_TRANSFER at SQL :53-55 as belt; replayed
  transfer id → nonce unique_violation (:88-92); a signature is bound to {agentId, newOwner,
  expectedRowVersion, requestId} and verified against the CURRENT owner, so cross-agent or
  post-transfer replay is stale/nonce-refused. pg suite (gate) green on the production-shaped fixture.
- **Verdict: CLOSED.**

### BP-11 (P2) — CLOSED
- **Fix**: `trackRecordVersion` declared per chain; `trackRecordSelectors` the only source
  (`api/_lib/trackrecord-stats-adapter.ts:24-37`).
- **Exploit** (`/tmp/kimi-k3-review/bp11-bp12-exploit.mts` + `bp11-heartbeat.mts`, real handlers,
  my own keccak-derived selectors via viem): on Base, `reputation` requests exactly the four V2
  selectors and NEVER a V1 one; happy path reports 60% / 6W / 4L / +2.5%. `0x` decode failure →
  `ok:false, degraded:true, sources.trackRecord:'unavailable'`, every number null (payload dumped
  and walked recursively: zero zero-valued stat fields), `trustScore.score: null`. Heartbeat: live
  read `ok:true` with real numbers; outage replay is `cached:true, stale:true, ok:false, degraded`
  with `sources: stale`; after `resetHeartbeatCache()` a fresh failure is `ok:false`, not cached,
  null performance. Stats endpoint shape asserted by the gate's suite
  (`test-rpc-redaction.mts:158-162`: `degraded`, `sources`, `onchainRecord.available:false`,
  `stats:null`).
- **Verdict: CLOSED.**

### BP-13 (P2) — CLOSED
- **Fix**: `api/orchestrate.ts` — zod schemas with 502 + failed session on out-of-schema output
  (:96-151, 419-426); `resolveSizing` (either field, 1% agreement, absent → not executable)
  (:156-169); `evaluatePolicy` receives the validated NOTIONAL (`:434-440`,
  `api/_lib/hardness-control-plane.ts:348-380` — defaults: minScore 60, cap $1000, judge required,
  **proof required, advisory mode**); `finalizeAction` precedence (:197-228); `confirmProof` waits
  for a mined receipt with status 1, 20 s bound (:175-186); session status = proof state, never
  `proved` (:528).
- **Exploit** (`/tmp/kimi-k3-review/bp13-exploit.mts`, 16/16): no-policy agent defaults to
  proof-required+advisory (top score → `require_human_approval`); the entry-price reproduction —
  BTC 83000 × 0.001 = $83 under a $1000 cap → `execute` in auto mode (old code compared 83000),
  × 1 → `allowed_with_reduction` → `reduce_size`; precedence corners beyond the test's table:
  unsized beats paper (`publish_only`), `reduce_size` + unconfirmed required proof →
  `require_human_approval`, blocked rejects even `publish_only`, advisory + confirmed proof →
  `require_human_approval`. The handler-level reproductions live at `test-remediation-r2.mts:586-645`
  (gate, 45/45).
- **Verdict: CLOSED.**

### BP-14 (P2) — CLOSED
- **Fix**: `evaluateStockReference` (`api/_lib/base-swap.ts:335-346`): pause checks precede freshness
  (a 10-minute-old timestamp never overrides a known pause), unreadable registry = unusable,
  multiplier must match; quote path withholds calldata on any unusable verdict (:703-705) and the
  held-exposure path throws (:950-961).
- **Exploit** (`/tmp/kimi-k3-review/bp14-exploit.mts`, 12/12): issuer-paused + fresh → refused;
  unreadable registry → unusable; multiplier mismatch (2x vs 1x) → refused; 97 h stale → unusable;
  30 h weekend → market-closed usable WITH warning; 96 h boundary exclusive; incomplete round /
  non-positive answer → unusable; resumed feed → usable; pause+stale and pause+mismatch orderings
  report the pause first.
- **Verdict: CLOSED.**

## 4. Deployment review checklist (third clean review)

- DeployBase config → manifest → verifier → readiness coherence: `_writeManifest`
  (`DeployBase.s.sol:446-512`) serializes `v2Params.*`, `treasury`, `fees.challengeBondWei`;
  `VerifyBaseDeployment` requires and live-compares them; readiness cross-checks env ↔ manifest.
  Coherent.
- Gates: `V2ParamsGate.validate` pre-broadcast (`:363`, before `startBroadcast` at :254);
  `BountyEconomicsGate.configure` runs inside the broadcast (it makes the 4 config CALLs — the
  zero-treasury require is inline) and `assertConfigured` post-deploy (:422); post-deploy assertions
  passed on the fork with the reviewed env.
- Production sizes 7/7 within EIP-170; layout baseline OK; both generated ABIs equal their artifacts
  (gate `git diff --exit-code` + my semantic diff in BP-07).
- `check:mainnet:predeploy` with the reviewed env: **49 PASS / 4 NO-GO** — the four are operator
  secrets (`XLAYER_RECORD_SECRET`, `TRADING_API_SECRET`, `PROTOCOL_AUTOMATION_SECRET`,
  `PYTH_HERMES_API_KEY`) that exist only in Vercel Production / the operator shell; expected in a
  review clone. All V2_* and economic gates pass. Predeploy must still reach 0 NO-GO before any
  broadcast — that is an operator step, not a code defect.
- `VerifyBaseDeployment` against the CURRENT live deployment + checked-in manifest (public Base RPC,
  read-only): **fails** at `trackRecord.activePyth == canonical active` (and the manifest also lacks
  `v2Params`/`treasury` — it is the pre-BP-03 manifest). This is the documented state: redeploy
  pending, `activatePyth` Safe transaction superseded by the full-redeploy decision
  (`docs/infra/2026-09-05-launch-readiness.md:58-63`). The gate fails loudly as designed; the
  candidate is the redeploy, whose simulation passes all assertions (above).
- Runbook coherence: `docs/infra/2026-09-05-launch-readiness.md` steps match the scripts
  (`finalize:base-manifest -- --write`; readiness prints `GO: configuration gates passed` —
  `check-mainnet-readiness.mts:600`; broadcast needs a signer flag + `BASESCAN_API_KEY`, present in
  `deploy/base-mainnet.env.example:69`; 19 receipts = 7 CREATE + 12 CALL; the
  redeploy-vs-keep decision is explicit).
- Runtime hash: unchanged (Section 0).

## 5. Items recorded but not reopened

1. rpc-redaction documents "28 checks"; 27 check blocks execute (off-by-one in docs; matrix complete).
2. BP-01: `executionPrice` / `disclosure.priceImpactPct` are unbound display-only fields (signed
   economics are all bound). P3 cosmetic.
3. BP-12: scrubber masks fragments ≥ 4 chars; a ≤3-char hypothetical key would survive as a bare
   token (full URL/host/userinfo still masked). Acceptable residual.
4. BP-06: the GitHub run id of this branch's CI is not citable from this clone (no git remote).
5. `atomicConsumeChallenge` (the pre-BP-08 unbound consume) remains as dead code in
   `api/_lib/mcp-challenges.ts:178` with no callers in `api/`; the remediation source-scan pins this.
6. Predeploy shows 4 NO-GO that are operator-secret presence checks, by design, pre-broadcast.

BP-02 and BP-05 are INCONCLUSIVE (iOS branch absent from this clone; hazard models reproduced in
Section 3 from the finding text; the required simulator evidence cannot be produced here).

VERDICT: GO 3/3
