-- Read-only inventory for an authorized administrator, via Supabase MCP.
-- Run on the LEGACY project egpixaunlnzauztbrnuz, not bobby-protocol.
-- Returns aggregate counts only; never returns credentials, tokens or addresses.
-- This does not invalidate passwords/sessions or prove recovery ownership.
BEGIN READ ONLY;

SELECT
  count(*) AS legacy_wallet_accounts,
  count(*) FILTER (WHERE encrypted_password IS NOT NULL AND encrypted_password <> '') AS accounts_with_password,
  count(*) FILTER (WHERE banned_until > now()) AS currently_banned_accounts,
  count(*) FILTER (WHERE last_sign_in_at IS NOT NULL) AS accounts_with_sign_in_history
FROM auth.users
WHERE email LIKE '%@wallet.defimexico.org';

SELECT i.provider, count(*) AS linked_identities
FROM auth.identities i
JOIN auth.users u ON u.id = i.user_id
WHERE u.email LIKE '%@wallet.defimexico.org'
GROUP BY i.provider;

SELECT count(*) AS session_rows
FROM auth.sessions s
JOIN auth.users u ON u.id = s.user_id
WHERE u.email LIKE '%@wallet.defimexico.org';

SELECT count(*) AS unrevoked_refresh_token_rows
FROM auth.refresh_tokens t
JOIN auth.users u ON u.id::text = t.user_id::text
WHERE u.email LIKE '%@wallet.defimexico.org' AND t.revoked IS NOT TRUE;

ROLLBACK;
