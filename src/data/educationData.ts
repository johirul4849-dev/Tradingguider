export interface PublicArticle {
  id: string;
  title: string;
  category: 'Risk Management' | 'Technical Structure' | 'Trading Psychology' | 'Platform Process';
  readTime: string;
  summary: string;
  keyTakeaway: string;
  content: string[];
}

export const PUBLIC_ARTICLES: PublicArticle[] = [
  {
    id: 'what-is-risk-reward',
    title: 'What is Risk/Reward?',
    category: 'Risk Management',
    readTime: '3 min read',
    summary: 'Why asymmetric payoff ratios allow disciplined traders to remain profitable even with a 45% win rate.',
    keyTakeaway: 'Never evaluate a target without first measuring the structural invalidation distance.',
    content: [
      'Risk/Reward (R:R) measures how much virtual capital you stand to lose if your trade thesis is invalidated compared to what you aim to gain if price reaches your structural target.',
      'For example, risking $250 (1R) to target $500 (+2R) represents a 1:2 Risk/Reward ratio. At a 1:2 ratio, winning just 4 out of 10 trades yields +8R on winners and -6R on losers — a net +2R gain before fees.',
      'Professional traders never stretch a Take Profit arbitrarily just to manufacture a 1:3 number. Both the Stop Loss and Take Profit must sit at objective market structure levels.',
    ],
  },
  {
    id: 'what-is-stop-loss',
    title: 'What is Stop Loss?',
    category: 'Risk Management',
    readTime: '4 min read',
    summary: 'A Stop Loss is not a punishment — it is the exact price level that proves your market thesis wrong.',
    keyTakeaway: 'Place your Stop Loss where your setup is invalidated, then size your position to match your risk percentage.',
    content: [
      'Every trade begins with a hypothesis: "If buyers are defending this support zone, price should hold above the swing low." The Stop Loss belongs immediately beyond that invalidation point.',
      'Beginner traders often place tight, arbitrary Stop Losses so they can put on a larger position size, only to get stopped out by normal candle noise before price moves in their intended direction.',
      'In TradePilot AI, you select your Stop Loss on the chart first, and the Risk Engine automatically calculates the exact position size to cap your loss at 0.25%, 0.5%, or 1.0%.',
    ],
  },
  {
    id: 'how-chart-replay-works',
    title: 'How Does Chart Replay Work?',
    category: 'Platform Process',
    readTime: '3 min read',
    summary: 'Train your pattern recognition and decision speed across months of historical price action without hindsight bias.',
    keyTakeaway: 'Future candles remain strictly hidden until you commit to a decision or step forward.',
    content: [
      'Looking at a completed static chart creates an illusion of simplicity because your brain already sees the right side of the screen. In live markets, the right edge is blank.',
      'Historical Chart Replay hides all candles after your selected historical start timestamp. You step forward candle-by-candle, draw levels, monitor indicators, and execute virtual trades as if it were unfolding live.',
      'Crucially, TradePilot AI also restricts the AI Coach during replay to only the candles currently visible on your screen, preventing any future data leakage.',
    ],
  },
  {
    id: 'what-is-market-structure',
    title: 'What is Market Structure?',
    category: 'Technical Structure',
    readTime: '5 min read',
    summary: 'Reading swing highs, swing lows, trend continuation, and structural breaks on BTC/USD and XAU/USD.',
    keyTakeaway: 'Trade in alignment with the dominant swing structure until a confirmed Break of Structure occurs.',
    content: [
      'Market structure is the footprint of institutional supply and demand expressed through price swings. An uptrend prints Higher Highs (HH) and Higher Lows (HL); a downtrend prints Lower Highs (LH) and Lower Lows (LL).',
      'When an uptrend fails to make a new high and closes decisively below the most recent Higher Low, a structural shift occurs. Disciplined traders wait for price to retest the broken level rather than chasing the initial breakdown candle.',
    ],
  },
  {
    id: 'support-and-resistance',
    title: 'What is Support and Resistance?',
    category: 'Technical Structure',
    readTime: '4 min read',
    summary: 'Why horizontal price zones act as liquidity magnets and decision points rather than exact single-dollar lines.',
    keyTakeaway: 'Treat support and resistance as zones of confluence, not razor-thin lines.',
    content: [
      'Support is a price zone where buying interest historically overwhelmed selling pressure; Resistance is an overhead zone where supply previously capped advances.',
      'Instead of placing blind limit orders at a line, observe how candles behave when entering the zone: long rejection wicks, declining momentum into the level, and a strong confirmation close back inside the range signal higher-probability defence.',
    ],
  },
  {
    id: 'what-is-position-sizing',
    title: 'What is Position Sizing?',
    category: 'Risk Management',
    readTime: '4 min read',
    summary: 'The mathematical formula that keeps your dollar risk identical whether your Stop Loss is 10 points or 500 points wide.',
    keyTakeaway: 'Position Size = (Account Balance × Risk %) ÷ |Entry Price − Stop Loss Price|.',
    content: [
      'Many traders confuse position size with risk. Buying 1 BTC with a $400 Stop Loss risks $400; buying 0.2 BTC with a $2,000 Stop Loss also risks $400.',
      'Consistent position sizing ensures that no single volatile trade can damage your account or your emotional composure.',
    ],
  },
  {
    id: 'what-is-overtrading',
    title: 'What is Overtrading?',
    category: 'Trading Psychology',
    readTime: '3 min read',
    summary: 'How taking low-quality setups out of boredom erodes both virtual capital and decision sharpness.',
    keyTakeaway: 'Set a hard daily trade cap (e.g., 3 trades per session) and enforce it with the Trading Pause System.',
    content: [
      'Overtrading happens when a trader feels compelled to be in a position every 10 minutes regardless of whether a valid structural setup exists.',
      'Decision fatigue sets in rapidly after 3 to 4 intense trades. TradePilot AI tracks your session trade count and time between trades to surface overtrading habits early.',
    ],
  },
  {
    id: 'what-is-revenge-trading',
    title: 'What is Revenge Trading?',
    category: 'Trading Psychology',
    readTime: '4 min read',
    summary: 'Recognizing the impulse to immediately win back a loss by doubling risk or entering without a setup.',
    keyTakeaway: 'A mandatory 15-minute cooldown after a Stop Loss breaks the emotional revenge loop.',
    content: [
      'Revenge trading is the #1 account destroyer. After taking a normal, planned Stop Loss, the trader feels frustrated and immediately enters another trade within seconds — often increasing risk from 1% to 2% or 4%.',
      'TradePilot AI monitors post-loss timing and risk changes automatically, flagging revenge sequences so you can build the habit of stepping back.',
    ],
  },
  {
    id: 'why-traders-lose-money',
    title: 'Why Traders Lose Money',
    category: 'Trading Psychology',
    readTime: '5 min read',
    summary: 'It is rarely a lack of indicators — it is inconsistent sizing, moving Stop Losses, and trading without a repeatable process.',
    keyTakeaway: 'Mastery comes from reviewing your execution mistakes objectively after every session.',
    content: [
      'Most struggling traders jump from indicator to indicator looking for a magic signal. In reality, even a solid strategy fails if the trader widens Stop Losses during drawdowns or cuts winning trades at +0.4R out of fear.',
      'By logging every SL/TP modification in your Trading Journal and reviewing it with AI, you turn invisible behavioural leaks into measurable improvements.',
    ],
  },
  {
    id: 'why-waiting-is-part-of-trading',
    title: 'Why Waiting is Part of Trading',
    category: 'Trading Psychology',
    readTime: '3 min read',
    summary: 'Choosing "NO TRADE" when structure is choppy is an active, high-skill professional decision.',
    keyTakeaway: 'Cash is a defensive position while waiting for price to reach your pre-mapped confluence zone.',
    content: [
      'Professional traders spend 80% of their screen time mapping levels and waiting for price to arrive, and only 20% executing and managing positions.',
      'In our AI Trader Demo mode, you will regularly see the AI evaluate a choppy chart and explicitly conclude "NO TRADE — Insufficient Confirmation / Poor R:R."',
    ],
  },
];

export interface CourseModule {
  id: string;
  category: 'Beginner' | 'Technical Analysis' | 'Trade Planning' | 'Advanced' | 'Psychology & Discipline';
  title: string;
  duration: string;
  learnText: string;
  exampleText: string;
  chartExercise: string;
  quizQuestion: string;
  quizOptions: string[];
  correctQuizIndex: number;
  replayChallengePrompt: string;
}

export const COURSE_MODULES: CourseModule[] = [
  {
    id: 'beg-market-structure',
    category: 'Beginner',
    title: 'Candlestick Basics, Trends & Market Structure',
    duration: '12 min',
    learnText:
      'Every candlestick records four data points: Open, High, Low, and Close. Long wicks at swing highs or lows show rejection of prices, while strong full-bodied closes beyond a prior swing high or low confirm structural displacement.',
    exampleText:
      'On BTC/USD 15m, price sweeps below $83,200 support by $90 but closes the 15m candle back at $83,420 with a long lower wick. That shows buyers absorbed the sell orders at support.',
    chartExercise:
      'Open the Trading Terminal on BTC/USD 15m and use the Horizontal Line tool to mark the two most recent major swing highs and swing lows.',
    quizQuestion: 'What confirms a valid bullish Break of Structure (BOS) in an uptrend?',
    quizOptions: [
      'A brief 1-second wick above the prior swing high followed by a bearish close',
      'A decisive candle body close above the prior swing high with follow-through support',
      'Any green candle that forms in the middle of a range',
    ],
    correctQuizIndex: 1,
    replayChallengePrompt:
      'Launch Replay on "BTC London Open Liquidity Sweep & Retest" and wait for a full 15m confirmation candle close before entering.',
  },
  {
    id: 'ta-ema-rsi-atr',
    category: 'Technical Analysis',
    title: 'Combining EMA Structure, RSI Momentum & ATR Volatility',
    duration: '15 min',
    learnText:
      'Indicators should never be used as blind buy/sell triggers. Instead, use EMA 20 & EMA 50 to gauge dynamic trend slope, RSI (14) to spot momentum divergence at key structure, and ATR (14) to ensure your Stop Loss sits outside normal candle noise.',
    exampleText:
      'If XAU/USD 15m has an ATR of $4.20, placing a $1.20 Stop Loss places your invalidation inside routine 15-minute noise. Using at least 1.2x–1.5x ATR beyond structure protects against premature stop-outs.',
    chartExercise:
      'Enable EMA 20, EMA 50, RSI 14, and ATR 14 in the Indicators modal and compare the ATR value on BTC/USD vs XAU/USD.',
    quizQuestion: 'What is the primary educational role of ATR (Average True Range) in trade planning?',
    quizOptions: [
      'Predicting the exact dollar price of tomorrow’s close',
      'Measuring current candle volatility so Stop Losses are not placed inside normal noise',
      'Replacing the need for a Stop Loss altogether',
    ],
    correctQuizIndex: 1,
  replayChallengePrompt:
      'Complete 1 simulated trade on XAU/USD where your Stop Loss distance is at least 1.2x the current ATR reading.',
  },
  {
    id: 'plan-risk-sizing',
    category: 'Trade Planning',
    title: 'Entry, Stop Loss, Take Profit & Position Sizing Math',
    duration: '14 min',
    learnText:
      'Professional trade planning follows a fixed sequence: (1) Identify structural setup, (2) Set invalidation Stop Loss, (3) Verify Take Profit offers at least 1:1.8 to 1:2.5 R:R before the next opposing barrier, (4) Size the position to cap risk at 0.5%–1.0%.',
    exampleText:
      'With a $25,000 virtual balance and 1.0% risk ($250), an entry on Gold at $2,940 with Stop Loss at $2,935 ($5 distance) requires a position size of exactly 50 oz.',
    chartExercise:
      'Use the Simulated Trade Panel to test 0.5% vs 1.0% risk while moving the Stop Loss price and observe how position size automatically recalibrates.',
    quizQuestion: 'If you widen your Stop Loss distance from $200 to $400 on BTC while keeping account risk fixed at 1%, what must happen to your position size?',
    quizOptions: [
      'Position size doubles',
      'Position size is cut in half so dollar risk remains identical',
      'Position size stays the same',
    ],
    correctQuizIndex: 1,
    replayChallengePrompt:
      'Execute 2 replay trades with risk strictly at or below 1.0% and a minimum 1:2.0 Risk/Reward ratio.',
  },
  {
    id: 'adv-breakout-retest',
    category: 'Advanced',
    title: 'Breakout vs. Retest Execution & Liquidity Sweeps',
    duration: '18 min',
    learnText:
      'First-touch breakouts often trap impatient traders when liquidity above resistance is swept and price snaps back into the range. Waiting for either a post-breakout retest of the broken level or a liquidity sweep reclaim offers clearer invalidation.',
    exampleText:
      'Price breaks above $84,500 resistance, pulls back to test $84,500 from above, and prints a bullish rejection candle. Invalidation is now tightly defined just below $84,380.',
    chartExercise:
      'Use the Fibonacci Retracement and Support/Resistance Zone tools to mark a breakout-retest confluence zone.',
    quizQuestion: 'Why do disciplined traders often prefer entering on the retest of a broken level rather than chasing the breakout candle high?',
    quizOptions: [
      'Because retests allow tighter structural invalidation and filter out false breakouts',
      'Because breakout candles are illegal to trade',
      'Because indicators only work on retests',
    ],
    correctQuizIndex: 0,
    replayChallengePrompt:
      'Run the "BTC NY Session Range High Rejection" scenario and avoid chasing extended green candles into resistance.',
  },
  {
    id: 'psy-fomo-revenge',
    category: 'Psychology & Discipline',
    title: 'Overcoming FOMO, Revenge Trading & Moving Stop Losses',
    duration: '15 min',
    learnText:
      'Technical knowledge is useless if emotional impulses override your rules under pressure. Moving a Stop Loss farther away when price approaches it turns a planned 1R loss into a catastrophic -3R or -4R drawdown.',
    exampleText:
      'After two consecutive -1R losses, your next 1:2.5 winner recovers the entire drawdown (+2.5R vs -2.0R) — but ONLY if you kept risk constant at 1% instead of revenge-sizing to 3%.',
    chartExercise:
      'Configure your Personal Trading Pause Rules in the Self-Control panel (max 3 trades/day, 1% max risk, 15m post-loss cooldown).',
    quizQuestion: 'What is the correct professional response when price moves toward your predetermined Stop Loss?',
    quizOptions: [
      'Move the Stop Loss farther away to give the trade more room to hope',
      'Accept the predefined invalidation at -1R and review the setup calmly afterward',
      'Double the position size immediately without a plan',
    ],
    correctQuizIndex: 1,
    replayChallengePrompt:
      'Complete 3 simulated replay trades with zero Stop-Loss widening modifications.',
  },
];

export interface DisciplineChallenge {
  id: string;
  title: string;
  subtitle: string;
  targetTrades: number;
  maxRiskPercent: number;
  minRR: number;
  requireThesis: boolean;
  zeroSlWidening: boolean;
  badgeLabel: string;
  rules: string[];
}

export const DISCIPLINE_CHALLENGES: DisciplineChallenge[] = [
  {
    id: '10-trade-discipline',
    title: '10-Trade Discipline Challenge',
    subtitle: 'Prove process consistency over a 10-trade sample size scored on rule adherence, not luck.',
    targetTrades: 10,
    maxRiskPercent: 1.0,
    minRR: 1.5,
    requireThesis: true,
    zeroSlWidening: true,
    badgeLabel: 'Core Mastery',
    rules: [
      'Maximum 1.0% account risk per trade',
      'Maximum 3 trades per session',
      'Written structural trade thesis required before entry',
      'Stop Loss and Take Profit must be set prior to execution',
    ],
  },
  {
    id: 'no-fomo-challenge',
    title: 'No FOMO / Patient Entry Challenge',
    subtitle: 'Wait for price to test a mapped support/resistance level with minimum 1:2.0 R:R.',
    targetTrades: 5,
    maxRiskPercent: 1.0,
    minRR: 2.0,
    requireThesis: true,
    zeroSlWidening: false,
    badgeLabel: 'Patience Drill',
    rules: [
      'Minimum 1:2.0 Risk/Reward ratio on every trade',
      'Must document the key structure level in your trade reason',
      'No chasing extended candles far from EMA 20 / structure',
    ],
  },
  {
    id: 'stop-loss-integrity',
    title: 'Stop-Loss Integrity Challenge',
    subtitle: 'Execute 5 simulated trades without ever widening your Stop Loss or removing invalidation.',
    targetTrades: 5,
    maxRiskPercent: 1.0,
    minRR: 1.5,
    requireThesis: true,
    zeroSlWidening: true,
    badgeLabel: 'Risk Control',
    rules: [
      'Stop Loss must be defined before entry',
      'Zero Stop-Loss widening allowed once position is open',
      'Accept -1R invalidations calmly without increasing next-trade risk',
    ],
  },
  {
    id: 'risk-consistency',
    title: '0.5% Institutional Sizing Challenge',
    subtitle: 'Maintain ultra-consistent 0.5% risk sizing across 6 consecutive BTC or Gold trades.',
    targetTrades: 6,
    maxRiskPercent: 0.5,
    minRR: 1.8,
    requireThesis: true,
    zeroSlWidening: true,
    badgeLabel: 'Capital Preservation',
    rules: [
      'Risk strictly capped at 0.5% per trade',
      'Minimum 1:1.8 R:R ratio',
      'Complete AI Trade Review after each closed trade',
    ],
  },
];

export interface AiTraderDemoStep {
  stepNumber: number;
  phase: string;
  candleOffset: number;
  actionType: 'OBSERVE' | 'NO_TRADE' | 'ENTER_LONG' | 'MONITOR' | 'EXIT_REVIEW';
  headline: string;
  reasoning: string;
  metricsLabel: string;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export const AI_WATCH_ME_TRADE_SCENARIOS: Array<{
  id: string;
  title: string;
  symbol: 'BTC/USD' | 'XAU/USD';
  outcomeType: 'DISCIPLINED_EXECUTION' | 'DISCIPLINED_NO_TRADE';
  summary: string;
  steps: AiTraderDemoStep[];
}> = [
  {
    id: 'demo-btc-retest',
    title: 'Scenario 1: BTC/USD Support Sweep & Confirmed Retest (Trade Taken)',
    symbol: 'BTC/USD',
    outcomeType: 'DISCIPLINED_EXECUTION',
    summary: 'Step-by-step demonstration of waiting for confirmation at support, sizing at 0.5% risk, and managing to +2.2R.',
    steps: [
      {
        stepNumber: 1,
        phase: '1. Market Structure Identified',
        candleOffset: 45,
        actionType: 'OBSERVE',
        headline: 'Higher-Timeframe Bullish Structure Intact',
        reasoning: 'BTC/USD 15m is printing higher swing lows above EMA 50, while pulling back toward a prior demand zone.',
        metricsLabel: 'Structure: Bullish HL | Bias: Wait for Pullback',
      },
      {
        stepNumber: 2,
        phase: '2. Key Level Identified',
        candleOffset: 48,
        actionType: 'OBSERVE',
        headline: 'Horizontal Demand & EMA Confluence Mapped',
        reasoning: 'Marked the prior breakout base as the primary zone of interest. Entering now in mid-air would offer poor 1:0.9 R:R.',
        metricsLabel: 'Confluence: Prior Base + EMA 50',
      },
      {
        stepNumber: 3,
        phase: '3. Waiting for Confirmation (Patience)',
        candleOffset: 51,
        actionType: 'NO_TRADE',
        headline: 'Bearish Candle Approaching Level — Standing Aside',
        reasoning: 'Price touches the level with a heavy red candle. We do NOT catch a falling knife; we wait for absorption and a bullish close.',
        metricsLabel: 'Action: WAIT (No Confirmation Yet)',
      },
      {
        stepNumber: 4,
        phase: '4. Setup Confirmed & Risk Calculated',
        candleOffset: 54,
        actionType: 'ENTER_LONG',
        headline: 'Rejection Wick + Bullish Reclaim Close Confirmed',
        reasoning: 'Buyers defended the demand zone with expanding volume. Stop Loss placed 1.3x ATR below the swing low wick; Take Profit set below overhead resistance for 1:2.2 R:R at 0.5% risk.',
        metricsLabel: 'Action: LONG | Risk: 0.5% | R:R 1:2.2',
      },
      {
        stepNumber: 5,
        phase: '5. Trade Monitored Without Impulse Interference',
        candleOffset: 60,
        actionType: 'MONITOR',
        headline: 'Minor Mid-Trade Pullback — Holding Predetermined Plan',
        reasoning: 'Price consolidates halfway to target. Structure remains intact above EMA 20, so we resist the urge to close early out of fear.',
        metricsLabel: 'Status: Open (+1.1R Floating) | Modifications: 0',
      },
      {
        stepNumber: 6,
        phase: '6. Result Reviewed',
        candleOffset: 66,
        actionType: 'EXIT_REVIEW',
        headline: 'Target Reached at Overhead Structure (+2.2R)',
        reasoning: 'Lesson: Waiting 6 extra candles for confirmation protected capital and provided a clean invalidation anchor.',
        metricsLabel: 'Outcome: +2.2R | Discipline Score: 96/100',
      },
    ],
  },
  {
    id: 'demo-xau-no-trade',
    title: 'Scenario 2: XAU/USD Choppy Mid-Range Compression (NO TRADE Decision)',
    symbol: 'XAU/USD',
    outcomeType: 'DISCIPLINED_NO_TRADE',
    summary: 'Demonstrates why choosing NO TRADE during unclear, overlapping price action is a core professional skill.',
    steps: [
      {
        stepNumber: 1,
        phase: '1. Market Structure Audit',
        candleOffset: 42,
        actionType: 'OBSERVE',
        headline: 'Overlapping Candles Inside Mid-Range',
        reasoning: 'XAU/USD is oscillating tightly around flat EMA 20 and EMA 50 with alternating upper and lower wicks.',
        metricsLabel: 'Structure: Unclear / Choppy Range',
      },
      {
        stepNumber: 2,
        phase: '2. Risk/Reward & Volatility Check',
        candleOffset: 46,
        actionType: 'OBSERVE',
        headline: 'Overhead Resistance Too Close for Minimum 1:2 R:R',
        reasoning: 'Distance to nearest structural invalidation is $4.80, while overhead supply sits only $4.10 away — yielding an unfavorable 1:0.85 R:R.',
        metricsLabel: 'Available R:R: 1:0.85 (Fails 1:2.0 Rule)',
      },
      {
        stepNumber: 3,
        phase: '3. Final Decision: NO TRADE',
        candleOffset: 50,
        actionType: 'NO_TRADE',
        headline: 'Standing Aside — Capital & Mental Energy Preserved',
        reasoning: 'Taking a trade here would be gambling on coin-flip noise. Professional trading requires passing on sub-standard setups so capital is ready when clear structure emerges.',
        metricsLabel: 'Decision: NO TRADE | Risk Taken: 0.0%',
      },
    ],
  },
];
