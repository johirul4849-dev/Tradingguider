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

  const { symbol = 'BTC/USD' } = req.query || {};
  const isGold = symbol === 'XAU/USD';

  try {
    if (isGold) {
      // 1. Try Binance Vision PAXGUSDT 24hr ticker
      try {
        const pr = await fetch('https://data-api.binance.vision/api/v3/ticker/24hr?symbol=PAXGUSDT');
        if (pr.ok) {
          const pd = await pr.json();
          const p = parseFloat(pd.lastPrice);
          if (p > 0) {
            return res.status(200).json({
              symbol: 'XAU/USD',
              price: p,
              bid: Number((p - 0.2).toFixed(2)),
              ask: Number((p + 0.2).toFixed(2)),
              high24h: parseFloat(pd.highPrice) || p * 1.01,
              low24h: parseFloat(pd.lowPrice) || p * 0.99,
              change24hPct: parseFloat(pd.priceChangePercent) || 0,
              volume24h: parseFloat(pd.volume) || 5000,
              timestamp: Date.now(),
            });
          }
        }
      } catch (_e) {}

      // 2. Try gold-api.com
      const gr = await fetch('https://api.gold-api.com/price/XAU');
      if (gr.ok) {
        const gd = await gr.json();
        if (gd && gd.price > 0) {
          const spread = 0.2;
          return res.status(200).json({
            symbol: 'XAU/USD',
            price: gd.price,
            bid: Number((gd.price - spread).toFixed(2)),
            ask: Number((gd.price + spread).toFixed(2)),
            high24h: gd.price * 1.015,
            low24h: gd.price * 0.985,
            change24hPct: 0.45,
            volume24h: 18500,
            timestamp: Date.now(),
          });
        }
      }
    } else {
      // BTC/USD: Binance Vision
      try {
        const br = await fetch('https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT');
        if (br.ok) {
          const bd = await br.json();
          const p = parseFloat(bd.lastPrice);
          if (p > 0) {
            return res.status(200).json({
              symbol: 'BTC/USD',
              price: p,
              bid: Number((p - 3.5).toFixed(2)),
              ask: Number((p + 3.5).toFixed(2)),
              high24h: parseFloat(bd.highPrice) || p * 1.02,
              low24h: parseFloat(bd.lowPrice) || p * 0.98,
              change24hPct: parseFloat(bd.priceChangePercent) || 0,
              volume24h: parseFloat(bd.volume) || 45000,
              timestamp: Date.now(),
            });
          }
        }
      } catch (_e) {}

      // Fallback: Coinbase
      const cr = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot');
      if (cr.ok) {
        const cd = await cr.json();
        const p = parseFloat(cd?.data?.amount);
        if (p > 0) {
          return res.status(200).json({
            symbol: 'BTC/USD',
            price: p,
            bid: Number((p - 3.5).toFixed(2)),
            ask: Number((p + 3.5).toFixed(2)),
            high24h: p * 1.015,
            low24h: p * 0.985,
            change24hPct: 0.85,
            volume24h: 24000,
            timestamp: Date.now(),
          });
        }
      }
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }

  return res.status(500).json({ error: 'Failed to fetch ticker' });
}
