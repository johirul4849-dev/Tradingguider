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

  const { symbol = 'BTC/USD', timeframe = '15m' } = req.query || {};
  const isGold = symbol === 'XAU/USD';
  const binancePair = isGold ? 'PAXGUSDT' : 'BTCUSDT';

  const tfMap: Record<string, string> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1H': '1h',
    '4H': '4h',
    '1D': '1d',
  };
  const binanceInterval = tfMap[String(timeframe)] || '15m';

  const endpoints = [
    `https://data-api.binance.vision/api/v3/klines?symbol=${binancePair}&interval=${binanceInterval}&limit=1000`,
    `https://api.binance.com/api/v3/klines?symbol=${binancePair}&interval=${binanceInterval}&limit=1000`,
  ];

  for (const url of endpoints) {
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
            high24h: Math.max(...candles.slice(-24).map((c: any) => c.high)),
            low24h: Math.min(...candles.slice(-24).map((c: any) => c.low)),
            isLive: true,
            source: isGold ? 'BINANCE VISION PHYSICAL LONDON GOLD (PAXG)' : 'BINANCE VISION BTC/USD',
            candles,
          });
        }
      }
    } catch (_e) {
      // try next
    }
  }

  // Fallback: Coinbase for BTC
  if (!isGold) {
    try {
      const secMap: Record<string, number> = {
        '1m': 60,
        '5m': 300,
        '15m': 900,
        '30m': 1800,
        '1H': 3600,
        '4H': 21600,
        '1D': 86400,
      };
      const gran = secMap[String(timeframe)] || 900;
      const cRes = await fetch(`https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=${gran}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (cRes.ok) {
        const cd: any = await cRes.json();
        if (Array.isArray(cd) && cd.length > 20) {
          const candles = cd
            .map((c: any) => ({
              time: Number(c[0]),
              open: parseFloat(c[3]),
              high: parseFloat(c[2]),
              low: parseFloat(c[1]),
              close: parseFloat(c[4]),
              volume: Math.round(parseFloat(c[5]) || 50),
            }))
            .sort((a: any, b: any) => a.time - b.time);

          const last = candles[candles.length - 1];
          const prev24 = candles[Math.max(0, candles.length - 25)] || candles[0];
          const changePct = Number((((last.close - prev24.close) / prev24.close) * 100).toFixed(2));

          return res.status(200).json({
            symbol: 'BTC/USD',
            timeframe,
            price: last.close,
            changePercent: changePct,
            high24h: Math.max(...candles.slice(-24).map((c: any) => c.high)),
            low24h: Math.min(...candles.slice(-24).map((c: any) => c.low)),
            isLive: true,
            source: 'COINBASE SPOT BTC/USD',
            candles,
          });
        }
      }
    } catch (_e) {}
  }

  return res.status(500).json({ error: 'Failed to fetch authentic market history' });
}
