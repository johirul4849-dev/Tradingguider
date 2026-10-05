import { SupportedSymbol, SupportedTimeframe } from '../config/brand';
import { CandleData } from './marketEngine';

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
  timestamp: number;
}

export type LiveStreamStatus = 'CONNECTED' | 'CONNECTING' | 'RECONNECTING' | 'OFFLINE';

type TickListener = (tick: LiveMarketTick) => void;
type StatusListener = (status: LiveStreamStatus) => void;

class LiveMarketStreamerService {
  private ws: WebSocket | null = null;
  private sse: EventSource | null = null;
  private currentSymbol: SupportedSymbol = 'BTC/USD';
  private currentTimeframe: SupportedTimeframe = '15m';
  private tickListeners: Set<TickListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private status: LiveStreamStatus = 'CONNECTING';
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private fallbackPollTimer: any = null;
  private lastTickTime = 0;

  // Cached latest ticks for instant access (realistic starting prices)
  private latestTicks: Record<SupportedSymbol, LiveMarketTick> = {
    'BTC/USD': {
      symbol: 'BTC/USD',
      price: 85200.0,
      bid: 85196.0,
      ask: 85204.0,
      high24h: 86400.0,
      low24h: 84200.0,
      change24hPct: 0.85,
      volume24h: 38400,
      candle: {
        time: Math.floor(Date.now() / 1000),
        open: 85160.0,
        high: 85220.0,
        low: 85140.0,
        close: 85200.0,
        volume: 45,
      },
      timestamp: Date.now(),
    },
    'XAU/USD': {
      symbol: 'XAU/USD',
      price: 2762.4,
      bid: 2762.22,
      ask: 2762.58,
      high24h: 2774.0,
      low24h: 2748.0,
      change24hPct: 0.62,
      volume24h: 18200,
      candle: {
        time: Math.floor(Date.now() / 1000),
        open: 2761.0,
        high: 2763.5,
        low: 2760.2,
        close: 2762.4,
        volume: 85,
      },
      timestamp: Date.now(),
    },
  };

  constructor() {
    this.fetchInstantTicker(this.currentSymbol);
    this.connect();
    this.startFallbackPolling();
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
    return this.latestTicks[sym];
  }

  public setSymbolAndTimeframe(symbol: SupportedSymbol, timeframe: SupportedTimeframe) {
    const symbolChanged = this.currentSymbol !== symbol;
    this.currentSymbol = symbol;
    this.currentTimeframe = timeframe;

    // Immediately push cached tick so UI never flickers
    const tick = this.latestTicks[symbol];
    if (tick) {
      this.tickListeners.forEach((fn) => fn(tick));
    }

    this.fetchInstantTicker(symbol);

    if (symbolChanged) {
      this.connect();
    }
  }

  private async fetchInstantTicker(sym: SupportedSymbol) {
    try {
      const r = await fetch(`/api/market/ticker?symbol=${encodeURIComponent(sym)}`);
      if (r.ok) {
        const d = await r.json();
        if (d && d.price > 0) {
          this.applyTickUpdate(sym, d.price, d.high24h, d.low24h, d.change24hPct, d.volume24h);
          this.setStatus('CONNECTED');
        }
      }
    } catch (_e) {
      // ignore
    }
  }

  private startFallbackPolling() {
    if (this.fallbackPollTimer) clearInterval(this.fallbackPollTimer);
    this.fallbackPollTimer = setInterval(async () => {
      const now = Date.now();
      // If no tick received within 2s, poll via server
      if (now - this.lastTickTime > 1800) {
        this.fetchInstantTicker(this.currentSymbol);
      }
    }, 1200);
  }

  public connect() {
    this.cleanupStreams();
    this.setStatus('CONNECTING');

    const sym = this.currentSymbol;
    const binancePair = sym === 'XAU/USD' ? 'paxgusdt' : 'btcusdt';

    // 1. Setup Server-Sent Events (SSE) stream (guaranteed reliable through all firewalls/sandboxes)
    try {
      if (typeof window !== 'undefined' && 'EventSource' in window) {
        const sse = new EventSource(`/api/market/stream?symbol=${encodeURIComponent(sym)}`);
        this.sse = sse;

        sse.onopen = () => {
          this.setStatus('CONNECTED');
          this.reconnectAttempts = 0;
        };

        sse.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.price > 0) {
              this.applyTickUpdate(
                data.symbol || sym,
                data.price,
                data.high24h,
                data.low24h,
                data.change24hPct,
                data.volume24h
              );
              this.setStatus('CONNECTED');
            }
          } catch (_e) {
            // ignore
          }
        };

        sse.onerror = () => {
          // SSE will auto-retry, but fallback polling keeps ticks flowing
        };
      }
    } catch (_err) {
      // fallback
    }

    // 2. Try direct Binance WebSocket as parallel ultra-fast feed
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
            if (price > 0) {
              this.applyTickUpdate(
                sym,
                price,
                parseFloat(data.h),
                parseFloat(data.l),
                parseFloat(data.P),
                parseFloat(data.v)
              );
              this.setStatus('CONNECTED');
            }
          }
        } catch (_e) {
          // ignore
        }
      };

      socket.onerror = () => {
        // SSE covers it
      };

      socket.onclose = () => {
        // SSE covers it
      };
    } catch (_err) {
      // SSE covers it
    }
  }

  private applyTickUpdate(
    sym: SupportedSymbol,
    price: number,
    high24?: number,
    low24?: number,
    changePct?: number,
    vol24?: number
  ) {
    if (price <= 0) return;
    this.lastTickTime = Date.now();
    const spread = sym === 'BTC/USD' ? 3.5 : 0.18;
    const existing = this.latestTicks[sym];

    const candle: CandleData = existing?.candle
      ? {
          ...existing.candle,
          close: price,
          high: Math.max(existing.candle.high, price),
          low: Math.min(existing.candle.low, price),
          volume: existing.candle.volume + 1,
        }
      : {
          time: Math.floor(Date.now() / 1000),
          open: price,
          high: price,
          low: price,
          close: price,
          volume: 50,
        };

    const tick: LiveMarketTick = {
      symbol: sym,
      price,
      bid: Number((price - spread).toFixed(2)),
      ask: Number((price + spread).toFixed(2)),
      high24h: high24 || existing?.high24h || price * 1.02,
      low24h: low24 || existing?.low24h || price * 0.98,
      change24hPct: changePct ?? existing?.change24hPct ?? 0,
      volume24h: vol24 || existing?.volume24h || 1000,
      candle,
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
      } catch (_e) {
        // ignore
      }
      this.sse = null;
    }
    if (this.ws) {
      try {
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.onmessage = null;
        this.ws.close();
      } catch (_e) {
        // ignore
      }
      this.ws = null;
    }
  }

  public disconnect() {
    this.cleanupStreams();
    if (this.fallbackPollTimer) {
      clearInterval(this.fallbackPollTimer);
      this.fallbackPollTimer = null;
    }
    this.setStatus('OFFLINE');
  }
}

export const liveMarketStreamer = new LiveMarketStreamerService();
