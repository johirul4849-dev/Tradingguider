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
  const timeframe = String((req.query && req.query.timeframe) || '15m');
  const metaConfig = resolveSymbolConfig(rawSymbol);
  const symbol = metaConfig.id;
  const session = getMarketSessionStatus(symbol);

  if (symbol !== 'BTC/USD') {
    const yahooTfMap: Record<string, { interval: string; range: string }> = {
      '1m': { interval: '1m', range: '7d' },
      '5m': { interval: '5m', range: '1mo' },
      '15m': { interval: '15m', range: '1mo' },
      '30m': { interval: '30m', range: '1mo' },
      '1H': { interval: '1h', range: '3mo' },
      '4H': { interval: '1h', range: '3mo' },
      '1D': { interval: '1d', range: '1y' },
    };
    const cfg = yahooTfMap[timeframe] || yahooTfMap['15m'];
    try {
      const yRes = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
          metaConfig.yahooSymbol
        )}?interval=${cfg.interval}&range=${cfg.range}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      if (yRes.ok) {
        const yJson: any = await yRes.json();
        const result = yJson?.chart?.result?.[0];
        const timestamps: any[] = result?.timestamp || [];
        const quote = result?.indicators?.quote?.[0];
        if (Array.isArray(timestamps) && quote) {
          const dec = metaConfig.decimals;
          let candles: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }> = [];
          for (let i = 0; i < timestamps.length; i++) {
            const t = Number(timestamps[i]);
            const o = Number(quote.open?.[i]);
            const h = Number(quote.high?.[i]);
            const l = Number(quote.low?.[i]);
            const c = Number(quote.close?.[i]);
            if (!isFinite(t) || !isFinite(o) || !isFinite(h) || !isFinite(l) || !isFinite(c) || o <= 0 || c <= 0) {
              continue;
            }
            const rawVol = Number(quote.volume?.[i]);
            candles.push({
              time: Math.floor(t),
              open: Number(o.toFixed(dec)),
              high: Number(Math.max(o, h, c).toFixed(dec)),
              low: Number(Math.min(o, l, c).toFixed(dec)),
              close: Number(c.toFixed(dec)),
              volume: isFinite(rawVol) && rawVol > 0 ? Math.round(rawVol) : 500,
            });
          }
          candles.sort((a, b) => a.time - b.time);

          if (timeframe === '4H') {
            const buckets = new Map<number, (typeof candles)[number]>();
            for (const bar of candles) {
              const bucketTime = Math.floor(bar.time / 14400) * 14400;
              const prev = buckets.get(bucketTime);
              if (!prev) {
                buckets.set(bucketTime, { ...bar, time: bucketTime });
              } else {
                prev.high = Number(Math.max(prev.high, bar.high).toFixed(dec));
                prev.low = Number(Math.min(prev.low, bar.low).toFixed(dec));
                prev.close = bar.close;
                prev.volume += bar.volume;
              }
            }
            candles = Array.from(buckets.values()).sort((a, b) => a.time - b.time);
          }

          if (candles.length > 20) {
            const last = candles[candles.length - 1];
            const prev24 = candles[Math.max(0, candles.length - 25)] || candles[0];
            const changePct = prev24?.close
              ? Number((((last.close - prev24.close) / prev24.close) * 100).toFixed(2))
              : 0;
            return res.status(200).json({
              symbol,
              timeframe,
              price: last.close,
              changePercent: changePct,
              high24h: Math.max(...candles.slice(-24).map((c) => c.high)),
              low24h: Math.min(...candles.slice(-24).map((c) => c.low)),
              isLive: true,
              marketOpen: session.isOpen,
              marketStatusLabel: session.statusLabel,
              countdownText: session.countdownText,
              nextTransitionAt: session.nextTransitionAt,
              decimals: metaConfig.decimals,
              source: `YAHOO INSTITUTIONAL FX/METALS (${metaConfig.yahooSymbol})`,
              candles,
            });
          }
        }
      }
    } catch (_e) {}
  }

  const tfMap: Record<string, string> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1H': '1h',
    '4H': '4h',
    '1D': '1d',
  };
  const binanceInterval = tfMap[timeframe] || '15m';
  const binancePair = symbol === 'XAU/USD' ? 'PAXGUSDT' : 'BTCUSDT';

  for (const url of [
    `https://data-api.binance.vision/api/v3/klines?symbol=${binancePair}&interval=${binanceInterval}&limit=1000`,
    `https://api.binance.com/api/v3/klines?symbol=${binancePair}&interval=${binanceInterval}&limit=1000`,
  ]) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const bRes = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (bRes.ok) {
        const raw: any[] = await bRes.json();
        if (Array.isArray(raw) && raw.length > 20) {
          const candles = raw.map((k: any) => ({
            time: Math.floor(k[0] / 1000),
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: Math.round(parseFloat(k[5]) || 50),
          }));
          const last = candles[candles.length - 1];
          const prev24 = candles[Math.max(0, candles.length - 25)] || candles[0];
          const changePct = prev24?.close
            ? Number((((last.close - prev24.close) / prev24.close) * 100).toFixed(2))
            : 0;
          return res.status(200).json({
            symbol,
            timeframe,
            price: last.close,
            changePercent: changePct,
            high24h: Math.max(...candles.slice(-24).map((c) => c.high)),
            low24h: Math.min(...candles.slice(-24).map((c) => c.low)),
            isLive: true,
            marketOpen: session.isOpen,
            marketStatusLabel: session.statusLabel,
            countdownText: session.countdownText,
            nextTransitionAt: session.nextTransitionAt,
            decimals: metaConfig.decimals,
            source: symbol === 'XAU/USD' ? 'BINANCE VISION PHYSICAL LONDON GOLD (PAXG)' : 'BINANCE VISION BTC/USD',
            candles,
          });
        }
      }
    } catch (_e) {}
  }

  return res.status(500).json({ error: 'Failed to fetch authentic market history' });
}
