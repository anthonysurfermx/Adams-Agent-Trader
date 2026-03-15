#!/bin/bash
# okx-signals.sh — Fetch whale movement signals from OKX OnchainOS
# Usage: ./okx-signals.sh [token_symbol]

TOKEN="${1:-BTC}"

echo "=== OKX OnchainOS Whale Signals for $TOKEN ==="
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Token overview (whale holdings, concentration)
echo ""
echo "--- Token Overview ---"
curl -s "https://www.okx.com/api/v5/dex/onchain/token-overview?chainId=1&tokenContractAddress=native" \
  -H "Ok-Access-Key: ${OKX_API_KEY:-}" 2>/dev/null | jq -r ".data // \"No data\"" 2>/dev/null || echo "OKX API unavailable"

# Whale transactions (large transfers)
echo ""
echo "--- Recent Whale Transactions ---"
curl -s "https://www.okx.com/api/v5/dex/onchain/whale-transaction?chainId=1&limit=10" \
  -H "Ok-Access-Key: ${OKX_API_KEY:-}" 2>/dev/null | jq -r ".data[:5] // \"No data\"" 2>/dev/null || echo "OKX API unavailable"

# Net flow (inflow vs outflow to exchanges)
echo ""
echo "--- Exchange Net Flow ---"
curl -s "https://www.okx.com/api/v5/rubik/stat/token-flow?ccy=$TOKEN&period=1H" 2>/dev/null | jq -r ".data[:3] // \"No data\"" 2>/dev/null || echo "Flow data unavailable"

echo ""
echo "Signal age: FRESH (just fetched)"
