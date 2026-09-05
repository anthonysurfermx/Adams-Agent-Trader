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
| Full test matrix | **green** | Foundry 283/283, remediation 45/45, rpc-redaction 12/12, api-security 47/47, both anvil ABI suites, three Postgres suites, build/lint/typecheck |
| Deploy configuration (public values) | **complete** | `deploy/base-mainnet.env.example` — every public value filled from the manifest, the live Safe and the runbooks, incl. the seven `V2_*` and treasury/bond |
| `check:mainnet:predeploy` | **NO-GO 4 → only the Vercel secrets** | with the env file and no secrets: `XLAYER_RECORD_SECRET`, `TRADING_API_SECRET`, `PROTOCOL_AUTOMATION_SECRET`, `PYTH_HERMES_API_KEY` missing; nothing else |
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
3. **Safe transaction — activate the canonical Pyth** (runbook §2c): import
   `contracts/deployments/safe-batches/8453-activate-pyth.json` in the Safe Transaction
   Builder (to `0x822DB0DbbCAB398e610fcBA86DA9BB92d2493321`, value 0, data
   `0xb4d6badf000000000000000000000000bc16aee60f64864882bc6c4e428e148fc0e272f5`), sign 2 of 3.
   Check: `cast call 0x822D…2321 'activePyth()(address)' --rpc-url https://mainnet.base.org`
   returns `0xbC16aee60f64864882BC6C4E428e148Fc0E272F5`.
4. **Redeploy** (3-round rule satisfied only after step 1):
   ```
   set -a; source deploy/base-mainnet.env.example; set +a   # then export the four secrets from your shell
   npm run check:mainnet:predeploy                           # must print NO-GO: 0
   (cd contracts && forge script script/DeployBase.s.sol --rpc-url "$BASE_RPC_URL" --sender "$DEPLOYER_ADDRESS" --broadcast --verify -vvvv)
   npm run finalize:base-manifest                            # receipts into contracts/deployments/8453.json
   npm run build:safe-launch-batch -- --action=accept        # Safe accepts ownership of the seven
   # STOP: generating the batch is not executing it. Safe signers must execute it;
   # confirm successful receipts and completed ownership before verification.
   (cd contracts && forge script script/VerifyBaseDeployment.s.sol --rpc-url "$BASE_RPC_URL")
   npm run check:mainnet:postdeploy
   ```
   Update the seven `BASE_*_ADDRESS` and `BASE_PROTOCOL_DEPLOYMENT_BLOCK` in Vercel from the
   new manifest; `npm run gen:hardness-abi` is a no-op (source unchanged) but run it anyway.
5. **Environment** (runbook §3/§4): `PROTOCOL_CHAIN=base` is already the default; set
   `PROTOCOL_WRITES_ENABLED=true` only after the canary, then `BASE_STOCK_SWAPS_ENABLED=true`
   as the deliberate flip. `check:mainnet:cutover` must print NO-GO: 0 first.
6. **Hygiene**: revoke the retired OKX key only after confirming no remaining consumer (§6).
   Country eligibility approval is a prerequisite in step 0, not a post-launch task.
7. **iOS**: reviewed commit of the Trader Land files on `ios/apple-login`, clean archive with
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
