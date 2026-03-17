// ============================================================
// POST /api/okx-perps
// OKX Perpetual Futures — Execute leveraged trades from Bobby
// User provides their OKX API credentials client-side
// Bobby generates the order, user confirms, we execute
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';

const OKX_BASE = 'https://www.okx.com';

// ---- OKX API Signature ----
function signOKX(
  timestamp: string,
  method: string,
  path: string,
  body: string,
  secretKey: string,
): string {
  const prehash = timestamp + method.toUpperCase() + path + body;
  return createHmac('sha256', secretKey).update(prehash).digest('base64');
}

async function okxRequest(
  method: string,
  path: string,
  body: Record<string, unknown> | null,
  credentials: { apiKey: string; secret: string; passphrase: string },
): Promise<any> {
  const timestamp = new Date().toISOString();
  const bodyStr = body ? JSON.stringify(body) : '';
  const sign = signOKX(timestamp, method, path, bodyStr, credentials.secret);

  const res = await fetch(`${OKX_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'OK-ACCESS-KEY': credentials.apiKey,
      'OK-ACCESS-SIGN': sign,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': credentials.passphrase,
      'x-simulated-trading': '0', // Live trading
    },
    ...(body ? { body: bodyStr } : {}),
  });

  return res.json();
}

// ---- Instrument ID mapping ----
function getInstId(symbol: string): string {
  const map: Record<string, string> = {
    BTC: 'BTC-USDT-SWAP',
    ETH: 'ETH-USDT-SWAP',
    SOL: 'SOL-USDT-SWAP',
    OKB: 'OKB-USDT-SWAP',
    XRP: 'XRP-USDT-SWAP',
    DOGE: 'DOGE-USDT-SWAP',
    AVAX: 'AVAX-USDT-SWAP',
    LINK: 'LINK-USDT-SWAP',
    DOT: 'DOT-USDT-SWAP',
    ADA: 'ADA-USDT-SWAP',
    ARB: 'ARB-USDT-SWAP',
    OP: 'OP-USDT-SWAP',
    MATIC: 'MATIC-USDT-SWAP',
    ATOM: 'ATOM-USDT-SWAP',
    UNI: 'UNI-USDT-SWAP',
  };
  return map[symbol.toUpperCase()] || `${symbol.toUpperCase()}-USDT-SWAP`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, credentials, params } = req.body as {
    action: string;
    credentials?: { apiKey: string; secret: string; passphrase: string };
    params?: Record<string, any>;
  };

  // ── PUBLIC: Get mark price + funding (no credentials needed) ──
  if (action === 'market_info') {
    const symbol = params?.symbol || 'BTC';
    const instId = getInstId(symbol);

    try {
      const [tickerRes, fundingRes] = await Promise.all([
        fetch(`${OKX_BASE}/api/v5/market/ticker?instId=${instId}`),
        fetch(`${OKX_BASE}/api/v5/public/funding-rate?instId=${instId}`),
      ]);

      const ticker = await tickerRes.json();
      const funding = await fundingRes.json();

      const t = ticker.data?.[0];
      const f = funding.data?.[0];

      return res.status(200).json({
        ok: true,
        symbol,
        instId,
        markPrice: parseFloat(t?.last || '0'),
        change24h: parseFloat(t?.sodUtc8 ? (((parseFloat(t.last) - parseFloat(t.sodUtc8)) / parseFloat(t.sodUtc8)) * 100).toFixed(2) : '0'),
        volume24h: parseFloat(t?.volCcy24h || '0'),
        fundingRate: parseFloat(f?.fundingRate || '0'),
        nextFundingTime: f?.fundingTime,
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: 'Failed to fetch market info' });
    }
  }

  // ── PUBLIC: Get available leverage for an instrument ──
  if (action === 'leverage_info') {
    const symbol = params?.symbol || 'BTC';
    const instId = getInstId(symbol);

    try {
      const leverageRes = await fetch(
        `${OKX_BASE}/api/v5/public/instruments?instType=SWAP&instId=${instId}`
      );
      const data = await leverageRes.json();
      const inst = data.data?.[0];

      return res.status(200).json({
        ok: true,
        symbol,
        instId,
        maxLeverage: parseInt(inst?.lever || '125'),
        minSize: inst?.minSz || '1',
        tickSize: inst?.tickSz,
        ctVal: inst?.ctVal, // Contract value per unit
        ctMult: inst?.ctMult,
        settleCcy: inst?.settleCcy || 'USDT',
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: 'Failed to fetch leverage info' });
    }
  }

  // ── Everything below requires OKX API credentials ──
  if (!credentials?.apiKey || !credentials?.secret || !credentials?.passphrase) {
    return res.status(400).json({
      error: 'OKX API credentials required',
      hint: 'Get API keys from okx.com → API Management. Enable Trading permission.',
    });
  }

  // ── SET LEVERAGE ──
  if (action === 'set_leverage') {
    const symbol = params?.symbol || 'BTC';
    const leverage = params?.leverage || 10;
    const instId = getInstId(symbol);
    const side = params?.direction === 'short' ? 'short' : 'long';

    try {
      const result = await okxRequest('POST', '/api/v5/account/set-leverage', {
        instId,
        lever: String(leverage),
        mgnMode: 'cross', // Cross margin
        posSide: side,
      }, credentials);

      return res.status(200).json({
        ok: result.code === '0',
        data: result.data,
        error: result.code !== '0' ? result.msg : undefined,
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: 'Failed to set leverage' });
    }
  }

  // ── OPEN POSITION (Market Order) ──
  if (action === 'open_position') {
    const symbol = params?.symbol || 'BTC';
    const direction = params?.direction || 'long'; // 'long' or 'short'
    const leverage = params?.leverage || 10;
    const amountUSDT = params?.amount || 50; // USDT margin
    const instId = getInstId(symbol);

    try {
      // Step 1: Set leverage
      await okxRequest('POST', '/api/v5/account/set-leverage', {
        instId,
        lever: String(leverage),
        mgnMode: 'cross',
        posSide: direction === 'short' ? 'short' : 'long',
      }, credentials);

      // Step 2: Get contract size info
      const instRes = await fetch(
        `${OKX_BASE}/api/v5/public/instruments?instType=SWAP&instId=${instId}`
      );
      const instData = await instRes.json();
      const ctVal = parseFloat(instData.data?.[0]?.ctVal || '0.01');

      // Step 3: Get mark price
      const priceRes = await fetch(`${OKX_BASE}/api/v5/market/ticker?instId=${instId}`);
      const priceData = await priceRes.json();
      const markPrice = parseFloat(priceData.data?.[0]?.last || '0');

      // Step 4: Calculate contract quantity
      // With cross margin: notional = amount * leverage
      // Contracts = notional / (ctVal * markPrice)
      const notional = amountUSDT * leverage;
      const contracts = Math.floor(notional / (ctVal * markPrice));

      if (contracts < 1) {
        return res.status(400).json({
          ok: false,
          error: `Amount too small. Minimum ${(ctVal * markPrice / leverage).toFixed(2)} USDT needed for 1 contract.`,
        });
      }

      // Step 5: Place market order
      const orderResult = await okxRequest('POST', '/api/v5/trade/order', {
        instId,
        tdMode: 'cross',
        side: direction === 'long' ? 'buy' : 'sell',
        posSide: direction === 'long' ? 'long' : 'short',
        ordType: 'market',
        sz: String(contracts),
      }, credentials);

      if (orderResult.code !== '0') {
        return res.status(400).json({
          ok: false,
          error: orderResult.data?.[0]?.sMsg || orderResult.msg || 'Order failed',
          code: orderResult.data?.[0]?.sCode,
        });
      }

      return res.status(200).json({
        ok: true,
        action: 'position_opened',
        symbol,
        direction,
        leverage: `${leverage}x`,
        margin: `${amountUSDT} USDT`,
        notional: `${notional} USDT`,
        contracts,
        markPrice,
        orderId: orderResult.data?.[0]?.ordId,
        instId,
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: 'Failed to open position' });
    }
  }

  // ── CLOSE POSITION ──
  if (action === 'close_position') {
    const symbol = params?.symbol || 'BTC';
    const direction = params?.direction || 'long';
    const instId = getInstId(symbol);

    try {
      const result = await okxRequest('POST', '/api/v5/trade/close-position', {
        instId,
        mgnMode: 'cross',
        posSide: direction === 'long' ? 'long' : 'short',
      }, credentials);

      return res.status(200).json({
        ok: result.code === '0',
        action: 'position_closed',
        symbol,
        direction,
        data: result.data,
        error: result.code !== '0' ? result.msg : undefined,
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: 'Failed to close position' });
    }
  }

  // ── SET TP/SL (Take Profit / Stop Loss) ──
  if (action === 'set_tpsl') {
    const symbol = params?.symbol || 'BTC';
    const direction = params?.direction || 'long';
    const takeProfit = params?.takeProfit;
    const stopLoss = params?.stopLoss;
    const instId = getInstId(symbol);

    if (!takeProfit && !stopLoss) {
      return res.status(400).json({ error: 'At least one of takeProfit or stopLoss required' });
    }

    try {
      // Get current position size
      const posRes = await okxRequest('GET', `/api/v5/account/positions?instId=${instId}`, null, credentials);
      const pos = posRes.data?.find((p: any) => p.posSide === (direction === 'long' ? 'long' : 'short'));

      if (!pos || parseFloat(pos.pos) === 0) {
        return res.status(400).json({ ok: false, error: 'No open position found' });
      }

      const closeSide = direction === 'long' ? 'sell' : 'buy';
      const results: any[] = [];

      // Take profit order
      if (takeProfit) {
        const tpResult = await okxRequest('POST', '/api/v5/trade/order-algo', {
          instId,
          tdMode: 'cross',
          side: closeSide,
          posSide: direction === 'long' ? 'long' : 'short',
          ordType: 'conditional',
          sz: pos.pos,
          tpTriggerPx: String(takeProfit),
          tpOrdPx: '-1', // Market price
          tpTriggerPxType: 'mark',
        }, credentials);
        results.push({ type: 'tp', ...tpResult });
      }

      // Stop loss order
      if (stopLoss) {
        const slResult = await okxRequest('POST', '/api/v5/trade/order-algo', {
          instId,
          tdMode: 'cross',
          side: closeSide,
          posSide: direction === 'long' ? 'long' : 'short',
          ordType: 'conditional',
          sz: pos.pos,
          slTriggerPx: String(stopLoss),
          slOrdPx: '-1', // Market price
          slTriggerPxType: 'mark',
        }, credentials);
        results.push({ type: 'sl', ...slResult });
      }

      return res.status(200).json({
        ok: true,
        action: 'tpsl_set',
        symbol,
        direction,
        takeProfit,
        stopLoss,
        results,
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: 'Failed to set TP/SL' });
    }
  }

  // ── GET POSITIONS ──
  if (action === 'positions') {
    try {
      const result = await okxRequest('GET', '/api/v5/account/positions?instType=SWAP', null, credentials);

      const positions = (result.data || [])
        .filter((p: any) => parseFloat(p.pos) !== 0)
        .map((p: any) => ({
          symbol: p.instId.split('-')[0],
          instId: p.instId,
          direction: p.posSide,
          size: parseFloat(p.pos),
          leverage: `${p.lever}x`,
          entryPrice: parseFloat(p.avgPx),
          markPrice: parseFloat(p.markPx),
          unrealizedPnl: parseFloat(p.upl),
          unrealizedPnlPct: parseFloat(p.uplRatio) * 100,
          margin: parseFloat(p.margin),
          liquidationPrice: parseFloat(p.liqPx || '0'),
        }));

      return res.status(200).json({ ok: true, positions });
    } catch (err) {
      return res.status(500).json({ ok: false, error: 'Failed to fetch positions' });
    }
  }

  // ── GET ACCOUNT BALANCE ──
  if (action === 'balance') {
    try {
      const result = await okxRequest('GET', '/api/v5/account/balance', null, credentials);
      const details = result.data?.[0]?.details || [];

      return res.status(200).json({
        ok: true,
        totalEquity: parseFloat(result.data?.[0]?.totalEq || '0'),
        availableBalance: parseFloat(result.data?.[0]?.availBal || '0'),
        currencies: details.map((d: any) => ({
          currency: d.ccy,
          available: parseFloat(d.availBal),
          equity: parseFloat(d.eq),
          unrealizedPnl: parseFloat(d.upl),
        })),
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: 'Failed to fetch balance' });
    }
  }

  return res.status(400).json({ error: `Unknown action: ${action}` });
}
