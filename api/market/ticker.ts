import {
  BRAND_CONFIG,
  ALL_SUPPORTED_SYMBOLS,
  getMarketSessionStatus,
  MarketSymbolConfig,
  SupportedSymbol,
} from '../../src/config/brand';

function resolveSymbolConfig(rawSymbol: string): MarketSymbolConfig {
  const candidate = rawSymbol as SupportedSymbol;
  if (ALL_SUPPORTED_SYMBOLS.includes(candidate)) {
    return BRAND_CONFIG.markets[candidate];
  }
  return BRAND_CONFIG.markets['BTC/USD'];
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const rawSymbol = String((req.query && req.query.symbol) || 'BTC/USD');
  const metaConfig = resolveSymbolConfig(rawSymbol);
  const symbol = metaConfig.id;
  const session = getMarketSessionStatus(symbol);
  const halfSpread = metaConfig.typicalSpread / 2;

  const respond = (
    price: number,
    high24h: number,
    low24h: number,
    change24hPct: number,
    volume24h: number
  ) => {
    const p = Number(price.toFixed(metaConfig.decimals));
    return res.status(200).json({
      symbol,
      price: p,
      bid: Number((p - halfSpread).toFixed(metaConfig.decimals)),
      ask: Number((p + halfSpread).toFixed(metaConfig.decimals)),
      high24h: Number(high24h.toFixed(metaConfig.decimals)),
      low24h: Number(low24h.toFixed(metaConfig.decimals)),
      change24hPct: Number(change24hPct.toFixed(2)),
      volume24h,
      marketOpen: session.isOpen,
      marketStatusLabel: session.statusLabel,
      countdownText: session.countdownText,
      nextTransitionAt: session.nextTransitionAt,
      decimals: metaConfig.decimals,
      timestamp: Date.now(),
    });
  };

  try {
    if (symbol === 'BTC/USD') {
      try {
        const br = await fetch('https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT');
        if (br.ok) {
          const bd = await br.json();
          const p = parseFloat(bd.lastPrice);
          if (p > 0) {
            return respond(
              p,
              parseFloat(bd.highPrice) || p * 1.02,
              parseFloat(bd.lowPrice) || p * 0.98,
              parseFloat(bd.priceChangePercent) || 0,
              parseFloat(bd.volume) || 45000
            );
          }
        }
      } catch (_e) {}

      try {
        const cr = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot');
        if (cr.ok) {
          const cd = await cr.json();
          const p = parseFloat(cd?.data?.amount);
          if (p > 0) {
            return respond(p, p * 1.015, p * 0.985, 0.85, 24000);
          }
        }
      } catch (_e) {}
    }

    // Try Yahoo Finance for all Forex pairs, XAG/USD, XAU/USD (and BTC fallback)
    try {
      const yr = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(metaConfig.yahooSymbol)}?interval=5m&range=1d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      if (yr.ok) {
        const yd: any = await yr.json();
        const result = yd?.chart?.result?.[0];
        const yMeta = result?.meta;
        const closes: number[] = (result?.indicators?.quote?.[0]?.close || []).filter(
          (v: any) => typeof v === 'number' && isFinite(v) && v > 0
        );
        const rawPrice = Number(yMeta?.regularMarketPrice || closes[closes.length - 1] || 0);
        if (rawPrice > 0) {
          const prevClose = Number(yMeta?.chartPreviousClose || closes[0] || rawPrice);
          const changePct = prevClose > 0 ? ((rawPrice - prevClose) / prevClose) * 100 : 0;
          return respond(
            rawPrice,
            Number(yMeta?.regularMarketDayHigh || rawPrice * 1.004),
            Number(yMeta?.regularMarketDayLow || rawPrice * 0.996),
            changePct,
            Number(yMeta?.regularMarketVolume || 16500)
          );
        }
      }
    } catch (_e) {}

    if (symbol === 'XAU/USD') {
      try {
        const gr = await fetch('https://api.gold-api.com/price/XAU');
        if (gr.ok) {
          const gd: any = await gr.json();
          if (gd && gd.price > 0) {
            return respond(gd.price, gd.price * 1.01, gd.price * 0.99, 0.45, 18500);
          }
        }
      } catch (_e) {}
    }

    return respond(
      metaConfig.defaultPrice,
      metaConfig.defaultPrice + metaConfig.defaultBracketDistance,
      metaConfig.defaultPrice - metaConfig.defaultBracketDistance,
      0,
      10000
    );
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
