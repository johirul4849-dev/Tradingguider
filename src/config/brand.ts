export type MarketCategory = 'Forex Major' | 'Forex Cross' | 'Metals' | 'Crypto';

export interface MarketSymbolConfig {
  id: SupportedSymbol;
  name: string;
  shortName: string;
  category: MarketCategory;
  yahooSymbol: string;
  tickSize: number;
  pipSize: number;
  decimals: number;
  defaultPrice: number;
  contractUnit: string;
  contractUnitsMultiplier: number;
  defaultBracketDistance: number;
  typicalSpread: number;
  is24x7: boolean;
}

export type SupportedSymbol =
  | 'EUR/USD'
  | 'GBP/USD'
  | 'USD/JPY'
  | 'AUD/USD'
  | 'USD/CAD'
  | 'USD/CHF'
  | 'NZD/USD'
  | 'EUR/GBP'
  | 'EUR/JPY'
  | 'GBP/JPY'
  | 'AUD/JPY'
  | 'EUR/AUD'
  | 'GBP/AUD'
  | 'EUR/CAD'
  | 'CAD/JPY'
  | 'CHF/JPY'
  | 'NZD/JPY'
  | 'EUR/CHF'
  | 'EUR/NZD'
  | 'GBP/CAD'
  | 'GBP/CHF'
  | 'GBP/NZD'
  | 'AUD/CAD'
  | 'AUD/CHF'
  | 'AUD/NZD'
  | 'XAU/USD'
  | 'XAG/USD'
  | 'BTC/USD';

export const BRAND_CONFIG = {
  name: 'Tradingguider',
  tagline: 'Master Price Action with Institutional Precision',
  shortDescription:
    'Train like an institutional trader through live Forex pairs, Gold, Silver & BTC/USD charts, Exness drag mechanics, and AI trade mentorship.',
  legalDisclaimer:
    'Tradingguider is an educational and simulated trading platform. Market analysis and AI-generated scenarios are for educational purposes only and are not financial advice. Historical simulation results do not guarantee future results. Trading financial markets involves substantial risk.',
  learningLoop: ['LEARN', 'ANALYZE', 'DECIDE', 'SIMULATE', 'REVIEW', 'CORRECT', 'REPEAT'] as const,
  markets: {
    'EUR/USD': {
      id: 'EUR/USD',
      name: 'Euro / US Dollar',
      shortName: 'EUR/USD',
      category: 'Forex Major',
      yahooSymbol: 'EURUSD=X',
      tickSize: 0.00001,
      pipSize: 0.0001,
      decimals: 5,
      defaultPrice: 1.0922,
      contractUnit: 'EUR',
      contractUnitsMultiplier: 10000,
      defaultBracketDistance: 0.0025,
      typicalSpread: 0.00012,
      is24x7: false,
    },
    'GBP/USD': {
      id: 'GBP/USD',
      name: 'British Pound / US Dollar',
      shortName: 'GBP/USD',
      category: 'Forex Major',
      yahooSymbol: 'GBPUSD=X',
      tickSize: 0.00001,
      pipSize: 0.0001,
      decimals: 5,
      defaultPrice: 1.3058,
      contractUnit: 'GBP',
      contractUnitsMultiplier: 10000,
      defaultBracketDistance: 0.0030,
      typicalSpread: 0.00015,
      is24x7: false,
    },
    'USD/JPY': {
      id: 'USD/JPY',
      name: 'US Dollar / Japanese Yen',
      shortName: 'USD/JPY',
      category: 'Forex Major',
      yahooSymbol: 'USDJPY=X',
      tickSize: 0.001,
      pipSize: 0.01,
      decimals: 3,
      defaultPrice: 158.945,
      contractUnit: 'USD',
      contractUnitsMultiplier: 100,
      defaultBracketDistance: 0.35,
      typicalSpread: 0.016,
      is24x7: false,
    },
    'AUD/USD': {
      id: 'AUD/USD',
      name: 'Australian Dollar / US Dollar',
      shortName: 'AUD/USD',
      category: 'Forex Major',
      yahooSymbol: 'AUDUSD=X',
      tickSize: 0.00001,
      pipSize: 0.0001,
      decimals: 5,
      defaultPrice: 0.6601,
      contractUnit: 'AUD',
      contractUnitsMultiplier: 10000,
      defaultBracketDistance: 0.0022,
      typicalSpread: 0.00014,
      is24x7: false,
    },
    'USD/CAD': {
      id: 'USD/CAD',
      name: 'US Dollar / Canadian Dollar',
      shortName: 'USD/CAD',
      category: 'Forex Major',
      yahooSymbol: 'USDCAD=X',
      tickSize: 0.00001,
      pipSize: 0.0001,
      decimals: 5,
      defaultPrice: 1.4363,
      contractUnit: 'USD',
      contractUnitsMultiplier: 10000,
      defaultBracketDistance: 0.0028,
      typicalSpread: 0.00016,
      is24x7: false,
    },
    'USD/CHF': {
      id: 'USD/CHF',
      name: 'US Dollar / Swiss Franc',
      shortName: 'USD/CHF',
      category: 'Forex Major',
      yahooSymbol: 'USDCHF=X',
      tickSize: 0.00001,
      pipSize: 0.0001,
      decimals: 5,
      defaultPrice: 0.8405,
      contractUnit: 'USD',
      contractUnitsMultiplier: 10000,
      defaultBracketDistance: 0.0024,
      typicalSpread: 0.00015,
      is24x7: false,
    },
    'NZD/USD': {
      id: 'NZD/USD',
      name: 'New Zealand Dollar / US Dollar',
      shortName: 'NZD/USD',
      category: 'Forex Major',
      yahooSymbol: 'NZDUSD=X',
      tickSize: 0.00001,
      pipSize: 0.0001,
      decimals: 5,
      defaultPrice: 0.5441,
      contractUnit: 'NZD',
      contractUnitsMultiplier: 10000,
      defaultBracketDistance: 0.0022,
      typicalSpread: 0.00018,
      is24x7: false,
    },
    'EUR/GBP': {
      id: 'EUR/GBP',
      name: 'Euro / British Pound',
      shortName: 'EUR/GBP',
      category: 'Forex Cross',
      yahooSymbol: 'EURGBP=X',
      tickSize: 0.00001,
      pipSize: 0.0001,
      decimals: 5,
      defaultPrice: 0.8363,
      contractUnit: 'EUR',
      contractUnitsMultiplier: 10000,
      defaultBracketDistance: 0.0020,
      typicalSpread: 0.00014,
      is24x7: false,
    },
    'EUR/JPY': {
      id: 'EUR/JPY',
      name: 'Euro / Japanese Yen',
      shortName: 'EUR/JPY',
      category: 'Forex Cross',
      yahooSymbol: 'EURJPY=X',
      tickSize: 0.001,
      pipSize: 0.01,
      decimals: 3,
      defaultPrice: 173.554,
      contractUnit: 'EUR',
      contractUnitsMultiplier: 100,
      defaultBracketDistance: 0.42,
      typicalSpread: 0.020,
      is24x7: false,
    },
    'GBP/JPY': {
      id: 'GBP/JPY',
      name: 'British Pound / Japanese Yen',
      shortName: 'GBP/JPY',
      category: 'Forex Cross',
      yahooSymbol: 'GBPJPY=X',
      tickSize: 0.001,
      pipSize: 0.01,
      decimals: 3,
      defaultPrice: 207.531,
      contractUnit: 'GBP',
      contractUnitsMultiplier: 100,
      defaultBracketDistance: 0.50,
      typicalSpread: 0.025,
      is24x7: false,
    },
    'AUD/JPY': {
      id: 'AUD/JPY',
      name: 'Australian Dollar / Japanese Yen',
      shortName: 'AUD/JPY',
      category: 'Forex Cross',
      yahooSymbol: 'AUDJPY=X',
      tickSize: 0.001,
      pipSize: 0.01,
      decimals: 3,
      defaultPrice: 104.948,
      contractUnit: 'AUD',
      contractUnitsMultiplier: 100,
      defaultBracketDistance: 0.35,
      typicalSpread: 0.020,
      is24x7: false,
    },
    'EUR/AUD': {
      id: 'EUR/AUD',
      name: 'Euro / Australian Dollar',
      shortName: 'EUR/AUD',
      category: 'Forex Cross',
      yahooSymbol: 'EURAUD=X',
      tickSize: 0.00001,
      pipSize: 0.0001,
      decimals: 5,
      defaultPrice: 1.6537,
      contractUnit: 'EUR',
      contractUnitsMultiplier: 10000,
      defaultBracketDistance: 0.0038,
      typicalSpread: 0.00022,
      is24x7: false,
    },
    'GBP/AUD': {
      id: 'GBP/AUD',
      name: 'British Pound / Australian Dollar',
      shortName: 'GBP/AUD',
      category: 'Forex Cross',
      yahooSymbol: 'GBPAUD=X',
      tickSize: 0.00001,
      pipSize: 0.0001,
      decimals: 5,
      defaultPrice: 1.9775,
      contractUnit: 'GBP',
      contractUnitsMultiplier: 10000,
      defaultBracketDistance: 0.0045,
      typicalSpread: 0.00026,
      is24x7: false,
    },
    'EUR/CAD': {
      id: 'EUR/CAD',
      name: 'Euro / Canadian Dollar',
      shortName: 'EUR/CAD',
      category: 'Forex Cross',
      yahooSymbol: 'EURCAD=X',
      tickSize: 0.00001,
      pipSize: 0.0001,
      decimals: 5,
      defaultPrice: 1.5683,
      contractUnit: 'EUR',
      contractUnitsMultiplier: 10000,
      defaultBracketDistance: 0.0034,
      typicalSpread: 0.00022,
      is24x7: false,
    },
    'CAD/JPY': {
      id: 'CAD/JPY',
      name: 'Canadian Dollar / Japanese Yen',
      shortName: 'CAD/JPY',
      category: 'Forex Cross',
      yahooSymbol: 'CADJPY=X',
      tickSize: 0.001,
      pipSize: 0.01,
      decimals: 3,
      defaultPrice: 110.665,
      contractUnit: 'CAD',
      contractUnitsMultiplier: 100,
      defaultBracketDistance: 0.35,
      typicalSpread: 0.022,
      is24x7: false,
    },
    'CHF/JPY': {
      id: 'CHF/JPY',
      name: 'Swiss Franc / Japanese Yen',
      shortName: 'CHF/JPY',
      category: 'Forex Cross',
      yahooSymbol: 'CHFJPY=X',
      tickSize: 0.001,
      pipSize: 0.01,
      decimals: 3,
      defaultPrice: 189.131,
      contractUnit: 'CHF',
      contractUnitsMultiplier: 100,
      defaultBracketDistance: 0.42,
      typicalSpread: 0.024,
      is24x7: false,
    },
    'NZD/JPY': {
      id: 'NZD/JPY',
      name: 'New Zealand Dollar / Japanese Yen',
      shortName: 'NZD/JPY',
      category: 'Forex Cross',
      yahooSymbol: 'NZDJPY=X',
      tickSize: 0.001,
      pipSize: 0.01,
      decimals: 3,
      defaultPrice: 86.488,
      contractUnit: 'NZD',
      contractUnitsMultiplier: 100,
      defaultBracketDistance: 0.30,
      typicalSpread: 0.022,
      is24x7: false,
    },
    'EUR/CHF': {
      id: 'EUR/CHF',
      name: 'Euro / Swiss Franc',
      shortName: 'EUR/CHF',
      category: 'Forex Cross',
      yahooSymbol: 'EURCHF=X',
      tickSize: 0.00001,
      pipSize: 0.0001,
      decimals: 5,
      defaultPrice: 0.9177,
      contractUnit: 'EUR',
      contractUnitsMultiplier: 10000,
      defaultBracketDistance: 0.0020,
      typicalSpread: 0.00016,
      is24x7: false,
    },
    'EUR/NZD': {
      id: 'EUR/NZD',
      name: 'Euro / New Zealand Dollar',
      shortName: 'EUR/NZD',
      category: 'Forex Cross',
      yahooSymbol: 'EURNZD=X',
      tickSize: 0.00001,
      pipSize: 0.0001,
      decimals: 5,
      defaultPrice: 2.0066,
      contractUnit: 'EUR',
      contractUnitsMultiplier: 10000,
      defaultBracketDistance: 0.0042,
      typicalSpread: 0.00028,
      is24x7: false,
    },
    'GBP/CAD': {
      id: 'GBP/CAD',
      name: 'British Pound / Canadian Dollar',
      shortName: 'GBP/CAD',
      category: 'Forex Cross',
      yahooSymbol: 'GBPCAD=X',
      tickSize: 0.00001,
      pipSize: 0.0001,
      decimals: 5,
      defaultPrice: 1.8754,
      contractUnit: 'GBP',
      contractUnitsMultiplier: 10000,
      defaultBracketDistance: 0.0040,
      typicalSpread: 0.00024,
      is24x7: false,
    },
    'GBP/CHF': {
      id: 'GBP/CHF',
      name: 'British Pound / Swiss Franc',
      shortName: 'GBP/CHF',
      category: 'Forex Cross',
      yahooSymbol: 'GBPCHF=X',
      tickSize: 0.00001,
      pipSize: 0.0001,
      decimals: 5,
      defaultPrice: 1.0974,
      contractUnit: 'GBP',
      contractUnitsMultiplier: 10000,
      defaultBracketDistance: 0.0032,
      typicalSpread: 0.00022,
      is24x7: false,
    },
    'GBP/NZD': {
      id: 'GBP/NZD',
      name: 'British Pound / New Zealand Dollar',
      shortName: 'GBP/NZD',
      category: 'Forex Cross',
      yahooSymbol: 'GBPNZD=X',
      tickSize: 0.00001,
      pipSize: 0.0001,
      decimals: 5,
      defaultPrice: 2.3996,
      contractUnit: 'GBP',
      contractUnitsMultiplier: 10000,
      defaultBracketDistance: 0.0050,
      typicalSpread: 0.00032,
      is24x7: false,
    },
    'AUD/CAD': {
      id: 'AUD/CAD',
      name: 'Australian Dollar / Canadian Dollar',
      shortName: 'AUD/CAD',
      category: 'Forex Cross',
      yahooSymbol: 'AUDCAD=X',
      tickSize: 0.00001,
      pipSize: 0.0001,
      decimals: 5,
      defaultPrice: 0.9484,
      contractUnit: 'AUD',
      contractUnitsMultiplier: 10000,
      defaultBracketDistance: 0.0024,
      typicalSpread: 0.00020,
      is24x7: false,
    },
    'AUD/CHF': {
      id: 'AUD/CHF',
      name: 'Australian Dollar / Swiss Franc',
      shortName: 'AUD/CHF',
      category: 'Forex Cross',
      yahooSymbol: 'AUDCHF=X',
      tickSize: 0.00001,
      pipSize: 0.0001,
      decimals: 5,
      defaultPrice: 0.5549,
      contractUnit: 'AUD',
      contractUnitsMultiplier: 10000,
      defaultBracketDistance: 0.0020,
      typicalSpread: 0.00020,
      is24x7: false,
    },
    'AUD/NZD': {
      id: 'AUD/NZD',
      name: 'Australian Dollar / New Zealand Dollar',
      shortName: 'AUD/NZD',
      category: 'Forex Cross',
      yahooSymbol: 'AUDNZD=X',
      tickSize: 0.00001,
      pipSize: 0.0001,
      decimals: 5,
      defaultPrice: 1.2134,
      contractUnit: 'AUD',
      contractUnitsMultiplier: 10000,
      defaultBracketDistance: 0.0022,
      typicalSpread: 0.00020,
      is24x7: false,
    },
    'XAU/USD': {
      id: 'XAU/USD',
      name: 'Spot Gold / US Dollar (COMEX)',
      shortName: 'Gold',
      category: 'Metals',
      yahooSymbol: 'GC=F',
      tickSize: 0.01,
      pipSize: 0.1,
      decimals: 2,
      defaultPrice: 3619.9,
      contractUnit: 'oz',
      contractUnitsMultiplier: 10,
      defaultBracketDistance: 6.0,
      typicalSpread: 0.28,
      is24x7: false,
    },
    'XAG/USD': {
      id: 'XAG/USD',
      name: 'Spot Silver / US Dollar (COMEX)',
      shortName: 'Silver',
      category: 'Metals',
      yahooSymbol: 'SI=F',
      tickSize: 0.001,
      pipSize: 0.01,
      decimals: 3,
      defaultPrice: 42.075,
      contractUnit: 'oz',
      contractUnitsMultiplier: 100,
      defaultBracketDistance: 0.25,
      typicalSpread: 0.025,
      is24x7: false,
    },
    'BTC/USD': {
      id: 'BTC/USD',
      name: 'Bitcoin / US Dollar',
      shortName: 'Bitcoin',
      category: 'Crypto',
      yahooSymbol: 'BTC-USD',
      tickSize: 0.01,
      pipSize: 1.0,
      decimals: 2,
      defaultPrice: 86050.0,
      contractUnit: 'BTC',
      contractUnitsMultiplier: 1,
      defaultBracketDistance: 360.0,
      typicalSpread: 8.0,
      is24x7: true,
    },
  } satisfies Record<SupportedSymbol, MarketSymbolConfig>,
  timeframes: ['1m', '5m', '15m', '30m', '1H', '4H', '1D'] as const,
  defaultVirtualBalance: 25000,
  defaultRiskPercent: 1.0,
};

export type SupportedTimeframe = (typeof BRAND_CONFIG.timeframes)[number];

export const ALL_SUPPORTED_SYMBOLS = Object.keys(BRAND_CONFIG.markets) as SupportedSymbol[];

export const MARKET_CATEGORIES: MarketCategory[] = ['Forex Major', 'Forex Cross', 'Metals', 'Crypto'];

export interface MarketSessionStatus {
  isOpen: boolean;
  statusLabel: string;
  nextTransitionAt: number | null;
  countdownText: string;
}

/**
 * Computes whether a given market symbol is currently OPEN or CLOSED.
 * - Crypto (BTC/USD) runs 24/7.
 * - Interbank Forex & Spot Metals (EUR/USD, GBP/USD, XAU/USD, etc.) run Sunday 22:00 UTC to Friday 22:00 UTC.
 *   When closed (Fri 22:00 UTC -> Sun 22:00 UTC), pairs freeze at their last close and automatically resume at Sun 22:00 UTC.
 */
export function getMarketSessionStatus(
  symbol: SupportedSymbol,
  nowMs: number = Date.now()
): MarketSessionStatus {
  const meta = BRAND_CONFIG.markets[symbol];
  if (!meta || meta.is24x7) {
    return {
      isOpen: true,
      statusLabel: '24/7 LIVE',
      nextTransitionAt: null,
      countdownText: '24/7 Open',
    };
  }

  const d = new Date(nowMs);
  const utcDay = d.getUTCDay(); // 0=Sun, 1=Mon ... 5=Fri, 6=Sat
  const utcMinutesOfDay = d.getUTCHours() * 60 + d.getUTCMinutes();
  const marketHourCloseUtc = 22 * 60; // 22:00 UTC

  const isClosed =
    (utcDay === 5 && utcMinutesOfDay >= marketHourCloseUtc) ||
    utcDay === 6 ||
    (utcDay === 0 && utcMinutesOfDay < marketHourCloseUtc);

  if (isClosed) {
    // Compute upcoming Sunday 22:00 UTC
    const daysUntilSunday = utcDay === 0 ? 0 : 7 - utcDay;
    const openDate = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + daysUntilSunday, 22, 0, 0, 0)
    );
    const nextOpenMs = openDate.getTime();
    const diffSec = Math.max(0, Math.floor((nextOpenMs - nowMs) / 1000));
    const hrs = Math.floor(diffSec / 3600);
    const mins = Math.floor((diffSec % 3600) / 60);
    const secs = diffSec % 60;

    return {
      isOpen: false,
      statusLabel: 'MARKET CLOSED',
      nextTransitionAt: nextOpenMs,
      countdownText: `Opens in ${hrs}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`,
    };
  }

  // Market is currently open -> compute next Friday 22:00 UTC close
  const daysUntilFriday = utcDay <= 5 ? 5 - utcDay : 6;
  const closeDate = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + daysUntilFriday, 22, 0, 0, 0)
  );
  const nextCloseMs = closeDate.getTime();

  return {
    isOpen: true,
    statusLabel: 'FOREX LIVE',
    nextTransitionAt: nextCloseMs,
    countdownText: 'Market Open',
  };
}
