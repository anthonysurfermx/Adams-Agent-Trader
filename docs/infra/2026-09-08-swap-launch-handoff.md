# Base stock swap launch — checkpoint and handoff, 2026-09-08

## Decision

**Not ready for public activation.** The original web candidate has GO 3/3; this
branch adds an operator-wallet restriction and retires the legacy wallet login.
The new restriction needs review before activation. No production setting,
database record, on-chain transaction or domain was changed in this work.

Scope: web, Base, existing Uniswap rail. iOS and Aerodrome are separate releases.
The operator's country policy remains the decision recorded on 2026-09-07 in
`2026-09-07-stock-country-blocklist.md`; this is not legal acceptance or a new
expansion of eligibility. Do not treat older draft-country language as current.

## Authoritative checks today

| Item | Observed evidence | Consequence |
| --- | --- | --- |
| PRs 51 / 52 / 53 | GitHub API: merged 2026-09-07, respectively 13:54 / 14:06 / 14:14 UTC | No merge remains for those PRs |
| Production source | Vercel deployment `dpl_6dVY9rWXqmxd54nMRDeHoyCTfMNh`, READY, Git SHA `aaa95efdf901981f983f9375f3735bd4f6e6a726`; public health matches | This branch starts from that commit |
| Correct project | `bobby-agent-trader`, `prj_2mZTeXALvWwHIbfA6H4hYKWeS6iR`, `bobbyprotocol.xyz` | `defimexico.org` resolves to the old `defi-mexico-hub` deployment, dated July 28; do not deploy to the wrong project |
| Changes since PR 53 | `git diff --name-only ff32173 aaa95ef -- api/` lists only progress and voice-tool; contract source/deploy scripts unchanged | No intervening swap-server change found; client work is not certified by that server-only comparison |
| Stock master flag | Vercel Production env inventory has no `BASE_STOCK_SWAPS_ENABLED` | Stock calldata stays disabled by default |
| Effective control | `/api/bobby-health`, 12:47 UTC: `source=table`, `writeFreeze=false`, `canary=false`, DB `qbvdqkknnuweatptjohi` | Dynamic brake is configured, currently open. The cycle canary is NOT a swap-wallet restriction |
| Sensitive env values | `PROTOCOL_CUTOVER_FREEZE`, protocol-write flags and operator secrets are type `sensitive` | API/CLI blank values are redaction, not proof of empty configuration. Effective health shows no active freeze at the sampled invocation |
| Production parameter inventory | All seven `V2_*` names absent | Supply the reviewed explicit values for the deployment/check environment; configure production consistently before cutover |
| TrackRecord | Read-only `activePyth()` still `0x8250f4aF4B972684F7b336503E2D6dFeDeB1487a` | Reviewed full redeploy remains pending |
| Safe | Read-only threshold 2; three owners match `deploy/base-mainnet.env.example` | Two signatures still needed for executed ownership acceptance |
| Gas snapshot | Deployer balance `0.001388787557628467 ETH`; gas price `6,000,000 wei` | Approximately 0.00015 ETH for the earlier 25M-gas estimate, before additional costs; recheck before signing, not a current simulation or guarantee |
| Supabase 0011–0013 | Applied according to the Sept 7 repository record | Not independently re-queried today: Supabase MCP tools are unavailable in this session. Do not reapply blindly |
| OKX | API inventory: seven `OKX_*` names in Development only; none in Production | Issuer revocation remains an operator action; development consumers remain in source |
| Predeploy | Public example environment: 49 PASS / 4 NO-GO | Missing local `XLAYER_RECORD_SECRET`, `TRADING_API_SECRET`, `PROTOCOL_AUTOMATION_SECRET`, `PYTH_HERMES_API_KEY`; all are listed as sensitive in Vercel. Their actual values/validity were not checked |

No secrets were printed or put in this branch. The local `.env.local` also lacks
the four deploy-check secrets and `BASESCAN_API_KEY`. Do not use dummy values to
turn a deployment gate green.

## New stock canary restriction

`BASE_STOCK_SWAP_CANARY_WALLETS` is a comma-separated list of operator signing
wallets. Validation is server-side in the shared quote builder, for both buy and
sell. It withholds the complete transaction bundle, including approvals, before
construction when a recipient is not allowed.

- Absent variable: public behavior, subject to all existing gates.
- Defined empty/whitespace, malformed member, zero address or trailing comma:
  block everyone. A bad member invalidates the whole list.
- Valid list: only those recipients can get stock calldata; case-insensitive.
- The master flag, session ownership, country, attestation, issuer checks, caps,
  simulation, receipt persistence and freeze controls still apply independently.
- Quotes without a recipient remain read-only. This restriction does not affect
  non-stock pairs and is not a transaction-signing or network-level ACL.

The example environment defaults to a defined empty list and a $5 ticket cap.
The cap is **per ticket**, not a total spending allowance. No operator address is
assumed from the treasury, deployer or recorder. Use the user's actual signing
wallet. Removing the variable is an explicit public-release operation.

## Execute in this order

1. Review and merge the tested candidate. Keep stock execution off. Resolve the
   legacy-account containment item below before claiming site-wide auth closure.
   Record the exact accepted source revision; the existing GO 3/3 does not silently
   extend to the newly added canary.
2. Verify live migration history, view definitions, CAS RPC access and payment
   constraint with Supabase MCP. Use the checks in launch-readiness §2 against
   `qbvdqkknnuweatptjohi`; tests against scratch Postgres are not live evidence.
3. Load the actual operator secrets into a private shell. Start from the reviewed
   public example, then set secrets (sourcing it later would overwrite them with
   blanks). Run `npm run check:mainnet:predeploy`: require zero NO-GO. Supply
   `BASESCAN_API_KEY` for verification. This check is not proof that credentials
   work with each upstream service.
4. Archive `contracts/deployments/8453.json` before signing. Full redeploy creates
   seven new contracts, including a new empty TrackRecord. The old history remains
   on-chain at its old address; it is not copied or erased. Preserve that manifest
   for historical reads. Recheck gas and simulate the exact candidate before broadcast.
5. Execute the Ledger deploy from readiness §2. Run `finalize:base-manifest --
   --write`, then generate `build:safe-launch-batch -- --action=accept` **from the
   finalized NEW manifest**. Do not use a batch generated from today's old addresses.
   Execute acceptance with two Safe signers. A proposed or signed batch is not execution.
6. Run `VerifyBaseDeployment` and `check:mainnet:postdeploy`; require GO. Update
   all seven `BASE_*_ADDRESS` values and `BASE_PROTOCOL_DEPLOYMENT_BLOCK` from the
   new manifest. Use the reviewed `V2_*` parameters explicitly.
7. Run `check:mainnet:cutover` in the frozen candidate environment. The script
   requires `PROTOCOL_WRITES_ENABLED=true` **and** `PROTOCOL_CUTOVER_FREEZE=true`.
   This validates a prepared configuration; it is not a swap execution test and
   cannot prove a live unfrozen deployment. Do not change that check to make a
   canary pass. Recorder-service canary/soak and its write enablement remain separate
   from user-signed stock testing; no autonomous trade is authorized by this document.
8. Only after acceptance and all applicable gates: deploy the restricted stock
   canary configuration below. Confirm the deployed SHA, effective controls and
   new addresses. The operator signs an exact small approval if needed, waits for
   its receipt, re-quotes, reviews and signs the swap in the web wallet. Verify
   the transaction's chain, recipient, amounts and receipt/history reconciliation.
   Verify a non-listed **owned test wallet** receives no transaction bundle.
9. Exercise the dynamic freeze and verify it blocks new prepares, then restore
   only the intended restricted state. Record receipts and the results. Public
   activation is a separate deliberate rollout, with no unreviewed code changes.

| Phase | Stock master | Canary wallet variable | Effective freeze | Protocol automatic writes |
| --- | --- | --- | --- | --- |
| Prepare / deploy contracts | absent or false | defined empty | preserve or freeze for the planned maintenance window | disabled |
| Frozen cutover check (private shell) | false | operator wallet(s) | true | true in the checked configuration; no live effect from running the check |
| User-signed stock canary | true | validated operator wallet(s) | false | can stay disabled; quote builder does not require this flag |
| Public web launch | true | removed deliberately | false | enabled only after its separate recorder canary/soak |
| Emergency stop | false on next deployment | retain restriction | dynamic true | disabled on next deployment |

Keep cycle effects in dry-run when conducting only the stock canary. Setting the
cycle `canary=true` does not prevent the user from signing a stock swap. Do not
toggle global controls without accounting for other writers sharing the same table.

## Rollback and propagation

Use the table's `write_freeze=true` as the immediate brake, and verify effective
health. Allow its 10-second cache and in-flight requests. Set stock master false
and deploy for persistent shutdown. Env changes apply only to new Vercel
deployments ([Vercel environment documentation](https://vercel.com/docs/environment-variables)).
Sensitive variables cannot be retrieved once created
([Vercel sensitive variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables)).

No server flag cancels an already issued/signed transaction or revokes an existing
ERC-20 approval. The router deadline remains the on-chain bound on issued calldata.
Preserve receipt tables and old manifests; do not delete history or roll back to an
older deployment with open swaps and no wallet restriction.

## Residual classification (source review, no account-access reproduction)

| Sept 3 item | Current finding | Treatment |
| --- | --- | --- |
| 13 — HTTP upstream | `bobby-wallet.ts` still defaults to HTTP; route map allows read-only data/quotes, no swap execution. Base stock execution uses pinned Uniswap calldata independently | Follow-up: HTTPS/proxy hardening and data integrity; not established as a stock signing path |
| 14 — free MCP wallet balance | MCP forwards server auth to the internal balance reader; it does not return that secret to callers | Follow-up: intentional public-wallet data scope, exposure and rate limits. No fund movement identified in this path |
| 15 — legacy wallet login | Removed from this branch: wallet-password auth entry point and obsolete signature prompt. Existing legacy Auth accounts are NOT remediated by removing client code | **Open containment item:** authorized admin must inventory affected legacy accounts on `egpixaunlnzauztbrnuz`, invalidate the legacy password credentials and revoke sessions/refresh tokens, preserve ownership/recovery records and validate recovery. Review token expiry and consumers before declaring closure. No account credentials or sessions changed today |
| 16 — IP limiter | Source uses `x-forwarded-for`. Vercel documents overwriting it at its edge | No bypass asserted. Verify proxy topology before treating this as exploitable; per-wallet session limits remain independent. Follow-up if a trusted upstream proxy is configured |

The legacy Auth client defaults to the DeFi Mexico project, while Bobby health
identifies a separate project and swap preparation requires the dedicated wallet
session. That separation is evidence of scope, **not** a complete cross-project
access review or proof that legacy accounts are safe. No public credential recipe,
account inventory or account-access attempt is included here.

An aggregate-only read-only query is prepared in
`2026-09-08-legacy-wallet-auth-inventory.sql`. It has not been run: use the
authorized Supabase MCP connection to the named legacy project first. Review
results before selecting the scoped containment and recovery operation.

Header behavior source:
[Vercel request headers](https://vercel.com/docs/headers/request-headers).

## Validation and remaining evidence

Passed locally on this branch: `test:base-swap` (existing validators plus the new
offline integration), `test:api-security` 47/47, `test:remediation-r2` 45/45,
`test:protocol-write-safety`, API typecheck/build and `lint --quiet`. The new test
uses deterministic RPC stubs and positive controls: approved wallet gets approval
or swap, outsider gets neither, malformed lists block all, both directions are
restricted, and master/country/attestation/cap/issuer gates cannot be overridden.
These are not live wallet, fork, device or signed mainnet-canary results.

Browser check on the local `/login` route confirms email and the two OAuth buttons
render without the legacy wallet option. `npm audit --omit=dev` reports 22 moderate,
0 high and 0 critical advisories. No dependency update was included.
GitHub Dependabot separately reports open alert #17, high severity, for Vite's
development server on Windows (`package-lock.json`, scope `development`). This
does not contradict the production-only npm audit. Track it separately; no
vulnerability reproduction or major Vite upgrade was performed in this release.

Still needed: independent review of this delta, live Supabase revalidation and
legacy-account containment, real-secret predeploy, new deploy receipts, executed
Safe acceptance, postdeploy/cutover evidence, user-signed canary, then public rollout.
iOS native acceptance/archive and automated bounty finalization remain separate.
