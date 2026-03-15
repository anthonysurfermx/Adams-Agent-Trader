#!/bin/bash
# polymarket-consensus.sh — Fetch smart money consensus from Polymarket top traders
# Usage: ./polymarket-consensus.sh [limit]

LIMIT="${1:-10}"

echo "=== Polymarket Smart Money Consensus ==="
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Top PnL traders (leaderboard)
echo ""
echo "--- Top $LIMIT Traders by PnL ---"
TRADERS=$(curl -s "https://data-api.polymarket.com/v1/leaderboard?window=all&limit=$LIMIT&offset=0" 2>/dev/null)
echo "$TRADERS" | jq -r ".[] | \"\(.name // .proxyWallet[:8]): $\(.pnl | tonumber | floor) PnL, \(.positions) positions\"" 2>/dev/null || echo "Leaderboard unavailable"

# Get positions of top 3 traders
echo ""
echo "--- Top 3 Trader Positions ---"
for WALLET in $(echo "$TRADERS" | jq -r ".[0:3][].proxyWallet" 2>/dev/null); do
  echo ""
  echo "Trader: ${WALLET:0:8}..."
  curl -s "https://data-api.polymarket.com/positions?user=$WALLET&sizeThreshold=100&limit=5" 2>/dev/null | \
    jq -r ".[] | \"  \(.market.question[:60]): \(.outcome) @ $\(.currentValue | tonumber | floor)\"" 2>/dev/null || echo "  Positions unavailable"
done

echo ""
echo "Signal age: FRESH (just fetched)"
