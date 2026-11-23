import {
  ALL_SUPPORTED_SYMBOLS,
  BRAND_CONFIG,
  getMarketSessionStatus,
  SupportedSymbol,
  SupportedTimeframe,
} from '../config/brand';
import { CandleData, TIMEFRAME_SECONDS } from './marketEngine';

export interface LiveMarketTick {
  symbol: SupportedSymbol;
  price: number;
  bid: number;
  ask: number;
  high24h: number;
  low24h: number;
  change24hPct: number;
  volume24h: number;
  candle: CandleData;
  marketOpen: boolean;
  timestamp: number;
}

export type LiveStreamStatus = 'CONNECTED' | 'CONNECTING' | 'RECONNECTING' | 'OFFLINE';

type TickListener = (tick: LiveMarketTick) => void;
type StatusListener = (status: LiveStreamStatus) => void;

function buildInitialTicks(): Record<SupportedSymbol, LiveMarketTick> {
  const nowMs = Date.now();
  const nowSec = Math.floor(nowMs / 1000);
  const ticks = {} as Record<SupportedSymbol, LiveMarketTick>;

  ALL_SUPPORTED_SYMBOLS.forEach((sym) => {
    const meta = BRAND_CONFIG.markets[sym];
    const halfSpread = meta.typicalSpread / 2;
    const session = getMarketSessionStatus(sym, nowMs);
    ticks[sym] = {
      symbol: sym,
      price: meta.defaultPrice,
      bid: Number((meta.defaultPrice - halfSpread).toFixed(meta.decimals)),
      ask: Number((meta.defaultPrice + halfSpread).toFixed(meta.decimals)),
      high24h: Number((meta.defaultPrice + meta.defaultBracketDistance).toFixed(meta.decimals)),
      low24h: Number((meta.defaultPrice - meta.defaultBracketDistance).toFixed(meta.decimals)),
      change24hPct: 0,
      volume24h: 14000,
      candle: {
        time: nowSec,
        open: meta.defaultPrice,
        high: Number((meta.defaultPrice + meta.tickSize * 5).toFixed(meta.decimals)),
        low: Number((meta.defaultPrice - meta.tickSize * 5).toFixed(meta.decimals)),
        close: meta.defaultPrice,
        volume: 45,
      },
      marketOpen: session.isOpen,
      timestamp: nowMs,
    };
  });

  return ticks;
}

class LiveMarketStreamerService {
  private ws: WebSocket | null = null;
  private sse: EventSource | null = null;
  private currentSymbol: SupportedSymbol = 'BTC/USD';
  private currentTimeframe: SupportedTimeframe = '15m';
  private tickListeners: Set<TickListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private status: LiveStreamStatus = 'CONNECTING';
  private reconnectTimer: any = null;
  private fallbackPollTimer: any = null;
  private sessionWatchTimer: any = null;
  private lastTickTime = 0;
  private lastObservedMarketOpen = true;

  // Cached latest ticks for all 28 supported symbols
  private latestTicks: Record<SupportedSymbol, LiveMarketTick> = buildInitialTicks();

  constructor() {
    this.lastObservedMarketOpen = getMarketSessionStatus(this.currentSymbol).isOpen;
    this.fetchInstantTicker(this.currentSymbol);
    this.connect();
    this.startFallbackPolling();
    this.startSessionWatcher();
  }

  public subscribeTicks(listener: TickListener) {
    this.tickListeners.add(listener);
    const cached = this.latestTicks[this.currentSymbol];
    if (cached) {
      listener(cached);
    }
    return () => {
      this.tickListeners.delete(listener);
    };
  }

  public subscribeStatus(listener: StatusListener) {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private setStatus(newStatus: LiveStreamStatus) {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.statusListeners.forEach((fn) => fn(newStatus));
  }

  public getStatus(): LiveStreamStatus {
    return this.status;
  }

  public getLatestTick(sym: SupportedSymbol): LiveMarketTick {
    return this.latestTicks[sym] || buildInitialTicks()[sym];
  }

  public setSymbolAndTimeframe(symbol: SupportedSymbol, timeframe: SupportedTimeframe) {
    const symbolChanged = this.currentSymbol !== symbol;
    this.currentSymbol = symbol;
    this.currentTimeframe = timeframe;
    this.lastObservedMarketOpen = getMarketSessionStatus(symbol).isOpen;

    // Immediately push cached tick so UI never flickers
    const tick = this.latestTicks[symbol];
    if (tick) {
      this.tickListeners.forEach((fn) =>
        fn({
          ...tick,
          marketOpen: this.lastObservedMarketOpen,
        })
      );
    }

    this.fetchInstantTicker(symbol);

    if (symbolChanged) {
      this.connect();
    }
  }

  private startSessionWatcher() {
    if (this.sessionWatchTimer) clearInterval(this.sessionWatchTimer);
    this.sessionWatchTimer = setInterval(() => {
      const sym = this.currentSymbol;
      const isOpen = getMarketSessionStatus(sym).isOpen;
      if (isOpen !== this.lastObservedMarketOpen) {
        this.lastObservedMarketOpen = isOpen;
        const current = this.latestTicks[sym];
        if (current) {
          const updated: LiveMarketTick = {
            ...current,
            marketOpen: isOpen,
            timestamp: Date.now(),
          };
          this.latestTicks[sym] = updated;
          this.tickListeners.forEach((fn) => fn(updated));
        }

        if (isOpen) {
          // Forex / Metals just opened! Automatically resume live feeds without page reload
          this.fetchInstantTicker(sym);
          this.connect();
        }
      }
    }, 1000);
  }

  private async fetchInstantTicker(sym: SupportedSymbol) {
    const session = getMarketSessionStatus(sym);

    // 1. Direct ultra-fast Binance Vision / Coinbase for Crypto (BTC/USD)
    if (sym === 'BTC/USD') {
      try {
        const bRes = await fetch(
          `https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT`
        );
        if (bRes.ok) {
          const pd = await bRes.json();
          const p = parseFloat(pd.lastPrice);
          if (p > 0) {
            this.applyTickUpdate(
              sym,
              p,
              parseFloat(pd.highPrice),
              parseFloat(pd.lowPrice),
              parseFloat(pd.priceChangePercent),
              parseFloat(pd.volume),
              true
            );
            this.setStatus('CONNECTED');
            return;
          }
        }
      } catch (_e) {}

      try {
        const cr = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot');
        if (cr.ok) {
          const cd = await cr.json();
          const p = parseFloat(cd?.data?.amount);
          if (p > 0) {
            this.applyTickUpdate('BTC/USD', p, p * 1.02, p * 0.98, 1.1, 42000, true);
            this.setStatus('CONNECTED');
            return;
          }
        }
      } catch (_e) {}
    }

    // 2. For all Forex pairs, Silver (XAG/USD), and Gold (XAU/USD): query backend Yahoo/Multi-source ticker
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const r = await fetch(`/api/market/ticker?symbol=${encodeURIComponent(sym)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (r.ok) {
        const d = await r.json();
        if (d && d.price > 0) {
          this.applyTickUpdate(
            sym,
            d.price,
            d.high24h,
            d.low24h,
            d.change24hPct,
            d.volume24h,
            d.marketOpen ?? session.isOpen
          );
          this.setStatus('CONNECTED');
          return;
        }
      }
    } catch (_e) {}

    // 3. Direct Gold fallback if backend unreachable
    if (sym === 'XAU/USD') {
      try {
        const gr = await fetch('https://api.gold-api.com/price/XAU');
        if (gr.ok) {
          const gd = await gr.json();
          if (gd && gd.price > 0) {
            this.applyTickUpdate(
              'XAU/USD',
              gd.price,
              gd.price * 1.015,
              gd.price * 0.985,
              0.45,
              18500,
              session.isOpen
            );
            this.setStatus('CONNECTED');
            return;
          }
        }
      } catch (_e) {}
    }
  }

  private startFallbackPolling() {
    if (this.fallbackPollTimer) clearInterval(this.fallbackPollTimer);
    this.fallbackPollTimer = setInterval(async () => {
      const sym = this.currentSymbol;
      if (!getMarketSessionStatus(sym).isOpen) return;

      const now = Date.now();
      if (now - this.lastTickTime > 2000) {
        this.fetchInstantTicker(sym);
      }
    }, 1500);
  }

  public connect() {
    this.cleanupStreams();
    this.setStatus('CONNECTING');

    const sym = this.currentSymbol;
    const isCrypto = sym === 'BTC/USD';
    const isGold = sym === 'XAU/USD';

    // 1. Server-Sent Events (SSE) stream supports all 28 pairs & enforces market open/close freeze/resume
    try {
      if (typeof window !== 'undefined' && 'EventSource' in window) {
        const sse = new EventSource(`/api/market/stream?symbol=${encodeURIComponent(sym)}`);
        this.sse = sse;

        sse.onopen = () => {
          this.setStatus('CONNECTED');
        };

        sse.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.price > 0) {
              this.applyTickUpdate(
                (data.symbol as SupportedSymbol) || sym,
                data.price,
                data.high24h,
                data.low24h,
                data.change24hPct,
                data.volume24h,
                data.marketOpen
              );
              this.setStatus('CONNECTED');
            }
          } catch (_e) {
            // ignore
          }
        };

        sse.onerror = () => {
          // SSE auto-retries and fallback polling keeps quotes fresh
        };
      }
    } catch (_err) {}

    // 2. Direct Binance WebSocket ONLY for 24/7 BTC/USD (or XAU/USD when Forex market is open)
    if (isCrypto || (isGold && getMarketSessionStatus(sym).isOpen)) {
      const binancePair = isGold ? 'paxgusdt' : 'btcusdt';
      try {
        const wsUrl = `wss://stream.binance.com:9443/ws/${binancePair}@ticker`;
        const socket = new WebSocket(wsUrl);
        this.ws = socket;

        socket.onopen = () => {
          this.setStatus('CONNECTED');
        };

        socket.onmessage = (event) => {
          try {
            const raw = JSON.parse(event.data);
            const data = raw.data || raw;
            if (data.e === '24hrTicker' || data.c) {
              const price = parseFloat(data.c) || 0;
              if (price > 0 && getMarketSessionStatus(sym).isOpen) {
                this.applyTickUpdate(
                  sym,
                  price,
                  parseFloat(data.h),
                  parseFloat(data.l),
                  parseFloat(data.P),
                  parseFloat(data.v),
                  true
                );
                this.setStatus('CONNECTED');
              }
            }
          } catch (_e) {}
        };

        socket.onerror = () => {};
        socket.onclose = () => {};
      } catch (_err) {}
    }
  }

  private applyTickUpdate(
    sym: SupportedSymbol,
    price: number,
    high24?: number,
    low24?: number,
    changePct?: number,
    vol24?: number,
    marketOpenOverride?: boolean
  ) {
    if (price <= 0) return;
    this.lastTickTime = Date.now();
    const meta = BRAND_CONFIG.markets[sym] || BRAND_CONFIG.markets['BTC/USD'];
    const dec = meta.decimals;
    const halfSpread = meta.typicalSpread / 2;
    const roundedPrice = Number(price.toFixed(dec));
    const existing = this.latestTicks[sym];
    const isMarketOpen = marketOpenOverride ?? getMarketSessionStatus(sym).isOpen;

    const stepSec = TIMEFRAME_SECONDS[this.currentTimeframe] || 900;
    const nowSec = Math.floor(Date.now() / 1000);
    const candlePeriodTime = Math.floor(nowSec / stepSec) * stepSec;

    let candle: CandleData;
    if (!isMarketOpen && existing?.candle) {
      // Frozen session: preserve exact close candle without creating phantom weekend bars
      candle = {
        ...existing.candle,
        close: roundedPrice,
      };
    } else if (existing?.candle && existing.candle.time === candlePeriodTime) {
      candle = {
        ...existing.candle,
        close: roundedPrice,
        high: Number(Math.max(existing.candle.high, roundedPrice).toFixed(dec)),
        low: Number(Math.min(existing.candle.low, roundedPrice).toFixed(dec)),
        volume: existing.candle.volume + 1,
      };
    } else {
      const prevClose = existing?.candle ? existing.candle.close : roundedPrice;
      candle = {
        time: candlePeriodTime,
        open: prevClose,
        high: Number(Math.max(prevClose, roundedPrice).toFixed(dec)),
        low: Number(Math.min(prevClose, roundedPrice).toFixed(dec)),
        close: roundedPrice,
        volume: 1,
      };
    }

    const tick: LiveMarketTick = {
      symbol: sym,
      price: roundedPrice,
      bid: Number((roundedPrice - halfSpread).toFixed(dec)),
      ask: Number((roundedPrice + halfSpread).toFixed(dec)),
      high24h: Number((high24 || existing?.high24h || roundedPrice * 1.01).toFixed(dec)),
      low24h: Number((low24 || existing?.low24h || roundedPrice * 0.99).toFixed(dec)),
      change24hPct: changePct ?? existing?.change24hPct ?? 0,
      volume24h: vol24 || existing?.volume24h || 1000,
      candle,
      marketOpen: isMarketOpen,
      timestamp: Date.now(),
    };

    this.latestTicks[sym] = tick;
    if (sym === this.currentSymbol) {
      this.tickListeners.forEach((fn) => fn(tick));
    }
  }

  private cleanupStreams() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.sse) {
      try {
        this.sse.close();
      } catch (_e) {}
      this.sse = null;
    }
    if (this.ws) {
      try {
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.onmessage = null;
        this.ws.close();
      } catch (_e) {}
      this.ws = null;
    }
  }

  public disconnect() {
    this.cleanupStreams();
    if (this.fallbackPollTimer) {
      clearInterval(this.fallbackPollTimer);
      this.fallbackPollTimer = null;
    }
    if (this.sessionWatchTimer) {
      clearInterval(this.sessionWatchTimer);
      this.sessionWatchTimer = null;
    }
    this.setStatus('OFFLINE');
  }
}

export const liveMarketStreamer = new LiveMarketStreamerService();
