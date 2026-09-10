// Only bounded structured state is shared with voice; no screenshots or free-form instructions.
export function voiceScreenState(symbol: unknown, timeframe: unknown) {
  const ticker = typeof symbol === 'string' ? symbol.trim().toUpperCase() : '';
  return {
    symbol: /^[A-Z0-9][A-Z0-9.-]{0,14}$/.test(ticker) ? ticker : 'BTC',
    timeframe: typeof timeframe === 'string' && ['5m', '15m', '1H', '4H', '1D'].includes(timeframe) ? timeframe : '1H',
  };
}

export function voiceScreenContext(symbol: unknown, timeframe: unknown): string {
  return `CURRENT SCREEN (selection only, fetch tools for live facts): ${JSON.stringify(voiceScreenState(symbol, timeframe))}`;
}
