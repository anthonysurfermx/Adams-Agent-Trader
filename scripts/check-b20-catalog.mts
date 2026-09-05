// Read-only listing preflight. No wallet, signatures, approval or swap calldata.
// A successful quote is NOT listing approval, legal eligibility or execution proof.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createPublicClient, http, parseAbi, getAddress, formatUnits, zeroAddress } from 'viem';
import { base } from 'viem/chains';
import { BASE_B20_ORACLE_REGISTRY, BASE_STOCK_SYMBOLS, BASE_SWAP_TOKENS, BASE_USDC } from '../src/lib/base-swap/tokens.js';

const source = 'https://www.base.org/stocks';
const technicalSource = 'https://docs.base.org/specifications/b20/tokenized-stocks-on-base';
const extraFeeds: Record<string, string> = {
  AMZNc: '0x06A8E4b3aBB3B7543d8396FB2B763d22820cB295',
  MSFTc: '0xeB10A6c9aa7E537aEd766C08c35Dae35B321b18c',
  MSTRc: '0xB3cE282CD188b35DA0E38D8Bc7d58e33173D202a',
  SNDKc: '0x388b0dC46C0Fb05A74BeE0994fa5b02c6Fcca2eA',
  SPCXc: '0x6A634B235903C4ad6376892180d6fF8612e3Fa68',
  TSLAc: '0xFaf869185383a24F8cb00e27BdA6b63B9905DCb4',
  COINc: '0x408e44f504A7371a345F03a73dDC96A4b48e8aa7',
  CRCLc: '0x0231cF2635D1E17bB5c2462cc7504Ba1fBd61f33',
  INTCc: '0xAB657C39bac0D5886250D70849e2E3E008F2EECB',
};
const candidates = [
  ...BASE_SWAP_TOKENS.filter(t => t.assetClass === 'tokenized-stock').map(t => ({ symbol: t.symbol, address: t.address })),
  { symbol: 'AMZNc', address: '0xb200000000000000000000d9192b6B456483C2E8' },
  { symbol: 'MSFTc', address: '0xB200000000000000000000Ab99cFa739E253872B' },
  { symbol: 'MSTRc', address: '0xb2000000000000000000004884b426556b92883d' },
  { symbol: 'SNDKc', address: '0xb200000000000000000000397293Cb8cda9a10c5' },
  { symbol: 'SPCXc', address: '0xb2000000000000000000007b9fcbd005511aCBd5' },
  { symbol: 'TSLAc', address: '0xb2000000000000000000001e800a7f5189430cD0' },
  { symbol: 'COINc', address: '0xb200000000000000000000c85a31389D71F3ecfb' },
  { symbol: 'CRCLc', address: '0xB20000000000000000000019f6E7C675b73C2e4D' },
  { symbol: 'INTCc', address: '0xB2000000000000000000004AFF16039bA04bdFBc' },
].map(t => ({ ...t, address: getAddress(t.address), referenceFeed: getAddress(extraFeeds[t.symbol] ?? BASE_SWAP_TOKENS.find(known => known.symbol === t.symbol)!.referenceFeed!) }));
const response = await fetch(source, { signal: AbortSignal.timeout(15_000) });
assert(response.ok, 'Official catalogue unavailable');
const html = await response.text();
const listed = [...new Set((html.match(/https:\/\/basescan\.org\/(?:token|address)\/0x[0-9a-fA-F]{40}/g) ?? [])
  .map(url => url.split('/').at(-1)!.toLowerCase()))];
const technicalResponse = await fetch(technicalSource, { signal: AbortSignal.timeout(15_000) });
assert(technicalResponse.ok, 'Official technical documentation unavailable');
const technicalHtml = (await technicalResponse.text()).toLowerCase();
for (const token of candidates) {
  assert(technicalHtml.includes(token.address.toLowerCase()), `${token.symbol}: address absent from the official technical documentation`);
  assert(technicalHtml.includes(token.referenceFeed.toLowerCase()), `${token.symbol}: feed absent from the official technical documentation`);
}
const client = createPublicClient({ chain: base, transport: http('https://base-rpc.publicnode.com', { timeout: 10_000, retryCount: 1 }) });
assert.equal(await client.getChainId(), 8453);
const blockNumber = await client.getBlockNumber();
const block = await client.getBlock({ blockNumber });
const factory = getAddress('0x33128a8fC17869897dcE68Ed026d694621f6FDfD');
const quoter = getAddress('0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a');
const abi = parseAbi([
  'function symbol() view returns (string)', 'function decimals() view returns (uint8)',
  'function multiplier() view returns (uint256)', 'function pausedFeatures() view returns (uint256)',
  'function isPaused(uint8 feature) view returns (bool)',
  'function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
  'function getOracleParams(address token) view returns (uint256 multiplier, bool paused)',
  'function getPool(address tokenA, address tokenB, uint24 fee) view returns (address)',
  'function liquidity() view returns (uint128)', 'function factory() view returns (address)',
  'function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96) params) view returns (uint256 amountOut,uint160 sqrtPriceX96After,uint32 initializedTicksCrossed,uint256 gasEstimate)',
]);
assert.equal((await client.readContract({ address: quoter, abi, functionName: 'factory', blockNumber })).toLowerCase(), factory.toLowerCase());
const results: unknown[] = [];
for (const token of candidates) {
  const [symbol, decimals, multiplier, pausedFeatures, oracle] = await Promise.all([
    client.readContract({ address: token.address, abi, functionName: 'symbol', blockNumber }),
    client.readContract({ address: token.address, abi, functionName: 'decimals', blockNumber }),
    client.readContract({ address: token.address, abi, functionName: 'multiplier', blockNumber }),
    client.readContract({ address: token.address, abi, functionName: 'pausedFeatures', blockNumber }),
    client.readContract({ address: BASE_B20_ORACLE_REGISTRY, abi, functionName: 'getOracleParams', args: [token.address], blockNumber }),
  ]);
  assert.equal(symbol, token.symbol, 'Ticker metadata differs from the reviewed listing');
  const [feedDecimals, round, transferPaused] = await Promise.all([
    client.readContract({ address: token.referenceFeed, abi, functionName: 'decimals', blockNumber }),
    client.readContract({ address: token.referenceFeed, abi, functionName: 'latestRoundData', blockNumber }),
    client.readContract({ address: token.address, abi, functionName: 'isPaused', args: [0], blockNumber }),
  ]);
  const referenceUsd = Number(formatUnits(round[1], feedDecimals));
  const referenceAgeSec = Number(block.timestamp - round[3]);
  const pools = await Promise.all([100, 500, 3000, 10000].map(async fee => {
    const address = await client.readContract({ address: factory, abi, functionName: 'getPool', args: [BASE_USDC, token.address, fee], blockNumber });
    if (address === zeroAddress) return { fee, address, status: 'no-pool' };
    const liquidity = await client.readContract({ address, abi, functionName: 'liquidity', blockNumber });
    if (liquidity === 0n) return { fee, address, liquidity: '0', status: 'no-active-liquidity' };
    try {
      const quote = await client.readContract({ address: quoter, abi, functionName: 'quoteExactInputSingle', args: [{ tokenIn: BASE_USDC, tokenOut: token.address, amountIn: 10_000_000n, fee, sqrtPriceLimitX96: 0n }], blockNumber });
      if (quote[0] === 0n) return { fee, address, liquidity: liquidity.toString(), status: 'zero-output' };
      const sell = await client.readContract({ address: quoter, abi, functionName: 'quoteExactInputSingle', args: [{ tokenIn: token.address, tokenOut: BASE_USDC, amountIn: quote[0], fee, sqrtPriceLimitX96: 0n }], blockNumber });
      const stockFor10Usdc = formatUnits(quote[0], decimals);
      return { fee, address, liquidity: liquidity.toString(), status: sell[0] > 0n ? 'both-quotes-available' : 'zero-sell-output', stockFor10Usdc, sellBackUsdc: formatUnits(sell[0], 6), buyDeviationPct: referenceUsd > 0 ? Math.abs((10 / Number(stockFor10Usdc)) / referenceUsd - 1) * 100 : null };
    } catch {
      return { fee, address, liquidity: liquidity.toString(), status: 'quote-unavailable' };
    }
  }));
  const result = { ...token, listedOnLanding: listed.includes(token.address.toLowerCase()), decimals, multiplier: multiplier.toString(), pausedFeatures: pausedFeatures.toString(), transferPaused, registryMultiplier: oracle[0].toString(), registryPaused: oracle[1], currentlyAllowedByBobby: BASE_STOCK_SYMBOLS.includes(symbol), feedDecimals, referenceUsd, referenceAgeSec, referenceRoundComplete: round[4] >= round[0] && round[3] > 0n, pools };
  results.push(result);
  console.log(JSON.stringify(result));
}
const report = { observedAt: new Date().toISOString(), source, technicalSource, chainId: 8453, blockNumber: blockNumber.toString(), officialListedAddressCount: listed.length, factory, quoter, scope: 'Direct USDC/stock Uniswap V3 independent buy/sell quotes for a 10 USDC buy size, plus reference reads. Not an executed round trip. No full ticket-range, eligibility or user transfer simulation proof. Sources may differ; no listing or execution enabled.', results };
const output = process.argv.find(arg => arg.startsWith('--out='))?.slice(6);
if (output) writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ blockNumber: report.blockNumber, officialListedAddressCount: listed.length, checked: results.length, output: output ?? null }));
