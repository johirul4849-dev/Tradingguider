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

const YAHOO_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json,text/plain,*/*',
};

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
    volume24h: number,
    isLive: boolean,
    source: string,
    bidOverride?: number,
    askOverride?: number
  ) => {
    const p = Number(price.toFixed(metaConfig.decimals));
    const bidVal = bidOverride !== undefined ? Number(bidOverride.toFixed(metaConfig.decimals)) : Number((p - halfSpread).toFixed(metaConfig.decimals));
    const askVal = askOverride !== undefined ? Number(askOverride.toFixed(metaConfig.decimals)) : Number((p + halfSpread).toFixed(metaConfig.decimals));
    return res.status(200).json({
      symbol,
      price: p,
      bid: bidVal,
      ask: askVal,
      high24h: Number(high24h.toFixed(metaConfig.decimals)),
      low24h: Number(low24h.toFixed(metaConfig.decimals)),
      change24hPct: Number(change24hPct.toFixed(2)),
      volume24h,
      isLive,
      source,
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
          const b = parseFloat(bd.bidPrice) || p - halfSpread;
          const a = parseFloat(bd.askPrice) || p + halfSpread;
          if (p > 0) {
            return respond(
              p,
              parseFloat(bd.highPrice) || p * 1.02,
              parseFloat(bd.lowPrice) || p * 0.98,
              parseFloat(bd.priceChangePercent) || 0,
              parseFloat(bd.volume) || 45000,
              true,
              'BINANCE VISION BTC/USD',
              b,
              a
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
            return respond(p, p * 1.015, p * 0.985, 0.85, 24000, true, 'COINBASE BTC/USD');
          }
        }
      } catch (_e) {}
    }

    // Primary Institutional BBO live quote via Swissquote for all 25 FX pairs + XAU/USD + XAG/USD
    if (symbol !== 'BTC/USD' && symbol.includes('/')) {
      try {
        const [base, quote] = symbol.split('/');
        const sqRes = await fetch(
          `https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/${encodeURIComponent(base)}/${encodeURIComponent(quote)}`
        );
        if (sqRes.ok) {
          const sqJson: any = await sqRes.json();
          if (Array.isArray(sqJson)) {
            for (const feed of sqJson) {
              const profiles: any[] = feed?.spreadProfilePrices || [];
              const chosen =
                profiles.find((p) => p.spreadProfile === 'prime') ||
                profiles.find((p) => p.spreadProfile === 'standard') ||
                profiles[0];
              if (chosen && Number(chosen.bid) > 0 && Number(chosen.ask) > 0) {
                const bid = Number(chosen.bid);
                const ask = Number(chosen.ask);
                const mid = (bid + ask) / 2;
                return respond(
                  mid,
                  mid + metaConfig.defaultBracketDistance,
                  mid - metaConfig.defaultBracketDistance,
                  0.12,
                  18500,
                  true,
                  `SWISSQUOTE BBO (${symbol})`,
                  bid,
                  ask
                );
              }
            }
          }
        }
      } catch (_e) {}
    }

    // Fallback: Yahoo Finance query2 & query1
    for (const host of ['query2.finance.yahoo.com', 'query1.finance.yahoo.com']) {
      try {
        const yr = await fetch(
          `https://${host}/v8/finance/chart/${encodeURIComponent(metaConfig.yahooSymbol)}?interval=1m&range=1d`,
          { headers: YAHOO_HEADERS }
        );
        if (yr.ok) {
          const yd: any = await yr.json();
          const result = yd?.chart?.result?.[0];
          const yMeta = result?.meta;
          const closes: number[] = (result?.indicators?.quote?.[0]?.close || []).filter(
            (v: any) => typeof v === 'number' && isFinite(v) && v > 0
          );
          const latestBarClose = closes.length ? closes[closes.length - 1] : 0;
          const metaPrice = Number(yMeta?.regularMarketPrice || 0);
          const rawPrice =
            latestBarClose > 0 && (metaPrice <= 0 || Math.abs(latestBarClose - metaPrice) / metaPrice < 0.02)
              ? latestBarClose
              : metaPrice;
          if (rawPrice > 0) {
            const prevClose = Number(yMeta?.chartPreviousClose || closes[0] || rawPrice);
            const changePct = prevClose > 0 ? ((rawPrice - prevClose) / prevClose) * 100 : 0;
            return respond(
              rawPrice,
              Number(yMeta?.regularMarketDayHigh || rawPrice * 1.004),
              Number(yMeta?.regularMarketDayLow || rawPrice * 0.996),
              changePct,
              Number(yMeta?.regularMarketVolume || 16500),
              true,
              `YAHOO LIVE (${metaConfig.yahooSymbol})`
            );
          }
        }
      } catch (_e) {}
    }

    if (metaConfig.category === 'Forex Major' || metaConfig.category === 'Forex Cross') {
      try {
        const er = await fetch('https://open.er-api.com/v6/latest/USD');
        if (er.ok) {
          const ej: any = await er.json();
          const [base, quote] = symbol.split('/');
          const rates = ej?.rates || {};
          const uBase = base === 'USD' ? 1 : rates[base];
          const uQuote = quote === 'USD' ? 1 : rates[quote];
          if (uBase > 0 && uQuote > 0) {
            const p = uQuote / uBase;
            return respond(
              p,
              p + metaConfig.defaultBracketDistance,
              p - metaConfig.defaultBracketDistance,
              0.08,
              14000,
              true,
              `OPEN-ER FX CROSS (${symbol})`
            );
          }
        }
      } catch (_e) {}
    }

    if (symbol === 'XAU/USD') {
      try {
        const gr = await fetch('https://api.gold-api.com/price/XAU');
        if (gr.ok) {
          const gd: any = await gr.json();
          if (gd && gd.price > 0) {
            return respond(gd.price, gd.price * 1.01, gd.price * 0.99, 0.45, 18500, true, 'GOLD-API LIVE SPOT');
          }
        }
      } catch (_e) {}
    }

    return respond(
      metaConfig.defaultPrice,
      metaConfig.defaultPrice + metaConfig.defaultBracketDistance,
      metaConfig.defaultPrice - metaConfig.defaultBracketDistance,
      0,
      10000,
      false,
      'CALIBRATED BASELINE'
    );
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
