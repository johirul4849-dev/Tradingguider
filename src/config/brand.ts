export interface MarketSymbolConfig {
  id: 'BTC/USD' | 'XAU/USD';
  name: string;
  shortName: string;
  category: 'Crypto' | 'Commodities';
  tickSize: number;
  decimals: number;
  defaultPrice: number;
  contractUnit: string;
  typicalSpread: number;
}

export const BRAND_CONFIG = {
  name: 'TradePilot AI',
  tagline: 'Practice the Market. Master the Process.',
  shortDescription:
    'Train like a professional trader through realistic historical chart replay, disciplined risk management, and structured AI trade coaching.',
  legalDisclaimer:
    'TradePilot AI is an educational and simulated trading platform. Market analysis and AI-generated scenarios are for educational purposes only and are not guaranteed predictions or personalized financial advice. Historical simulation results do not guarantee future results. Trading financial markets involves substantial risk.',
  learningLoop: ['LEARN', 'ANALYZE', 'DECIDE', 'SIMULATE', 'REVIEW', 'CORRECT', 'REPEAT'] as const,
  markets: {
    'BTC/USD': {
      id: 'BTC/USD',
      name: 'Bitcoin / US Dollar',
      shortName: 'Bitcoin',
      category: 'Crypto',
      tickSize: 1,
      decimals: 2,
      defaultPrice: 86050.0,
      contractUnit: 'BTC',
      typicalSpread: 8.0,
    },
    'XAU/USD': {
      id: 'XAU/USD',
      name: 'Spot Gold / US Dollar (COMEX)',
      shortName: 'Gold',
      category: 'Commodities',
      tickSize: 0.1,
      decimals: 2,
      defaultPrice: 4178.4,
      contractUnit: 'oz',
      typicalSpread: 0.28,
    },
  } satisfies Record<'BTC/USD' | 'XAU/USD', MarketSymbolConfig>,
  timeframes: ['1m', '5m', '15m', '30m', '1H', '4H', '1D'] as const,
  defaultVirtualBalance: 25000,
  defaultRiskPercent: 1.0,
};

export type SupportedSymbol = keyof typeof BRAND_CONFIG.markets;
export type SupportedTimeframe = (typeof BRAND_CONFIG.timeframes)[number];
