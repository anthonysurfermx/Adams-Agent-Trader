# Independent review — Base stock swap launch candidate (PR #76 @ `135bb23`), 2026-09-08

Reviewer: Claude (Fable 5.1), separate session from the author (Codex). Scope: the three
dependencies the handoff left open — (1) independent review of the canary delta, (2) live
Supabase verification and legacy-account containment, and what turned up on the way. Nothing
here deploys contracts, flips a flag or signs. One production change was made and is recorded
in §3 (a permission revoke, reversible with a one-line grant).

## 1. Canary delta (`api/_lib/stock-swap-canary.ts`, `api/_lib/base-swap.ts:734-737`) — ACCEPT

Re-ran on the candidate checkout (`/private/tmp/bobby-swap-launch-20260908` @ `135bb23`, clean):
`scripts/test-stock-swap-canary.mts` and `scripts/test-base-swap.mts` both pass.

What I checked by reading, not by trusting the tests:

- **Recipient is the proven session wallet.** `api/base-swap.ts:99-105`: `guardWrite` proves
  `body.wallet === session wallet`, the builder is called with `recipient: wallet ?? body.wallet`,
  and the intent token binds cycle + wallet + pair + amount + jti. An outsider cannot obtain
  calldata *for* a canary wallet, and cannot obtain calldata for their own wallet.
- **Both directions.** `stock` (`base-swap.ts:660`) is whichever side is the tokenized stock, so
  the sell path is gated identically (test covers it).
- **Whole bundle withheld before construction.** `tx` is only assigned at `:810` / `:826` under
  `txWithheld.length === 0`; the canary reason is pushed at `:736`, before approval, revoke and
  simulation. No approval calldata leaks to a non-listed wallet.
- **Fail-closed parsing.** Defined-but-empty, whitespace, trailing comma, `*`, `true`, zero
  address, one bad member → the whole list is invalid and everyone is blocked. `isAddress(strict:
  false)` + lowercase compare: mixed-case entries work, no checksum foot-gun.
- **Additive.** Master flag, country block-list, attestation, issuer reference, cap, simulation and
  receipt persistence are unchanged and still apply on top (test asserts each).
- **Non-stock pairs untouched** (by design; crypto legs were already on the session-gated path).

Operational note, not a code defect: **absent variable = public.** If `BASE_STOCK_SWAPS_ENABLED=true`
ever lands in Production while `BASE_STOCK_SWAP_CANARY_WALLETS` is undefined, execution is public
immediately. The handoff's phase table already starts with "defined empty" — do that step **now**,
before any other environment change, so an accidental master flip stays blocked. Removing the
variable later is the deliberate public-release act, as the PR says.

Legacy wallet login removal (`LoginPage.tsx`, `auth.service.ts`): correct to remove, and the PR
is right that it remediates nothing server-side — see §4.

## 2. Live Supabase verification — bobby-protocol `qbvdqkknnuweatptjohi` (read-only, MCP)

Every check in launch-readiness §2 passes against production:

| Check | Live result |
|---|---|
| Migration history | `cycle_provenance`, `hardness_agent_cas`, `mcp_challenge_binding` present (versions `20260907135312/332/339`) |
| `agent_cycles.visibility` | text, NOT NULL, default `'private'`, CHECK in (`public`,`private`) |
| `agent_cycles_public` | `WHERE visibility = 'public'` |
| `agent_trades_public` | joins parent cycle, `c.visibility = 'public' AND t.owner_address IS NULL AND t.user_id IS NULL` |
| `hardness_agents` | `version:text`, `row_version:bigint` |
| 0012 RPCs | `hardness_register_agent(text,text,bigint,jsonb)`, `hardness_transfer_agent(text,text,text,bigint,uuid)` — SECURITY DEFINER, EXECUTE only `postgres` + `service_role` |
| `hardness_agent_ownership_nonces` | RLS on, no policies, ACL `postgres` + `service_role` only |
| `mcp_payment_challenges` | all five columns present; `status_check` allows pending/consumed/expired/in_progress/completed/retryable_failure (the old constraint with the same name is gone) |
| Base tables | `agent_cycles`, `agent_trades`, `api_cache`: RLS on, **no** SELECT grant to anon/authenticated |
| Money RPCs | `confirm_swap_receipt`, `bobby_match_fifo`: SECURITY DEFINER, `service_role` only |

## 3. New finding F-01 — anonymous write path into the public track record — FIXED

Supabase security advisor flagged `public.bobby_publish_debate(uuid,text,jsonb,jsonb)` as a
SECURITY DEFINER function executable by `anon` and `authenticated`. Reading it: the HMAC
transcript receipt is verified **only** in `api/forum-publish.ts`; the function itself accepts
any *unused* uuid (`insert into forum_publish_receipts` is the sole guard), then inserts a
`scope='public'` thread with caller-chosen symbol/direction/entry/stop/target and
`owner_wallet`. `api/forum-resolve.ts:90` picks `resolution=pending & entry_price not null`
threads, resolves them, and for `scope='public'` (`:164-179`) POSTs `action:'resolve'` to
`/api/protocol-record` — i.e. Bobby's **on-chain** track record — and `:229` computes the
public win-rate from the same rows. Anyone with the publishable key could therefore fabricate
Bobby's record. Pollution risk, not fund risk; especially relevant because the redeploy creates
an empty TrackRecordV2.

Proof (harmless, invalid args so the function raises before any insert):
```
POST /rest/v1/rpc/bobby_publish_debate  (anon key)  → HTTP 400 {"code":"22023","message":"bobby_publish_debate: invalid arguments"}   # reached the function body
```
Fix applied to production via MCP `apply_migration` (`revoke_anon_security_definer_rpcs`) and
committed as `supabase/bobby-protocol/supabase/migrations/20260908000014_revoke_anon_security_definer_rpcs.sql`:
revoke EXECUTE from `public, anon, authenticated` on `bobby_publish_debate`, `bobby_rls_matrix`,
`bobby_rls_status`; grant to `service_role` (the only legitimate caller — `forum-publish.ts:52`
uses `bobbyServiceHeaders()`; no `src/` caller exists).

After: all three → HTTP 401 `42501 permission denied for function …`; ACL now
`postgres=X service_role=X`. Rollback: `grant execute … to anon, authenticated`.

## 4. Legacy wallet accounts — legacy project `egpixaunlnzauztbrnuz` (read-only inventory)

The retired flow derived the password from the address (`wallet_<addr[2:32]>_auth`, email
`<addr>@wallet.defimexico.org`), so anyone who knows a wallet address could sign in as that
legacy account until the credentials are invalidated.

| Item | Value |
|---|---|
| Legacy wallet accounts | 4 (all `auth_method=wallet`, identity `email`) |
| With password set | 4 |
| Role (`public.profiles`) | `user` ×4; no `user_roles` rows; `is_super_admin` null |
| Sign-in history | 4; most recent 2026-03-25 |
| Session rows / unrevoked refresh tokens | 23 / 23 (21 on one account) |

**Classification: not a launch blocker.** These live on the DeFi México project, not on
bobby-protocol; Bobby's swap path authenticates with the SIWE `bobby_session` HMAC and
`guardWrite`, which never consult legacy Supabase Auth. Impact is limited to defimexico.org
`user`-role accounts.

**Containment proposal (NOT executed — operator decision, reversible):**
```sql
-- legacy project egpixaunlnzauztbrnuz
update auth.users set banned_until = '2100-01-01', updated_at = now()
 where email like '%@wallet.defimexico.org';
delete from auth.sessions
 where user_id in (select id from auth.users where email like '%@wallet.defimexico.org');
-- refresh_tokens cascade from sessions on current GoTrue; verify: unrevoked count must be 0 afterwards.
```
Ban blocks both password login and token refresh; unban restores. If a legitimate owner ever
needs the account back, link it through the normal email/OAuth flow.

## 5. Residual advisor items on bobby-protocol (recorded, not reopened)

- `bobby_control` and `hardness_agent_ownership_nonces`: RLS on with no policies = service-only
  by design.
- `agent_cycles_public` / `agent_trades_public` flagged as SECURITY DEFINER views: intentional —
  the base tables have no anon SELECT, the views are the only public surface (§2).
- `bobby_control_touch`, `set_updated_at`: mutable `search_path` (WARN); `vector` extension in
  `public`; leaked-password protection disabled on Auth. Housekeeping, post-launch.

## 6. Verdict

- Canary delta: **accepted**; the existing GO 3/3 can be extended to `135bb23` on the evidence
  above plus the green CI cited in the PR.
- Live schema: **verified** as remediated backend expects.
- F-01: **fixed and verified** in production; migration file in repo.
- Still Anthony's: set `BASE_STOCK_SWAP_CANARY_WALLETS=""` in Production first, operator secrets
  → predeploy 0 NO-GO, Ledger deploy, Safe 2/3 acceptance, postdeploy GO, the canary wallet,
  and the legacy containment decision in §4.
