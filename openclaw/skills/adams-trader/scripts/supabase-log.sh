#!/bin/bash
# supabase-log.sh — Log cycle results to Supabase
# Usage: ./supabase-log.sh <status> <signals_found> <trades_executed> <trades_successful> <mood>
# Requires: SUPABASE_URL, SUPABASE_SERVICE_KEY env vars

STATUS="${1:-completed}"
SIGNALS="${2:-0}"
TRADES="${3:-0}"
SUCCESSFUL="${4:-0}"
MOOD="${5:-confident}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set"
  exit 1
fi

RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/agent_cycles" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"status\": \"${STATUS}\",
    \"signals_found\": ${SIGNALS},
    \"trades_executed\": ${TRADES},
    \"trades_successful\": ${SUCCESSFUL},
    \"mood\": \"${MOOD}\",
    \"safe_mode_active\": false
  }")

echo "Logged cycle: status=$STATUS, signals=$SIGNALS, trades=$TRADES, successful=$SUCCESSFUL, mood=$MOOD"
echo "Response: $RESPONSE"
