# Base stock swaps via Bobby Protocol — launch readiness (2026-09-05)

State of every gate between `security/remediation-r2` and swaps being live on Base, with
what is already proven, what is prepared, and the exact action left for each residual
item. Nothing in this document was deployed, migrated, flipped, signed or uploaded by the
agent; every production action is Anthony's, in the order below.

## 1. Gates — status

| Gate | Status | Evidence |
|---|---|---|
| Expanded audit 2026-09-04 (BP-01..BP-14) | **14 implementations reported; independent acceptance pending** | `docs/security/2026-09-03-remediation-r2.md` rounds 12 / 12b / 12c; this is not launch approval |
| Production contract source unchanged since round 8 | **yes** | `HardnessRegistry` runtime `0x3449ac07…b043e0d5`, 23,471 B; all seven under EIP-170 (`check-sizes.sh`) |
| CI test matrix at `08e33d3` | **green; verified against job logs** | [Run 33954559063](https://github.com/anthonysurfermx/Bobby-Agent-Trader/actions/runs/33954559063): application, integration and contracts succeeded. Forge 1.8.1 reports 278 test results across 14 suites, with all 10 invariant functions passing in 2 grouped campaigns; see section 5. This is not independent audit acceptance. |
| Deploy configuration (public values) | **complete** | `deploy/base-mainnet.env.example` — every public value filled from the manifest, the live Safe and the runbooks, incl. the seven `V2_*` and treasury/bond |
| `check:mainnet:predeploy` | **not cleared** | Section 4 records a historical local result (49 PASS / 4 NO-GO), not current production configuration. Re-run on the final candidate with the intended environment; verification also needs `BASESCAN_API_KEY`. Success prints `GO: configuration gates passed`. |
| `check:mainnet:postdeploy` ↔ `finalize:base-manifest` | **coherent since the third round** | readiness now expects the 12 CALL receipts finalize writes (scorer, treasury ×2, both bonds, 7 handoffs); an execution test in `test:protocol-write-safety` proves the finalize-shaped manifest passes and a manifest with the treasury receipts removed fails |
| DeployBase simulation on a Base mainnet fork | **passed** | `forge script … --sender 0xC3F8…35d1` (no `--broadcast`): SafeOwnerGate validated the live Safe, seven contracts, treasury + bonds configured before the handoff, **post-deploy assertions ALL PASSED**, manifest carries `v2Params`, `treasury`, `fees.challengeBondWei`; ~25.0M gas ≈ 0.00027 ETH at 0.011 gwei |
| Deployer gas | **sufficient today** | `0xC3F8…35d1` holds 0.00139 ETH ≈ 5× the simulated cost; top up if Base gas rises |
| Supabase migrations | **0010 applied; 0011/0012/0013 pending, preconditions verified** | read-only preflight on `qbvdqkknnuweatptjohi`; `0012` fixed to `row_version` after the preflight found the text `version` column |
| Safe `activatePyth(0xbC16…2F5)` on TrackRecordV2 | **pending (timelock elapsed 2026-08-21)** | live `activePyth` is still `0x8250…487a`; calldata in the runbook §2c |
| Live V2 params | **already the reviewed values** | `params()` = 60/120/600/604800/100/100/50 |
| Independent third round (Codex + Kimi K3) | **pending → decides GO 3/3** | brief: `docs/security/2026-09-05-third-round-brief.md` |
| Legal country allow-list, OKX key revocation | **pending, non-technical** | runbook §5, §6 |
| iOS build (Trader Land commit, distribution archive, upload) | **pending** | `project_ios_release_status`; Anthony uploads |

## 2. Order of operations (Anthony)

0. **Asset identity and eligibility approval.** This candidate implements Coinbase B20
   (AAPLc/GOOGLc/METAc/NVDAc), not the xStocks-branded assets. Confirm that product
   scope and obtain country allow-list sign-off before enabling any stock execution.
   Do not treat the current draft country list as approved. Keep execution disabled
   while the independent review, migrations and final deployment checks are pending.

1. **Third round.** Run the brief. Record GO 3/3 in the report only if the runtime hash is
   unchanged and nothing reopens. Stop here on any NO-GO.
2. **Migrations** on `qbvdqkknnuweatptjohi`, in order, via the Supabase MCP `apply_migration`
   (or the SQL editor), each followed by its check:
   - `20260903000011_cycle_provenance.sql` → `select count(*) from agent_cycles_public;` returns only
     scheduled cycles (historical rows stay private until an operator tags them).
   - `20260903000012_hardness_agent_cas.sql` → `select column_name from information_schema.columns
     where table_name='hardness_agents' and column_name in ('version','row_version');` returns both.
   - `20260903000013_mcp_challenge_binding.sql` → `select conname from pg_constraint where conname =
     'mcp_payment_challenges_status_check';` exists.
   Then `DATABASE_URL=<scratch> npm run test:rls-lockdown-pg` locally is unchanged; production
   verification is the three queries above.
3. **Decision: full redeploy or keep the current TrackRecordV2.** `DeployBase` has no partial
   mode: step 4 deploys all seven contracts (a NEW TrackRecordV2 whose constructor already
   activates `0xbC16…2F5`), and the manifest / verifier / readiness chain only describes complete
   deployments. The `activatePyth` Safe transaction (runbook §2c, batch
   `contracts/deployments/safe-batches/8453-activate-pyth.json`, to
   `0x822DB0DbbCAB398e610fcBA86DA9BB92d2493321`, data `0xb4d6badf…e272f5`) therefore applies
   **only if you keep the current TrackRecordV2** (its verified history) and skip the full
   redeploy — in which case a partial deploy script would be needed first, because the readiness
   chain cannot certify a mixed deployment. Default plan: full redeploy, step 3 skipped.
   Check after signing (if kept): `cast call 0x822D…2321 'activePyth()(address)' --rpc-url
   https://mainnet.base.org` returns `0xbC16aee60f64864882BC6C4E428e148Fc0E272F5`.
4. **Redeploy** (3-round rule satisfied only after step 1). The broadcast needs a signer flag
   (`--ledger`, `--account <name>` or `--interactive`) and `BASESCAN_API_KEY` for `--verify`:
   ```
   set -a; source deploy/base-mainnet.env.example; set +a   # then export the five secrets from your shell
   npm run check:mainnet:predeploy                           # must print "GO: configuration gates passed"
   (cd contracts && forge script script/DeployBase.s.sol --rpc-url "$BASE_RPC_URL" --sender "$DEPLOYER_ADDRESS" --ledger --broadcast --verify -vvvv)
   npm run finalize:base-manifest -- --write                 # live receipts into contracts/deployments/8453.json (19: 7 CREATE + 12 CALL)
   npm run build:safe-launch-batch -- --action=accept > contracts/deployments/safe-batches/8453-accept-ownership.json
   # STOP HERE. Import the accept batch in the Safe and execute it with 2 of 3 signers.
   # Generating or signing a proposal is not execution. Confirm successful receipts.
   # Only after execution, run the following checks (owners must equal the Safe).
   (cd contracts && forge script script/VerifyBaseDeployment.s.sol --rpc-url "$BASE_RPC_URL")
   npm run check:mainnet:postdeploy                          # must print GO (readiness now expects the treasury/bond receipts)
   ```
   Update the seven `BASE_*_ADDRESS` and `BASE_PROTOCOL_DEPLOYMENT_BLOCK` in Vercel from the
   new manifest; `npm run gen:hardness-abi` is a no-op (source unchanged) but run it anyway.
5. **Environment** (runbook §3/§4): `PROTOCOL_CHAIN=base` is already the default; set
   `PROTOCOL_WRITES_ENABLED=true` only after the canary, then `BASE_STOCK_SWAPS_ENABLED=true`
   as the deliberate flip. `check:mainnet:cutover` must print `GO: configuration gates passed` first.
6. **Hygiene**: revoke the retired OKX key only after confirming no remaining consumer (§6).
   Country eligibility approval is a prerequisite in step 0, not a post-launch task.
7. **iOS**: reviewed commit of the swap guards and Trader Land files on `codex/ios-base-swaps`, clean archive with
   distribution signing, export with `destination=export`, upload.

## 3. What the agent left ready

- `deploy/base-mainnet.env.example` (no secrets) — sources cleanly (`set -a; source …`).
- Manifest, verifier and readiness all understand `v2Params`; the simulation proves the path.
- Migrations 0011–0013 tested on Postgres 17 against the production column shapes.
- Safe calldata for `activatePyth` verified with `cast calldata`, and the importable batch
  `contracts/deployments/safe-batches/8453-activate-pyth.json` (pinned to the gate's address).
- The third-round brief with every command and attack per finding.
- Rollback: runbook §Rollback (flags back to `false`, `PROTOCOL_CUTOVER_FREEZE=true`,
  migrations are additive — views can be dropped without data loss).

## 4. Independent checkpoint — 2026-09-05 (not GO 3/3)

Checked application source at `f70743e`, then corrected the CI fixture environment
and the operator ordering in this document. No production operation was performed.

- `test:api-security` failed before assertions when database configuration was
  absent, matching the application's CI job. The step now supplies offline dummy
  configuration; the same fixture values pass **47/47** with database calls mocked.
- `npm run test:base-swap` passed, including current quote and reference validators.
- `npm run check:api`, `npm run build`, production sizes **7/7**, layout and
  `git diff --check` passed. Existing bundle-size/PURE-annotation warnings remain.
- Production contract source equals `02a0a7a`; the compiled Hardness runtime hash
  remains `0x3449ac0707c855588a1a0df8d45bddbd04aabfb1e35cb66f7a704006b043e0d5`.
- Predeploy with the public example environment: **49 PASS / 4 NO-GO**, for the
  four empty service secrets. This does not inspect or establish their Vercel state.
- No independent full-matrix completion, live migration verification, Safe
  execution, stock-eligibility approval or signed swap canary is claimed here.
  Confirm B20 versus xStocks product identity before changing the release scope.

## 5. Integration checkpoint (not GO 3/3)

Integrated local `e7a47c5` with upstream `08e33d3` without changing upstream
application, contract, deployment-script or test source. Resolved the launch-order
conflict by preserving eligibility approval before activation, the full-redeploy
versus retained-TrackRecord decision, explicit `--write`, a signer selection, and
the requirement to EXECUTE Safe ownership acceptance before postdeploy verification.
CI retains upstream coverage and uses a single job-level offline database fixture
at the reserved `.invalid` domain; no production credentials are supplied.

- Independently inspected GitHub run **33954559063** and its step logs at upstream
  commit `08e33d3b9dde0b428bf0796bfbbeaff640798734`: application, integration
  (including all three Postgres suites and both ABI suites), and contracts passed.
- Count reconciliation: CI Forge **1.8.1** reports **278 passed, 0 failed, 0 skipped**.
  Its logs explicitly pass all **6** TrackRecord invariant functions in one campaign
  and all **4** escrow invariant functions in one campaign. This accounts for the
  eight-result difference from the previously reported **286** individual functions;
  it is not evidence of eight omitted checks. Local Forge is **1.5.1**. Keep runner
  version and invariant grouping alongside counts instead of equating the totals.
- Re-ran `test:base-swap` on the merged tree: passed, including quote consistency,
  execution-view binding and stock-reference validation. Re-ran `test:api-security`
  with the merged offline CI environment: **47/47**. `npm run build` (including API
  typechecking), `npm run lint -- --quiet`, and `git diff --check` passed. Existing
  bundle-size and dependency PURE-annotation warnings remain.
- iOS worktree contains uncommitted changes to `BaseSwap.swift` and
  `BaseSwapGuardTests.swift`, as well as Trader Land work. They were inspected but
  not altered or included in this integration; no final native test/archive claim
  is made. Pin the reviewed native revision before accepting BP-02/BP-05/BP-14.
- The user approved MX as an operator decision, then requested broader coverage;
  jurisdiction-specific legal eligibility has not been independently established.
  No country or asset allow-list was expanded. No migration, signature, deployment,
  swap enablement, App Store upload, or production canary was performed.
- Codex weekly account usage was **36%** when the user granted an additional five
  percentage points of Codex token capacity. **41%** is the conservative account
  stop reference for this resumed work; this shared meter is not per-task attribution.

Still required: independent acceptance of the latest source changes and the third
clean deployment review; a pinned and tested native release; verified production
migrations/configuration; operator/Safe actions; eligibility sign-off; and the final
web/native release canary. The request for at least 20 stocks additionally requires
an approved expansion beyond the currently identified Coinbase B20 catalogue.

## 6. Native guard checkpoint — 2026-09-05 (not native release approval)

Native commit **`a55e0095d11111254e6d56c30e45c0f9628dc411`** on
`codex/ios-base-swaps` corrects a false rejection in `decimalMatchesWord`:
ABI bytes preserve a leading zero nibble while decimal-to-hex conversion does
not. Both are now compared as normalized numeric digits. Exact integer equality,
the uint256 bound, pinned spender/router and recipient checks remain unchanged.
Two positive-path tests cover an odd-length hexadecimal output and a zero revoke.
Only these changes were staged; pre-existing issuer-reference and Trader Land
changes remain uncommitted and were not silently included in the commit.

`scripts/test-ios-guards.mts` compiles exact source snapshots (no rewriting of the
guard logic) and the native XCTest files in a temporary macOS Swift package.
It records SHA-256 hashes and refuses to certify a working tree that changes while
the tests run. Application transport dependencies are stubbed; no network or wallet
requests are exercised. This is not an iOS simulator, UI, SDK integration or archive test.

```
npx --no-install tsx scripts/test-ios-guards.mts /absolute/path/to/ios/Bobby a55e009
```

- Pinned commit snapshot: **17/17 XCTest cases passed** (11 swap guard, 6 RPC
  correlation), Apple Swift 6.2.1 on macOS. `BaseSwap.swift` SHA-256:
  `453784a1664c5f19d3066dbb7c656933d110057f0c8b6eeffdc9507996a5c2ef`.
- Working-tree snapshot including the pre-existing issuer-reference patch:
  **18/18 passed** (12 swap guard, 6 RPC correlation). `BaseSwap.swift` SHA-256:
  `11aa66883217e51fefc7add9e8caaf65587c360860436289e101ac81d8165095`;
  test file SHA-256 `0007a49549966451e4437266b807835c77e7577d956e37c427c53597ea3a8e88`.
- Source inspection confirms the view supplies the user-selected pair at quote
  acceptance and immediately before approval/swap validation; the wallet bridge
  compares the request ID before resuming a response. Unit tests do not establish
  end-to-end SDK behavior.
- `eslint scripts/test-ios-guards.mts` and `git diff --check` passed. Neither
  native commit nor this checkpoint was pushed or uploaded during this work.

The final native candidate still needs the issuer-reference changes reviewed and
committed, SDK/device testing and a reproducible release archive. Existing build 16
must not be assumed to contain `a55e009`. GO 3/3 and production remain pending.
