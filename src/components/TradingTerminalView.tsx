import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  Sliders,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  X,
  Scissors,
  ChevronDown,
  ChevronUp,
  LogOut,
  Search,
  CandlestickChart,
  Globe,
  Maximize2,
  Minimize2,
  RotateCcw,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  BrainCircuit,
  Eye,
  Check,
  Radio,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { SupportedSymbol, SupportedTimeframe, BRAND_CONFIG } from '../config/brand';
import {
  CandleData,
  DEFAULT_INDICATORS,
  IndicatorConfig,
  MarketDataProvider,
  calculateLatestOscillatorSnapshot,
  TIMEFRAME_SECONDS,
  findAiTechniqueSetups,
  AiTechniqueSetup,
  scanAiAutonomousPrediction,
  AiAutonomousPrediction,
  HistoricalTradeLesson,
  getHistoricalTradeLessons,
} from '../services/marketEngine';
import { liveMarketStreamer, LiveStreamStatus, LiveMarketTick } from '../services/liveMarketStreamer';
import { TradingChart, ChartVisualType, AiAutoMarkOverlay, DraftOrderBracket } from './TradingChart';
import { UserProfileData, SimulatedTradeRecord, DisciplineEventRecord } from '../lib/firebase';
import { UserSubscriptionRecord } from '../services/subscriptionService';
import { AiChartTeacherModal } from './AiChartTeacherModal';
import { UserProfileModal } from './UserProfileModal';
import {
  AiBacktestTeacherEngine,
  ConfirmationCircle,
  InspectedCandleSymptom,
  DeepBacktestReport,
} from '../services/aiBacktestTeacherEngine';

export type AiCoachLanguage = 'bn' | 'banglish' | 'en' | 'hi';

interface TradingTerminalViewProps {
  mode?: 'TERMINAL' | 'REPLAY' | 'LIVE';
  profile: UserProfileData;
  trades: SimulatedTradeRecord[];
  onSaveTrade: (trade: SimulatedTradeRecord) => Promise<void>;
  onUpdateTrade: (tradeId: string, updates: Partial<SimulatedTradeRecord>) => Promise<void>;
  onLogDisciplineEvent: (event: Omit<DisciplineEventRecord, 'id'>) => Promise<void>;
  onUpdateBalance: (newBalance: number, newScore?: number) => Promise<void>;
  onSignOut?: () => void;
  isDemoSandbox?: boolean;
  onGoogleLogin?: () => Promise<void>;
  userSubscription?: UserSubscriptionRecord | null;
  onOpenSubscriptionModal?: () => void;
}

interface ActivePosition {
  id: string;
  instrument: SupportedSymbol;
  timeframe: SupportedTimeframe;
  orderType: 'MARKET' | 'PENDING';
  status: 'PENDING_FILL' | 'OPEN';
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  units: number;
  riskPercent: number;
  riskAmount: number;
  rrRatio: number;
  openedAtIndex: number;
  openedTime: number;
  mfePrice: number;
  maePrice: number;
  movedToBreakeven: boolean;
  partialClosed: boolean;
  confirmationsUsed: string[];
  actionLog: string[];
}

interface AiPostTradeAutopsy {
  tradeId: string;
  instrument: string;
  direction: 'LONG' | 'SHORT';
  pnl: number;
  rMultiple: number;
  status: string;
  verdictBadge: string;
  whyWinOrLose: string;
  entryTimingAnalysis: string;
  confirmationsPresent: string[];
  confirmationsMissed: string[];
  keyLesson: string;
  optimalSetup?: {
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    explanation: string;
  };
}

export const TradingTerminalView: React.FC<TradingTerminalViewProps> = ({
  profile,
  trades,
  onSaveTrade,
  onUpdateBalance,
  onSignOut,
  isDemoSandbox,
  onGoogleLogin,
  userSubscription,
  onOpenSubscriptionModal,
}) => {
  const initialSymbol: SupportedSymbol =
    profile.preferredMarket === 'XAU/USD' ? 'XAU/USD' : 'BTC/USD';
  const [symbol, setSymbol] = useState<SupportedSymbol>(initialSymbol);
  const [timeframe, setTimeframe] = useState<SupportedTimeframe>(profile.preferredTimeframe || '15m');
  const [chartType, setChartType] = useState<ChartVisualType>('candlestick');
  const [indicators, setIndicators] = useState<IndicatorConfig[]>(DEFAULT_INDICATORS);
  const [showIndicatorModal, setShowIndicatorModal] = useState(false);
  const [indicatorSearch, setIndicatorSearch] = useState('');
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);

  // AI Language Selection (Defaults to Bengali 'bn')
  const [aiLanguage, setAiLanguage] = useState<AiCoachLanguage>('bn');

  // Full-Window / Fullscreen Chart State
  const [isFullWindowChart, setIsFullWindowChart] = useState<boolean>(false);

  // In-memory stable cache for pairs so pairs NEVER disappear or reset!
  const pairCandlesCache = useRef<Record<SupportedSymbol, CandleData[]>>({
    'BTC/USD': MarketDataProvider.getThreeMonthCandles('BTC/USD', profile.preferredTimeframe || '15m', 1500),
    'XAU/USD': MarketDataProvider.getThreeMonthCandles('XAU/USD', profile.preferredTimeframe || '15m', 1500),
  });

  // 3-Month Historical + Live Candles
  const [allCandles, setAllCandles] = useState<CandleData[]>(() => pairCandlesCache.current[initialSymbol]);

  // TradingView Bar Replay State (Default to FALSE = 100% REAL LIVE MARKET STREAM)
  const [isReplayMode, setIsReplayMode] = useState<boolean>(false);
  const [isReplayCutMode, setIsReplayCutMode] = useState<boolean>(false);
  const [replayIndex, setReplayIndex] = useState<number>(() => pairCandlesCache.current[initialSymbol].length - 1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1);

  // Live WebSocket Feed Connection State
  const [liveWsStatus, setLiveWsStatus] = useState<LiveStreamStatus>('CONNECTING');
  const [livePriceFlash, setLivePriceFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef<number>(0);

  // Flyout Panels
  const [showOrderTicketFlyout, setShowOrderTicketFlyout] = useState<boolean>(false);
  const [showAiFloatingCard, setShowAiFloatingCard] = useState<boolean>(false);
  const [bottomDrawerOpen, setBottomDrawerOpen] = useState<boolean>(false);
  const [bottomTab, setBottomTab] = useState<'POSITIONS' | 'HISTORY'>('POSITIONS');

  // Exness-Style Draft Order Setup (Draggable SL/TP on Chart + Live Dollar Risk/Reward)
  const [draftOrder, setDraftOrder] = useState<DraftOrderBracket | null>(null);

  // Order Parameters
  const [orderExecutionMode, setOrderExecutionMode] = useState<'MARKET' | 'PENDING'>('MARKET');
  const [tradeDirection, setTradeDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [lotSize, setLotSize] = useState<number>(initialSymbol === 'BTC/USD' ? 0.5 : 1.0);
  const [pendingEntryPrice, setPendingEntryPrice] = useState<number>(0);
  const [stopLossPrice, setStopLossPrice] = useState<number>(0);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(0);

  // Active Open/Pending Position
  const [activePosition, setActivePosition] = useState<ActivePosition | null>(null);

  // AI Auto-Mark & Post-Trade Autopsy
  const [aiAutoMark, setAiAutoMark] = useState<AiAutoMarkOverlay | null>(null);
  const [isAiMarking, setIsAiMarking] = useState<boolean>(false);
  const [latestAutopsy, setLatestAutopsy] = useState<AiPostTradeAutopsy | null>(null);
  const [isGeneratingAutopsy, setIsGeneratingAutopsy] = useState<boolean>(false);
  const [toastBanner, setToastBanner] = useState<{ text: string; tone: 'emerald' | 'crimson' | 'blue' } | null>(null);

  // AI Technique & Method Finder Lab Modal
  const [showAiStrategyLab, setShowAiStrategyLab] = useState<boolean>(false);
  const [strategyLabCategory, setStrategyLabCategory] = useState<string>('ALL');
  const [isScanningNewMethods, setIsScanningNewMethods] = useState<boolean>(false);
  const [discoveredSetups, setDiscoveredSetups] = useState<AiTechniqueSetup[]>(() =>
    findAiTechniqueSetups(pairCandlesCache.current[initialSymbol], initialSymbol, '15m')
  );

  // AI Smart Live Prediction Scanner & 10-Second Auto-Execution
  const [isAiPredictorActive, setIsAiPredictorActive] = useState<boolean>(true);
  const [aiPredictionAlert, setAiPredictionAlert] = useState<AiAutonomousPrediction | null>(null);
  const [predictionCountdown, setPredictionCountdown] = useState<number>(10);
  const lastScannedTimeRef = useRef<number>(0);

  // High-Impact SMC & Educational Backtest Mentor State
  const [showHighImpactSmc, setShowHighImpactSmc] = useState<boolean>(true);
  const [showLessonsMode, setShowLessonsMode] = useState<boolean>(true);
  const [activeLesson, setActiveLesson] = useState<HistoricalTradeLesson | null>(null);

  // AI Confirmation Circles & Auto-Backtest Teacher Engine State
  const [showConfirmationCircles, setShowConfirmationCircles] = useState<boolean>(true);
  const [showPerfectEntrySymbols, setShowPerfectEntrySymbols] = useState<boolean>(true);
  const [activeConfirmationCircle, setActiveConfirmationCircle] = useState<ConfirmationCircle | null>(null);
  const [inspectedCandleSymptom, setInspectedCandleSymptom] = useState<InspectedCandleSymptom | null>(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState<boolean>(false);
  const [showSniperHud, setShowSniperHud] = useState<boolean>(true);

  // Deep Auto Backtest Report across 3-Month Candles
  const deepBacktestReport: DeepBacktestReport = useMemo(() => {
    return AiBacktestTeacherEngine.runDeepAutoBacktest(allCandles, symbol, timeframe, aiLanguage);
  }, [allCandles, symbol, timeframe, aiLanguage]);

  const historicalLessons = useMemo(() => {
    return getHistoricalTradeLessons(allCandles, symbol, timeframe);
  }, [allCandles, symbol, timeframe]);

  const handleReplayFromLesson = (lesson: HistoricalTradeLesson) => {
    const candleIdx = allCandles.findIndex((c) => c.time >= lesson.candleTime);
    if (candleIdx >= 0) {
      setIsReplayMode(true);
      setReplayIndex(Math.min(allCandles.length - 1, candleIdx + 4));
      setIsPlaying(false);
      showToast(
        aiLanguage === 'en'
          ? `Replaying from Lesson #${lesson.lessonNumber}: ${lesson.titleEn}`
          : `লেসন #${lesson.lessonNumber} থেকে রিপ্লে শুরু হয়েছে: ${lesson.titleBn}`,
        'emerald'
      );
    }
  };

  const symbolMeta = BRAND_CONFIG.markets[symbol] || BRAND_CONFIG.markets['BTC/USD'];
  const decimals = symbolMeta.decimals;

  const visibleCandles = isReplayMode
    ? allCandles.slice(0, Math.max(25, Math.min(replayIndex + 1, allCandles.length)))
    : allCandles;

  const currentCandle = visibleCandles[visibleCandles.length - 1] || {
    time: Math.floor(Date.now() / 1000),
    open: symbolMeta.defaultPrice,
    high: symbolMeta.defaultPrice,
    low: symbolMeta.defaultPrice,
    close: symbolMeta.defaultPrice,
    volume: 100,
  };

  const currentPrice = currentCandle.close;
  const halfSpread = symbol === 'BTC/USD' ? 4.0 : 0.18;
  const bidPrice = Number((currentPrice - halfSpread).toFixed(decimals));
  const askPrice = Number((currentPrice + halfSpread).toFixed(decimals));

  const oscSnapshot = calculateLatestOscillatorSnapshot(visibleCandles);

  const showToast = (text: string, tone: 'emerald' | 'crimson' | 'blue' = 'blue') => {
    setToastBanner({ text, tone });
    setTimeout(() => {
      setToastBanner((prev) => (prev?.text === text ? null : prev));
    }, 4200);
  };

  const getContractUnits = (sym: SupportedSymbol, lots: number) => {
    return sym === 'XAU/USD' ? lots * 10 : lots;
  };

  // Initialize Default Stop Loss and Take Profit
  const initDefaultBracket = (basePrice: number, dir: 'LONG' | 'SHORT', sym: SupportedSymbol) => {
    const dist = sym === 'BTC/USD' ? 360 : 6.0;
    const sl = Number((dir === 'LONG' ? basePrice - dist : basePrice + dist).toFixed(decimals));
    const tp = Number((dir === 'LONG' ? basePrice + dist * 3.0 : basePrice - dist * 3.0).toFixed(decimals));
    setPendingEntryPrice(Number(basePrice.toFixed(decimals)));
    setStopLossPrice(sl);
    setTakeProfitPrice(tp);
  };

  // Start Exness-Style Draft Order Setup (Order Preview on Chart)
  const handleStartDraftOrder = (dir: 'LONG' | 'SHORT') => {
    const basePrice = dir === 'LONG' ? askPrice : bidPrice;
    const defaultDist = symbol === 'BTC/USD' ? 360 : 6.0;
    const sl = Number((dir === 'LONG' ? basePrice - defaultDist : basePrice + defaultDist).toFixed(decimals));
    const tp = Number((dir === 'LONG' ? basePrice + defaultDist * 3.0 : basePrice - defaultDist * 3.0).toFixed(decimals));

    setTradeDirection(dir);
    setStopLossPrice(sl);
    setTakeProfitPrice(tp);
    setDraftOrder({
      active: true,
      direction: dir,
      entryPrice: basePrice,
      stopLoss: sl,
      takeProfit: tp,
      lotSize,
    });
    showToast(
      `Exness Order Mode: Adjust SL & TP lines on chart, then click CONFIRM ${dir === 'LONG' ? 'BUY' : 'SELL'}!`,
      'blue'
    );
  };

  const handleUpdateDraftSl = (sl: number) => {
    setStopLossPrice(sl);
    if (draftOrder) {
      setDraftOrder({ ...draftOrder, stopLoss: sl });
    }
  };

  const handleUpdateDraftTp = (tp: number) => {
    setTakeProfitPrice(tp);
    if (draftOrder) {
      setDraftOrder({ ...draftOrder, takeProfit: tp });
    }
  };

  const handleUpdateDraftEntry = (entry: number) => {
    setPendingEntryPrice(entry);
    if (draftOrder) {
      setDraftOrder({ ...draftOrder, entryPrice: entry });
    }
  };

  const handleConfirmDraftOrder = () => {
    if (!draftOrder) return;
    executeOrder(draftOrder.direction, true, undefined, draftOrder.stopLoss, draftOrder.takeProfit, draftOrder.entryPrice);
    setDraftOrder(null);
  };

  const handleCancelDraftOrder = () => {
    setDraftOrder(null);
    showToast('Draft order cancelled.', 'blue');
  };

  // Active Symbol ref to guard against async fetch race conditions
  const activeSymbolRef = useRef<SupportedSymbol>(symbol);
  activeSymbolRef.current = symbol;

  // Switch Pair Safely Without Disappearing / Flickering
  const handleSelectSymbol = (newSymbol: SupportedSymbol) => {
    if (newSymbol === symbol) return;
    setSymbol(newSymbol);
    activeSymbolRef.current = newSymbol;

    // Immediately load from pair cache so chart never flashes or disappears
    const cached = pairCandlesCache.current[newSymbol] || MarketDataProvider.getThreeMonthCandles(newSymbol, timeframe, 1500);
    setAllCandles(cached);
    const startIdx = isReplayMode ? Math.max(100, cached.length - 120) : cached.length - 1;
    setReplayIndex(startIdx);
    setIsPlaying(false);
    setDraftOrder(null);
    setAiAutoMark(null);
    setAiPredictionAlert(null);
    initDefaultBracket(cached[startIdx].close, tradeDirection, newSymbol);

    // Update Live WebSocket Streamer to the new pair
    liveMarketStreamer.setSymbolAndTimeframe(newSymbol, timeframe);
    setDiscoveredSetups(findAiTechniqueSetups(cached, newSymbol, timeframe));

    // Fetch background 3-month history & live feed safely with active symbol guard
    MarketDataProvider.fetchThreeMonthHistoryAndLive(newSymbol, timeframe).then((res) => {
      if (res.candles && res.candles.length >= 100) {
        pairCandlesCache.current[newSymbol] = res.candles;
        if (activeSymbolRef.current === newSymbol) {
          setAllCandles(res.candles);
          if (isReplayMode) {
            setReplayIndex(Math.max(100, res.candles.length - 120));
          } else {
            setReplayIndex(res.candles.length - 1);
          }
          setDiscoveredSetups(findAiTechniqueSetups(res.candles, newSymbol, timeframe));
        }
      }
    });

    showToast(`Switched to ${newSymbol === 'XAU/USD' ? 'XAU/USD Gold' : 'BTC/USD'} (Sub-Second Live Stream Connected)`, 'emerald');
  };

  // Sub-Second Live WebSocket Streamer Subscription
  const isReplayModeRef = useRef(isReplayMode);
  isReplayModeRef.current = isReplayMode;
  const replayIndexRef = useRef(replayIndex);
  replayIndexRef.current = replayIndex;

  useEffect(() => {
    liveMarketStreamer.setSymbolAndTimeframe(symbol, timeframe);

    const unsubStatus = liveMarketStreamer.subscribeStatus((status) => {
      setLiveWsStatus(status);
    });

    const unsubTicks = liveMarketStreamer.subscribeTicks((tick) => {
      if (tick.symbol !== symbol) return;

      // Pulse color flash on micro-tick
      if (prevPriceRef.current > 0 && tick.price !== prevPriceRef.current) {
        setLivePriceFlash(tick.price > prevPriceRef.current ? 'up' : 'down');
        setTimeout(() => setLivePriceFlash(null), 250);
      }
      prevPriceRef.current = tick.price;

      // If at real-time tip, update the running candle in allCandles
      if (!isReplayModeRef.current || replayIndexRef.current >= allCandles.length - 1) {
        setAllCandles((prev) => {
          if (prev.length === 0) return prev;
          const copy = [...prev];
          const lastIdx = copy.length - 1;
          const last = copy[lastIdx];

          // If new candle timeframe period has arrived
          const stepSec = TIMEFRAME_SECONDS[timeframe] || 900;
          if (tick.candle.time > last.time + stepSec) {
            copy.push(tick.candle);
            return copy;
          }

          copy[lastIdx] = {
            ...last,
            close: tick.price,
            high: Math.max(last.high, tick.price),
            low: Math.min(last.low, tick.price),
            volume: last.volume + 1,
          };
          return copy;
        });
      }
    });

    return () => {
      unsubStatus();
      unsubTicks();
    };
  }, [symbol, timeframe]);

  // Initial / Pair-Change Data Fetch on Mount or Symbol/Timeframe Change
  useEffect(() => {
    let mounted = true;
    MarketDataProvider.fetchThreeMonthHistoryAndLive(symbol, timeframe).then((res) => {
      if (!mounted) return;
      if (res.candles && res.candles.length >= 30) {
        pairCandlesCache.current[symbol] = res.candles;
        setAllCandles(res.candles);
        const startIdx = isReplayMode ? Math.max(30, res.candles.length - 120) : res.candles.length - 1;
        setReplayIndex(startIdx);
        initDefaultBracket(res.candles[startIdx].close, tradeDirection, symbol);
        setDiscoveredSetups(findAiTechniqueSetups(res.candles, symbol, timeframe));
      }
    });

    return () => {
      mounted = false;
    };
  }, [symbol, timeframe]);

  // Keyboard Shortcuts: Spacebar = Play/Pause, Right Arrow = +1 Bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsReplayMode(true);
        setIsPlaying((p) => !p);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setIsPlaying(false);
        setIsReplayMode(true);
        setReplayIndex((i) => Math.min(allCandles.length - 1, i + 1));
      } else if (e.code === 'Escape') {
        if (draftOrder) setDraftOrder(null);
        if (isFullWindowChart) setIsFullWindowChart(false);
        if (showAiStrategyLab) setShowAiStrategyLab(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allCandles.length, isFullWindowChart, draftOrder, showAiStrategyLab]);

  // Bar Replay Engine Loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = Math.max(120, Math.floor(1000 / (replaySpeed * 1.5)));
    const interval = setInterval(() => {
      setReplayIndex((prev) => {
        if (prev >= allCandles.length - 1) {
          setIsPlaying(false);
          showToast('Reached real-time live market stream.', 'blue');
          return prev;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isPlaying, replaySpeed, allCandles.length]);

  // AI Smart Live Prediction Scanner (Checks for High-Confluence Institutional A+ Setups)
  useEffect(() => {
    if (!isAiPredictorActive || activePosition) return;

    const lastTime = currentCandle.time;
    if (lastTime === lastScannedTimeRef.current) return;
    lastScannedTimeRef.current = lastTime;

    // Scan market using strict institutional rejection and momentum guard engine
    const prediction = scanAiAutonomousPrediction(visibleCandles, symbol);
    if (prediction && !aiPredictionAlert) {
      setAiPredictionAlert(prediction);
      setPredictionCountdown(10);
    }
  }, [isAiPredictorActive, currentCandle.time, visibleCandles, symbol, activePosition, aiPredictionAlert]);

  // 10-Second Countdown for AI Autonomous Prediction Trade Execution
  useEffect(() => {
    if (!aiPredictionAlert) return;

    if (predictionCountdown <= 0) {
      const pred = aiPredictionAlert;
      setAiPredictionAlert(null);
      executeOrder(
        pred.direction === 'BUY' ? 'LONG' : 'SHORT',
        true,
        undefined,
        pred.stopLoss,
        pred.takeProfit,
        pred.entryPrice,
        pred.lotSize
      );
      showToast(
        `⚡ AI AUTO-PILOT EXECUTED: ${pred.direction} ${pred.lotSize} Lots on ${symbol}!`,
        'emerald'
      );
      return;
    }

    const timer = setTimeout(() => {
      setPredictionCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [aiPredictionAlert, predictionCountdown, symbol]);

  // Live Position Monitoring (SL / TP Hits during Bar Replay & Live Feed)
  useEffect(() => {
    if (!activePosition) return;

    if (activePosition.status === 'PENDING_FILL') {
      const isLong = activePosition.direction === 'LONG';
      const isFilled = isLong
        ? currentCandle.low <= activePosition.entryPrice
        : currentCandle.high >= activePosition.entryPrice;
      if (isFilled) {
        setActivePosition({
          ...activePosition,
          status: 'OPEN',
          actionLog: [...activePosition.actionLog, `Limit order filled @ ${activePosition.entryPrice}`],
        });
        showToast(`🎯 Pending Limit Order Filled @ ${activePosition.entryPrice.toFixed(decimals)}`, 'emerald');
      }
      return;
    }

    // Active OPEN Position: Check Stop Loss & Take Profit
    const isLong = activePosition.direction === 'LONG';
    let newMfe = activePosition.mfePrice;
    let newMae = activePosition.maePrice;

    if (isLong) {
      if (currentCandle.high > newMfe) newMfe = currentCandle.high;
      if (currentCandle.low < newMae) newMae = currentCandle.low;
    } else {
      if (currentCandle.low < newMfe) newMfe = currentCandle.low;
      if (currentCandle.high > newMae) newMae = currentCandle.high;
    }

    // Take Profit Trigger
    const tpHit = isLong
      ? currentCandle.high >= activePosition.takeProfit
      : currentCandle.low <= activePosition.takeProfit;
    if (tpHit) {
      setIsPlaying(false);
      finalizeClosePosition(activePosition.takeProfit, 'TAKE_PROFIT', newMfe, newMae);
      showToast(`🎯 TAKE PROFIT HIT! (+${activePosition.rrRatio}R)`, 'emerald');
      return;
    }

    // Stop Loss Trigger
    const slHit = isLong
      ? currentCandle.low <= activePosition.stopLoss
      : currentCandle.high >= activePosition.stopLoss;
    if (slHit) {
      setIsPlaying(false);
      finalizeClosePosition(activePosition.stopLoss, 'STOP_LOSS', newMfe, newMae);
      showToast(`✕ STOP LOSS HIT (-1.0R)`, 'crimson');
      return;
    }

    if (newMfe !== activePosition.mfePrice || newMae !== activePosition.maePrice) {
      setActivePosition({
        ...activePosition,
        mfePrice: newMfe,
        maePrice: newMae,
      });
    }
  }, [currentCandle, activePosition]);

  // Real Order Execution Function
  const executeOrder = (
    overrideDir?: 'LONG' | 'SHORT',
    forceMarket = false,
    customSetup?: AiAutoMarkOverlay,
    customSl?: number,
    customTp?: number,
    customEntry?: number,
    customLots?: number
  ) => {
    const dir = customSetup
      ? customSetup.direction === 'BUY'
        ? 'LONG'
        : 'SHORT'
      : overrideDir || tradeDirection;

    const modeToUse = forceMarket || customSetup ? 'MARKET' : orderExecutionMode;
    const entry = customEntry
      ? Number(customEntry.toFixed(decimals))
      : customSetup
      ? Number(customSetup.entryPrice.toFixed(decimals))
      : modeToUse === 'MARKET'
      ? dir === 'LONG'
        ? askPrice
        : bidPrice
      : pendingEntryPrice || currentPrice;

    const defaultDist = symbol === 'BTC/USD' ? 360 : 6.0;
    let sl = customSl
      ? Number(customSl.toFixed(decimals))
      : customSetup
      ? Number(customSetup.stopLoss.toFixed(decimals))
      : stopLossPrice;
    let tp = customTp
      ? Number(customTp.toFixed(decimals))
      : customSetup
      ? Number(customSetup.takeProfit.toFixed(decimals))
      : takeProfitPrice;

    if (!sl || (dir === 'LONG' && sl >= entry) || (dir === 'SHORT' && sl <= entry)) {
      sl = Number((dir === 'LONG' ? entry - defaultDist : entry + defaultDist).toFixed(decimals));
    }
    if (!tp || (dir === 'LONG' && tp <= entry) || (dir === 'SHORT' && tp >= entry)) {
      tp = Number((dir === 'LONG' ? entry + defaultDist * 3.0 : entry - defaultDist * 3.0).toFixed(decimals));
    }

    setStopLossPrice(sl);
    setTakeProfitPrice(tp);

    const actualLots = customLots || lotSize;
    const posUnits = getContractUnits(symbol, actualLots);
    const riskUsd = Number((Math.abs(entry - sl) * posUnits).toFixed(2));
    const rewardUsd = Number((Math.abs(tp - entry) * posUnits).toFixed(2));
    const calcRR = riskUsd > 0 ? Number((rewardUsd / riskUsd).toFixed(2)) : 3.0;

    const newPos: ActivePosition = {
      id: `tv_${Date.now()}`,
      instrument: symbol,
      timeframe,
      orderType: modeToUse,
      status: modeToUse === 'MARKET' ? 'OPEN' : 'PENDING_FILL',
      direction: dir,
      entryPrice: entry,
      stopLoss: sl,
      takeProfit: tp,
      lotSize: actualLots,
      units: posUnits,
      riskPercent: Number(((riskUsd / Math.max(1, profile.virtualBalance)) * 100).toFixed(2)),
      riskAmount: riskUsd,
      rrRatio: calcRR,
      openedAtIndex: replayIndex,
      openedTime: currentCandle.time,
      mfePrice: entry,
      maePrice: entry,
      movedToBreakeven: false,
      partialClosed: false,
      confirmationsUsed: customSetup?.confirmations || aiAutoMark?.confirmations || ['Exness Price Action Execution'],
      actionLog: [
        `${modeToUse} ${dir} ${actualLots} Lots @ ${entry.toFixed(decimals)} (SL: ${sl.toFixed(
          decimals
        )}, TP: ${tp.toFixed(decimals)})`,
      ],
    };

    setTradeDirection(dir);
    setActivePosition(newPos);
    setDraftOrder(null);
    if (customSetup) setAiAutoMark(null);

    showToast(
      `✅ ${dir === 'LONG' ? 'BUY' : 'SELL'} ${actualLots} Lots Placed @ ${entry.toFixed(
        decimals
      )}! SL & TP lines are live on chart. Press PLAY (▶) to simulate.`,
      'emerald'
    );
  };

  // Dragging SL / TP / Entry Lines directly on Chart
  const handleChartUpdateStopLoss = (newSl: number) => {
    setStopLossPrice(newSl);
    if (activePosition) {
      const riskUsd = Number((Math.abs(activePosition.entryPrice - newSl) * activePosition.units).toFixed(2));
      const rewardUsd = Number((Math.abs(activePosition.takeProfit - activePosition.entryPrice) * activePosition.units).toFixed(2));
      setActivePosition({
        ...activePosition,
        stopLoss: newSl,
        riskAmount: riskUsd,
        rrRatio: riskUsd > 0 ? Number((rewardUsd / riskUsd).toFixed(2)) : activePosition.rrRatio,
      });
    }
  };

  const handleChartUpdateTakeProfit = (newTp: number) => {
    setTakeProfitPrice(newTp);
    if (activePosition) {
      const riskUsd = Number((Math.abs(activePosition.entryPrice - activePosition.stopLoss) * activePosition.units).toFixed(2));
      const rewardUsd = Number((Math.abs(newTp - activePosition.entryPrice) * activePosition.units).toFixed(2));
      setActivePosition({
        ...activePosition,
        takeProfit: newTp,
        rrRatio: riskUsd > 0 ? Number((rewardUsd / riskUsd).toFixed(2)) : activePosition.rrRatio,
      });
    }
  };

  const handleChartUpdateEntryPrice = (newEntry: number) => {
    setPendingEntryPrice(newEntry);
    if (activePosition && activePosition.status === 'PENDING_FILL') {
      setActivePosition({
        ...activePosition,
        entryPrice: newEntry,
      });
    }
  };

  const handleMoveToBreakeven = () => {
    if (!activePosition) return;
    setStopLossPrice(activePosition.entryPrice);
    setActivePosition({
      ...activePosition,
      stopLoss: activePosition.entryPrice,
      movedToBreakeven: true,
      actionLog: [...activePosition.actionLog, 'Moved Stop Loss to Breakeven'],
    });
    showToast('Stop Loss snapped to Breakeven (0.0R Risk)!', 'emerald');
  };

  const handlePartialClose50 = async () => {
    if (!activePosition || activePosition.partialClosed) return;
    const isLong = activePosition.direction === 'LONG';
    const rawDiff = isLong ? currentPrice - activePosition.entryPrice : activePosition.entryPrice - currentPrice;
    const halfUnits = activePosition.units * 0.5;
    const bankedPnl = Number((rawDiff * halfUnits).toFixed(2));
    const nextLots = Number((activePosition.lotSize * 0.5).toFixed(2));

    await onUpdateBalance(Number((profile.virtualBalance + bankedPnl).toFixed(2)), profile.disciplineScore);
    setActivePosition({
      ...activePosition,
      lotSize: Math.max(0.01, nextLots),
      units: halfUnits,
      partialClosed: true,
      actionLog: [...activePosition.actionLog, `Closed 50% Partial (${bankedPnl >= 0 ? '+' : ''}$${bankedPnl})`],
    });
    showToast(`50% Partial Closed (${bankedPnl >= 0 ? '+' : ''}$${bankedPnl.toFixed(2)} banked)!`, 'emerald');
  };

  const handleReversePosition = () => {
    if (!activePosition) return;
    const nextDir: 'LONG' | 'SHORT' = activePosition.direction === 'LONG' ? 'SHORT' : 'LONG';
    const dist = Math.abs(activePosition.entryPrice - activePosition.stopLoss);
    const tpDist = Math.abs(activePosition.takeProfit - activePosition.entryPrice);
    const nextEntry = nextDir === 'LONG' ? askPrice : bidPrice;
    const nextSl = Number((nextDir === 'LONG' ? nextEntry - dist : nextEntry + dist).toFixed(decimals));
    const nextTp = Number((nextDir === 'LONG' ? nextEntry + tpDist : nextEntry - tpDist).toFixed(decimals));

    setTradeDirection(nextDir);
    setStopLossPrice(nextSl);
    setTakeProfitPrice(nextTp);
    setActivePosition({
      ...activePosition,
      direction: nextDir,
      entryPrice: nextEntry,
      stopLoss: nextSl,
      takeProfit: nextTp,
      openedAtIndex: replayIndex,
      openedTime: currentCandle.time,
      actionLog: [...activePosition.actionLog, `Reversed position to ${nextDir} @ ${nextEntry.toFixed(decimals)}`],
    });
    showToast(`Reversed Position to ${nextDir} @ ${nextEntry.toFixed(decimals)}`, 'blue');
  };

  // Close Position at Current Market State & Trigger AI Autopsy in User's Selected Language
  const finalizeClosePosition = async (
    exitPrice: number,
    exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'CLOSED_MANUAL',
    finalMfePrice?: number,
    finalMaePrice?: number
  ) => {
    if (!activePosition) return;
    const pos = activePosition;
    setActivePosition(null);

    const isLong = pos.direction === 'LONG';
    const rawDiff = isLong ? exitPrice - pos.entryPrice : pos.entryPrice - exitPrice;
    const pnl = Number((rawDiff * pos.units).toFixed(2));
    const slDist = Math.max(0.0001, Math.abs(pos.entryPrice - pos.stopLoss));
    const rMultiple = Number((rawDiff / slDist).toFixed(2));

    const mfeP = finalMfePrice ?? pos.mfePrice;
    const maeP = finalMaePrice ?? pos.maePrice;
    const mfeUsd = Number((Math.abs(mfeP - pos.entryPrice) * pos.units).toFixed(2));
    const maeUsd = Number((Math.abs(pos.entryPrice - maeP) * pos.units).toFixed(2));

    const barsHeld = Math.max(1, replayIndex - pos.openedAtIndex);
    const holdingMins = Math.round((barsHeld * TIMEFRAME_SECONDS[timeframe]) / 60);

    const closedRecord: SimulatedTradeRecord = {
      id: pos.id,
      userId: profile.uid,
      instrument: pos.instrument,
      timeframe: pos.timeframe,
      mode: isReplayMode ? 'REPLAY' : 'LIVE',
      direction: pos.direction,
      entryPrice: pos.entryPrice,
      stopLoss: pos.stopLoss,
      takeProfit: pos.takeProfit,
      exitPrice,
      positionSize: pos.lotSize,
      riskPercent: pos.riskPercent,
      riskAmount: pos.riskAmount,
      rrRatio: pos.rrRatio,
      pnl,
      rMultiple,
      status:
        exitReason === 'TAKE_PROFIT'
          ? 'TAKE_PROFIT'
          : exitReason === 'STOP_LOSS'
          ? 'STOP_LOSS'
          : pos.movedToBreakeven && Math.abs(pnl) < 1
          ? 'BREAKEVEN'
          : 'MANUALLY_CLOSED',
      setupType: aiAutoMark?.setupName || 'Price Action Backtest',
      userReason: 'Exness Price Action Execution',
      holdingTimeMinutes: holdingMins,
      mfe: mfeUsd,
      mae: maeUsd,
      modificationsCount: pos.movedToBreakeven ? 1 : 0,
      modificationsSummary: pos.actionLog.join(' | '),
      disciplineFlags: [],
      aiReviewSummary: `${exitReason}: ${pnl >= 0 ? '+' : ''}$${pnl} (${rMultiple}R)`,
    };

    await onSaveTrade(closedRecord);
    const nextBalance = Number((profile.virtualBalance + pnl).toFixed(2));
    await onUpdateBalance(nextBalance, profile.disciplineScore);

    // Generate AI Win/Loss Autopsy in user's selected language
    generatePostTradeAutopsy(closedRecord, pos.openedAtIndex);
  };

  // Generate AI Forensic Post-Trade Review in Selected Language
  const generatePostTradeAutopsy = async (trade: SimulatedTradeRecord, openIndex: number) => {
    setIsGeneratingAutopsy(true);
    setShowAiFloatingCard(true);

    const preCandles = allCandles.slice(Math.max(0, openIndex - 20), openIndex + 1);
    const duringCandles = allCandles.slice(openIndex, Math.min(allCandles.length, replayIndex + 1));

    try {
      const res = await fetch('/api/ai/review-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trade,
          visibleCandlesBeforeEntry: preCandles,
          candlesDuringTrade: duringCandles,
          language: aiLanguage,
        }),
      });

      if (res.ok) {
        const autopsyData = await res.json();
        setLatestAutopsy({
          tradeId: trade.id,
          instrument: trade.instrument,
          direction: trade.direction,
          pnl: trade.pnl,
          rMultiple: trade.rMultiple,
          status: trade.status,
          verdictBadge: autopsyData.verdictBadge,
          whyWinOrLose: autopsyData.whyWinOrLose,
          entryTimingAnalysis: autopsyData.entryTimingAnalysis,
          confirmationsPresent: autopsyData.confirmationsPresent || [],
          confirmationsMissed: autopsyData.confirmationsMissed || [],
          keyLesson: autopsyData.keyLesson,
          optimalSetup: autopsyData.optimalSetup,
        });
      }
    } catch (_e) {
      // Handled gracefully
    } finally {
      setIsGeneratingAutopsy(false);
    }
  };

  // AI Auto-Mark Chart Request
  const handleRunAiAutoMark = async (overrideLang?: AiCoachLanguage) => {
    setIsAiMarking(true);
    setShowAiFloatingCard(true);
    const langToUse = overrideLang || aiLanguage;

    try {
      const res = await fetch('/api/ai/auto-mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instrument: symbol,
          timeframe,
          visibleCandles: visibleCandles.slice(-60),
          indicators: indicators.filter((i) => i.visible).map((i) => i.name),
          language: langToUse,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const setup: AiAutoMarkOverlay = {
          direction: data.direction === 'SELL' ? 'SELL' : 'BUY',
          setupName: data.setupName,
          entryPrice: Number(data.entryPrice),
          stopLoss: Number(data.stopLoss),
          takeProfit: Number(data.takeProfit),
          rrRatio: Number(data.rrRatio || 3.0),
          confidenceLabel: data.confidenceLabel,
          marketStructureSummary: data.marketStructureSummary,
          confirmations: data.confirmations || [],
          stepByStepGuide: data.stepByStepGuide || '',
          invalidationWarning: data.invalidationWarning,
          visualMarkers: data.visualMarkers || [],
        };
        setAiAutoMark(setup);
        showToast(`✨ AI ${setup.direction} Setup Marked on Chart!`, 'emerald');
      }
    } catch (_e) {
      showToast('Unable to run AI Auto-Mark right now.', 'crimson');
    } finally {
      setIsAiMarking(false);
    }
  };

  // Dynamic Scan & Source New Live Methods
  const handleScanNewLiveMethods = () => {
    setIsScanningNewMethods(true);
    setTimeout(() => {
      const fresh = findAiTechniqueSetups(allCandles, symbol, timeframe);
      setDiscoveredSetups(fresh);
      setIsScanningNewMethods(false);
      showToast('🔥 AI scanned live market and discovered new institutional setups!', 'emerald');
    }, 800);
  };

  // Jump History Helper
  const handleJumpHistory = (candlesBackFromLive: number) => {
    setIsPlaying(false);
    if (candlesBackFromLive <= 0) {
      setIsReplayMode(false);
      setReplayIndex(allCandles.length - 1);
      showToast('🟢 Switched to Sub-Second Live Market Feed', 'emerald');
    } else {
      setIsReplayMode(true);
      const targetIdx = Math.max(40, allCandles.length - 1 - candlesBackFromLive);
      setReplayIndex(targetIdx);
      showToast(`Cut & Rewound ${candlesBackFromLive} candles into 3-month history!`, 'emerald');
    }
  };

  // Handle Cut Bar Click on Chart
  const handleSelectReplayCutTime = (unixTime: number) => {
    const idx = allCandles.findIndex((c) => c.time >= unixTime);
    if (idx >= 20) {
      const removedCount = allCandles.length - 1 - idx;
      setIsReplayMode(true);
      setReplayIndex(idx);
      setIsReplayCutMode(false);
      setIsPlaying(false);
      showToast(
        `✂ Cut & Removed ${removedCount} Future Candles! Press PLAY (▶) or +1 Bar to Backtest.`,
        'emerald'
      );
    }
  };

  const toggleIndicator = (id: string) => {
    setIndicators((prev) => prev.map((item) => (item.id === id ? { ...item, visible: !item.visible } : item)));
  };

  const toggleFullWindowChart = () => {
    setIsFullWindowChart((prev) => {
      const next = !prev;
      if (next && !document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else if (!next && document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
      return next;
    });
  };

  // Live Floating P&L of Active Position
  const livePositionPnl = (() => {
    if (!activePosition || activePosition.status !== 'OPEN') return 0;
    const diff =
      activePosition.direction === 'LONG'
        ? currentPrice - activePosition.entryPrice
        : activePosition.entryPrice - currentPrice;
    return Number((diff * activePosition.units).toFixed(2));
  })();

  const livePositionR = (() => {
    if (!activePosition || activePosition.status !== 'OPEN') return 0;
    const slDist = Math.max(0.0001, Math.abs(activePosition.entryPrice - activePosition.stopLoss));
    const diff =
      activePosition.direction === 'LONG'
        ? currentPrice - activePosition.entryPrice
        : activePosition.entryPrice - currentPrice;
    return Number((diff / slDist).toFixed(2));
  })();

  const filteredSetups =
    strategyLabCategory === 'ALL'
      ? discoveredSetups
      : discoveredSetups.filter((s) => s.category.toUpperCase().includes(strategyLabCategory));

  return (
    <div
      className={`${
        isFullWindowChart ? 'fixed inset-0 z-50' : 'h-screen w-screen'
      } overflow-hidden bg-[#131722] text-[#D1D4DC] flex flex-col select-none`}
    >
      {/* Top Toast Notification */}
      {toastBanner && (
        <div
          className={`fixed top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg border shadow-2xl text-xs font-bold flex items-center gap-2 ${
            toastBanner.tone === 'emerald'
              ? 'bg-[#089981] border-[#00E676] text-white'
              : toastBanner.tone === 'crimson'
              ? 'bg-[#F23645] border-[#FF5252] text-white'
              : 'bg-[#2962FF] border-[#60A5FA] text-white'
          }`}
        >
          <span>{toastBanner.text}</span>
          <button type="button" onClick={() => setToastBanner(null)} className="opacity-80 hover:opacity-100 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. COMPACT TRADINGVIEW TOP BAR */}
      <header className="h-[42px] shrink-0 bg-[#131722] border-b border-[#2A2E39] px-2 flex items-center justify-between gap-1 overflow-x-auto">
        <div className="flex items-center gap-1 shrink-0">
          {/* Real Pair Selector (Guaranteed never disappears) */}
          <div className="flex items-center gap-1 pr-2 border-r border-[#2A2E39]">
            {(['BTC/USD', 'XAU/USD'] as SupportedSymbol[]).map((sym) => {
              const active = symbol === sym;
              return (
                <button
                  key={sym}
                  type="button"
                  onClick={() => handleSelectSymbol(sym)}
                  className={`px-2.5 py-1 rounded text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                    active
                      ? 'bg-[#2962FF] text-white shadow-md shadow-[#2962FF]/30'
                      : 'text-[#B2B5BE] hover:bg-[#2A2E39] hover:text-white'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-[#00E676]' : 'bg-[#787B86]'}`} />
                  <span>{sym === 'XAU/USD' ? 'XAU/USD GOLD' : 'BTC/USD'}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-Second Live WebSocket Stream Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#181C27] border border-[#2A2E39] font-mono text-xs shadow-inner">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                liveWsStatus === 'CONNECTED' ? 'bg-[#00E676] animate-pulse ring-2 ring-[#00E676]/40' : 'bg-[#FF9100]'
              }`}
            />
            <span className="text-[#94A3B8] text-[10px] hidden sm:inline">
              {symbol === 'XAU/USD' ? '⚡ COMEX GOLD LIVE:' : '⚡ BINANCE BTC LIVE:'}
            </span>
            <span
              className={`font-extrabold font-mono transition-colors duration-150 text-xs sm:text-sm ${
                livePriceFlash === 'up' ? 'text-[#00E676]' : livePriceFlash === 'down' ? 'text-[#F23645]' : 'text-white'
              }`}
            >
              {currentPrice.toFixed(decimals)}
            </span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-[9px] text-[#00E676] font-bold">REALTIME</span>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-0.5 px-1 border-r border-[#2A2E39]">
            {BRAND_CONFIG.timeframes.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                  timeframe === tf
                    ? 'text-[#2962FF] bg-[#2962FF]/15 font-bold'
                    : 'text-[#B2B5BE] hover:bg-[#2A2E39] hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Style Selector */}
          <div className="flex items-center px-1 border-r border-[#2A2E39]">
            <CandlestickChart className="w-3.5 h-3.5 text-[#B2B5BE] mr-1" />
            <select
              aria-label="Chart visual type"
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartVisualType)}
              className="bg-transparent text-xs font-medium text-[#D1D4DC] focus:outline-none cursor-pointer pr-1"
            >
              <option value="candlestick" className="bg-[#1E222D]">Candles</option>
              <option value="hollow" className="bg-[#1E222D]">Hollow Candles</option>
              <option value="heikin" className="bg-[#1E222D]">Heikin Ashi</option>
              <option value="line" className="bg-[#1E222D]">Line</option>
              <option value="area" className="bg-[#1E222D]">Area</option>
              <option value="baseline" className="bg-[#1E222D]">Baseline</option>
            </select>
          </div>

          {/* Indicators Modal Trigger */}
          <div className="flex items-center px-1 border-r border-[#2A2E39]">
            <button
              type="button"
              onClick={() => setShowIndicatorModal(true)}
              className="px-2 py-1 rounded hover:bg-[#2A2E39] text-xs font-medium text-[#D1D4DC] flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-[#2962FF]" />
              <span>Indicators</span>
              <span className="px-1.5 py-0.2 rounded bg-[#2A2E39] text-[10px] font-mono text-[#00E676]">
                {indicators.filter((i) => i.visible).length}
              </span>
            </button>
          </div>

          {/* AI Strategy & Method Finder Lab Button */}
          <div className="flex items-center px-1 border-r border-[#2A2E39]">
            <button
              type="button"
              onClick={() => setShowAiStrategyLab(true)}
              className="px-2.5 py-1 rounded bg-[#AB47BC]/20 hover:bg-[#AB47BC] text-[#E1BEE7] hover:text-white border border-[#AB47BC]/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-[#FFB300]" />
              <span>🧠 AI Method Finder</span>
            </button>
          </div>

          {/* AI Smart Prediction Scanner & Auto-Pilot Toggle */}
          <div className="flex items-center px-1 border-r border-[#2A2E39]">
            <button
              type="button"
              onClick={() => {
                setIsAiPredictorActive((prev) => !prev);
                showToast(
                  !isAiPredictorActive
                    ? '⚡ AI Institutional Market Prediction Scanner: ACTIVE (Will alert on A+ setups)'
                    : 'AI Prediction Scanner: PAUSED',
                  !isAiPredictorActive ? 'emerald' : 'blue'
                );
              }}
              className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isAiPredictorActive
                  ? 'bg-[#00E676]/20 border-[#00E676] text-[#00E676] animate-pulse'
                  : 'bg-[#1E222D] border-[#2A2E39] text-[#94A3B8] hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-[#FFB300]" />
              <span>{isAiPredictorActive ? 'AI Predictor (LIVE ON)' : 'AI Predictor (OFF)'}</span>
            </button>
          </div>

          {/* AI Language Selector + AI Auto-Mark Current Chart Button */}
          <div className="flex items-center gap-1 pl-1">
            <div className="flex items-center bg-[#1E222D] border border-[#2A2E39] rounded px-1.5 py-0.5">
              <Globe className="w-3.5 h-3.5 text-[#00E676] mr-1" />
              <select
                aria-label="AI Coach Language"
                value={aiLanguage}
                onChange={(e) => {
                  const newLang = e.target.value as AiCoachLanguage;
                  setAiLanguage(newLang);
                  if (aiAutoMark) {
                    handleRunAiAutoMark(newLang);
                  }
                }}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="bn" className="bg-[#1E222D]">বাংলা (Bengali)</option>
                <option value="banglish" className="bg-[#1E222D]">Banglish</option>
                <option value="en" className="bg-[#1E222D]">English</option>
                <option value="hi" className="bg-[#1E222D]">हिन्दी (Hindi)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => handleRunAiAutoMark()}
              disabled={isAiMarking}
              className="px-3 py-1 rounded bg-gradient-to-r from-[#2962FF] to-[#00B0FF] hover:opacity-95 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAiMarking ? 'AI বিশ্লেষণ করছে...' : '✨ AI Auto-Mark Chart'}</span>
            </button>
          </div>
        </div>

        {/* Right: Order Ticket Flyout Toggle + Equity + Account */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setShowOrderTicketFlyout((v) => !v);
              if (!showOrderTicketFlyout && !draftOrder) {
                handleStartDraftOrder('LONG');
              }
            }}
            className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
              showOrderTicketFlyout
                ? 'bg-[#089981] border-[#00E676] text-white'
                : 'bg-[#1E222D] border-[#2A2E39] text-[#D1D4DC] hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#00E676]" />
            <span>Exness Order Ticket</span>
          </button>

          {/* Subscription / 24-Hour Free Trial Status Button */}
          {onOpenSubscriptionModal && (
            <button
              type="button"
              onClick={onOpenSubscriptionModal}
              className="px-2.5 py-1 rounded text-xs font-bold font-mono flex items-center gap-1.5 border transition-all cursor-pointer bg-[#2962FF]/15 hover:bg-[#2962FF]/30 border-[#2962FF]/50 text-[#38BDF8]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFB300]" />
              <span>
                {userSubscription?.status === 'ACTIVE_SUBSCRIBED'
                  ? '★ Pro Active'
                  : userSubscription?.status === 'PENDING_APPROVAL'
                  ? '⏳ Pending Admin'
                  : userSubscription?.status === 'TRIAL_ACTIVE'
                  ? '⏳ 24h Trial'
                  : 'Upgrade Pro ($8)'}
              </span>
            </button>
          )}

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1E222D] border border-[#2A2E39] text-xs font-mono">
            <span className="text-[#787B86]">Equity:</span>
            <span className="font-bold text-[#00E676]">
              ${(profile.virtualBalance + livePositionPnl).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* User Profile & Account Settings Button */}
          <button
            type="button"
            onClick={() => setShowUserProfileModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-[#1E222D] hover:bg-[#2A2E39] border border-[#2A2E39] hover:border-[#00E5FF]/40 text-xs font-medium text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="User Profile & Account Settings"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#2962FF] to-[#00E5FF] flex items-center justify-center text-[10px] font-bold text-white font-mono shadow">
              {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="hidden sm:inline font-mono text-[11px] max-w-[110px] truncate text-slate-200">
              {profile.displayName || profile.email?.split('@')[0] || 'Profile'}
            </span>
          </button>

          {/* Connect Google button if in sandbox */}
          {isDemoSandbox && onGoogleLogin && (
            <button
              type="button"
              onClick={onGoogleLogin}
              className="px-2.5 py-1.5 rounded-lg bg-[#2962FF]/20 hover:bg-[#2962FF]/40 border border-[#2962FF]/40 text-[11px] font-semibold text-[#60A5FA] hover:text-white cursor-pointer transition-colors"
            >
              Sync Google
            </button>
          )}

          {/* HIGH-VISIBILITY, UNMISSABLE "LOG OUT OF ACCOUNT" BUTTON */}
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              title="Log Out of Account / Exit to Homepage"
              className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 border border-rose-500/50 hover:border-rose-600 text-rose-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400 group-hover:text-white" />
              <span className="hidden sm:inline">Log Out Account</span>
              <span className="sm:hidden">Log Out</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. UNIFIED REAL CHART WORKSPACE */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          <div className="flex-1 relative min-h-0">
            <TradingChart
              symbol={symbol}
              timeframe={timeframe}
              candles={visibleCandles}
              totalAvailableCandles={allCandles.length}
              chartType={chartType}
              indicators={indicators}
              onToggleIndicator={toggleIndicator}
              entryPrice={activePosition ? activePosition.entryPrice : null}
              stopLoss={activePosition ? activePosition.stopLoss : null}
              takeProfit={activePosition ? activePosition.takeProfit : null}
              tradeDirection={activePosition ? activePosition.direction : tradeDirection}
              hasActiveTrade={Boolean(activePosition && activePosition.status === 'OPEN')}
              isPendingOrder={Boolean(activePosition && activePosition.status === 'PENDING_FILL')}
              activeTradePnl={livePositionPnl}
              activeTradeR={livePositionR}
              lotSize={activePosition ? activePosition.lotSize : lotSize}
              contractUnits={activePosition ? activePosition.units : getContractUnits(symbol, lotSize)}
              onChangeLotSize={setLotSize}
              onUpdateEntryPrice={handleChartUpdateEntryPrice}
              onUpdateStopLoss={handleChartUpdateStopLoss}
              onUpdateTakeProfit={handleChartUpdateTakeProfit}
              onMoveToBreakeven={handleMoveToBreakeven}
              onPartialClose50={handlePartialClose50}
              onReversePosition={handleReversePosition}
              onClosePosition={() =>
                activePosition?.status === 'OPEN'
                  ? finalizeClosePosition(currentPrice, 'CLOSED_MANUAL')
                  : setActivePosition(null)
              }
              // Exness Draft Order Bracket
              draftOrder={draftOrder}
              onStartDraftOrder={handleStartDraftOrder}
              onUpdateDraftSl={handleUpdateDraftSl}
              onUpdateDraftTp={handleUpdateDraftTp}
              onUpdateDraftEntry={handleUpdateDraftEntry}
              onConfirmDraftOrder={handleConfirmDraftOrder}
              onCancelDraftOrder={handleCancelDraftOrder}
              onQuickOrder={(dir) => handleStartDraftOrder(dir)}
              aiAutoMark={aiAutoMark}
              onApplyAiSetup={(setup) => executeOrder(undefined, true, setup)}
              onExecuteAiSetupNow={(setup) => executeOrder(undefined, true, setup)}
              onClearAiAutoMark={() => setAiAutoMark(null)}
              isReplayCutMode={isReplayCutMode}
              onToggleReplayCutMode={() => setIsReplayCutMode((v) => !v)}
              onSelectReplayCutTime={handleSelectReplayCutTime}
              isFullWindowChart={isFullWindowChart}
              onToggleFullWindowChart={toggleFullWindowChart}
              showHighImpactSmc={showHighImpactSmc}
              onToggleHighImpactSmc={() => setShowHighImpactSmc((v) => !v)}
              showLessonsMode={showLessonsMode}
              onToggleLessonsMode={() => setShowLessonsMode((v) => !v)}
              lessons={historicalLessons}
              activeLesson={activeLesson}
              onSelectLesson={setActiveLesson}
              onCloseLesson={() => setActiveLesson(null)}
              onReplayFromLesson={handleReplayFromLesson}
              aiLanguage={aiLanguage}
              confirmationCircles={deepBacktestReport?.circles || []}
              showConfirmationCircles={showConfirmationCircles}
              onToggleConfirmationCircles={() => setShowConfirmationCircles((v) => !v)}
              showPerfectEntrySymbols={showPerfectEntrySymbols}
              onTogglePerfectEntrySymbols={() => setShowPerfectEntrySymbols((v) => !v)}
              onSelectConfirmationCircle={(circle) => {
                setActiveConfirmationCircle(circle);
                setIsTeacherModalOpen(true);
              }}
              onOpenAutoBacktestReport={() => {
                setIsTeacherModalOpen(true);
              }}
              onOpenPairPlaybook={() => {
                setIsTeacherModalOpen(true);
              }}
              onInspectCandle={(candle, idx) => {
                const s = AiBacktestTeacherEngine.analyzeCandleSymptomAndBehavior(
                  candle,
                  idx > 0 ? allCandles[idx - 1] : null,
                  idx,
                  allCandles,
                  symbol,
                  timeframe,
                  aiLanguage
                );
                setInspectedCandleSymptom(s);
                setIsTeacherModalOpen(true);
              }}
            />

            {/* AI SMART PREDICTION 10-SECOND RADAR ALERT MODAL */}
            {aiPredictionAlert && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 w-[420px] max-w-[92vw] bg-[#1E222D]/98 border-2 border-[#00E676] rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-bounce-subtle select-none">
                <div className="flex items-center justify-between border-b border-[#2A2E39] pb-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#00E676] animate-ping" />
                    <span className="font-extrabold text-white text-xs tracking-wider uppercase">
                      ⚡ AI High-Confluence Prediction
                    </span>
                  </div>
                  <div className="px-2.5 py-1 rounded bg-[#00E676]/20 text-[#00E676] font-mono font-bold text-xs">
                    00:{predictionCountdown.toString().padStart(2, '0')}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-extrabold text-xs text-white ${
                        aiPredictionAlert.direction === 'BUY' ? 'bg-[#089981]' : 'bg-[#F23645]'
                      }`}
                    >
                      {aiPredictionAlert.direction} {symbol}
                    </span>
                    <span className="text-[#94A3B8] font-mono">
                      Target 1:{aiPredictionAlert.rrRatio} R:R ({aiPredictionAlert.confidence}% Confluence)
                    </span>
                  </div>

                  <div className="font-bold text-white text-xs">{aiPredictionAlert.strategyName}</div>

                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded bg-[#131722] border border-[#2A2E39] font-mono text-[11px]">
                    <div>
                      <div className="text-[9px] text-[#787B86]">ENTRY</div>
                      <div className="font-bold text-[#60A5FA]">{aiPredictionAlert.entryPrice.toFixed(decimals)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#787B86]">STOP LOSS</div>
                      <div className="font-bold text-[#F23645]">{aiPredictionAlert.stopLoss.toFixed(decimals)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#787B86]">TAKE PROFIT</div>
                      <div className="font-bold text-[#00E676]">{aiPredictionAlert.takeProfit.toFixed(decimals)}</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-[#00E676] font-bold">✓ Multi-Factor Institutional Confluence:</div>
                    {aiPredictionAlert.reasons.map((r, i) => (
                      <div key={i} className="text-[11px] text-[#D1D4DC] flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#00E676] shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const pred = aiPredictionAlert;
                        setAiPredictionAlert(null);
                        executeOrder(
                          pred.direction === 'BUY' ? 'LONG' : 'SHORT',
                          true,
                          undefined,
                          pred.stopLoss,
                          pred.takeProfit,
                          pred.entryPrice,
                          pred.lotSize
                        );
                      }}
                      className="flex-1 py-2 rounded-lg bg-[#00E676] hover:bg-[#00C853] text-slate-950 font-extrabold text-xs cursor-pointer shadow-lg"
                    >
                      Execute Trade Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiPredictionAlert(null)}
                      className="px-3 py-2 rounded-lg bg-[#2A2E39] hover:bg-[#363A45] text-white text-xs font-bold cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* FLOATING ORDER TICKET FLYOUT */}
            {showOrderTicketFlyout && (
              <div className="absolute top-14 right-[84px] z-30 w-[290px] rounded-xl bg-[#181C27]/95 backdrop-blur-md border border-[#2A2E39] shadow-2xl p-3 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-[#2A2E39] pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#00E676]" />
                    <span>Exness Order Execution</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowOrderTicketFlyout(false)}
                    className="text-[#787B86] hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleStartDraftOrder('SHORT')}
                    className={`p-2 rounded border text-left cursor-pointer transition-all ${
                      tradeDirection === 'SHORT'
                        ? 'bg-[#F23645] border-[#FF5252] text-white'
                        : 'bg-[#F23645]/15 border-[#F23645]/40 text-[#F23645]'
                    }`}
                  >
                    <div className="text-[10px] font-bold">SELL</div>
                    <div className="text-sm font-extrabold font-mono text-white">{bidPrice.toFixed(decimals)}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartDraftOrder('LONG')}
                    className={`p-2 rounded border text-left cursor-pointer transition-all ${
                      tradeDirection === 'LONG'
                        ? 'bg-[#089981] border-[#00E676] text-white'
                        : 'bg-[#089981]/15 border-[#089981]/40 text-[#00E676]'
                    }`}
                  >
                    <div className="text-[10px] font-bold">BUY</div>
                    <div className="text-sm font-extrabold font-mono text-white">{askPrice.toFixed(decimals)}</div>
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#787B86] block">Lot Size</label>
                  <div className="flex items-center gap-1">
                    {[0.1, 0.5, 1.0, 2.0].map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLotSize(l)}
                        className={`flex-1 py-1 rounded text-xs font-mono font-bold cursor-pointer ${
                          lotSize === l ? 'bg-[#2962FF] text-white' : 'bg-[#131722] text-[#787B86] hover:text-white'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleStartDraftOrder(tradeDirection)}
                    className="w-full py-2 rounded-lg bg-[#2962FF] hover:bg-[#1E4BD8] text-white font-bold cursor-pointer shadow-lg"
                  >
                    Adjust SL / TP on Chart
                  </button>
                </div>
              </div>
            )}

            {/* FLOATING AI COACH & DIAGNOSIS CARD */}
            {showAiFloatingCard && (
              <div className="absolute top-14 left-14 z-30 w-[360px] max-w-[85vw] max-h-[75vh] overflow-y-auto rounded-xl bg-[#181C27]/98 backdrop-blur-md border border-[#2A2E39] shadow-2xl p-3.5 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-[#2A2E39] pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00E676]" />
                    <span className="font-bold text-white text-sm">AI ট্রেডিং মেন্টর</span>
                    <span className="px-1.5 py-0.2 rounded bg-[#2962FF]/20 text-[#60A5FA] font-mono text-[10px]">
                      {aiLanguage.toUpperCase()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAiFloatingCard(false)}
                    className="text-[#787B86] hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {isAiMarking && (
                  <div className="py-6 text-center font-mono text-[#60A5FA]">
                    AI চার্টের ক্যান্ডেল এবং অর্ডার ব্লক বিশ্লেষণ করছে...
                  </div>
                )}

                {/* AI Auto-Mark Setup Details */}
                {aiAutoMark && !isAiMarking && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                          aiAutoMark.direction === 'BUY'
                            ? 'bg-[#089981]/25 text-[#00E676]'
                            : 'bg-[#F23645]/25 text-[#F23645]'
                        }`}
                      >
                        🎯 AI {aiAutoMark.direction} SETUP
                      </span>
                      <span className="font-mono font-bold text-[#00E676]">1 : {aiAutoMark.rrRatio} R:R</span>
                    </div>

                    <div className="font-bold text-white text-sm">{aiAutoMark.setupName}</div>

                    <div className="grid grid-cols-3 gap-1.5 p-2 rounded bg-[#131722] border border-[#2A2E39] font-mono text-[11px]">
                      <div>
                        <div className="text-[9px] text-[#787B86]">ENTRY</div>
                        <div className="font-bold text-[#60A5FA]">{aiAutoMark.entryPrice.toFixed(decimals)}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-[#787B86]">STOP LOSS</div>
                        <div className="font-bold text-[#F23645]">{aiAutoMark.stopLoss.toFixed(decimals)}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-[#787B86]">TAKE PROFIT</div>
                        <div className="font-bold text-[#00E676]">{aiAutoMark.takeProfit.toFixed(decimals)}</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] font-mono uppercase text-[#00E676] font-bold">
                        ✓ চার্ট কনফার্মেশনসমূহ:
                      </div>
                      {aiAutoMark.confirmations.map((c, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[11px] text-[#D1D4DC]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00E676] shrink-0 mt-0.5" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-2 rounded bg-[#131722] border border-[#2A2E39] text-[11px] text-white leading-relaxed">
                      {aiAutoMark.stepByStepGuide}
                    </div>

                    <button
                      type="button"
                      onClick={() => executeOrder(undefined, true, aiAutoMark)}
                      className="w-full py-2 rounded-lg bg-[#089981] hover:bg-[#067F6B] text-white font-bold cursor-pointer shadow-lg"
                    >
                      এই AI সেটআপে এখনই ট্রেড নিন (Execute Trade)
                    </button>
                  </div>
                )}

                {/* Post-Trade Forensic Autopsy */}
                {isGeneratingAutopsy && (
                  <div className="py-4 text-center font-mono text-[#94A3B8]">
                    ট্রেডটি কেন লাভ বা লস হলো তা বিশ্লেষণ করা হচ্ছে...
                  </div>
                )}

                {latestAutopsy && !isGeneratingAutopsy && (
                  <div className="space-y-2.5 pt-2 border-t border-[#2A2E39]">
                    <div
                      className={`px-2 py-1 rounded font-mono font-bold text-[11px] ${
                        latestAutopsy.pnl >= 0
                          ? 'bg-[#089981]/20 text-[#00E676]'
                          : 'bg-[#F23645]/20 text-[#F23645]'
                      }`}
                    >
                      {latestAutopsy.verdictBadge}
                    </div>
                    <p className="text-[11px] text-white leading-relaxed">{latestAutopsy.whyWinOrLose}</p>

                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-[#00E676] font-bold">✓ সঠিক কনফার্মেশন:</div>
                      {latestAutopsy.confirmationsPresent.map((item, i) => (
                        <div key={i} className="text-[11px] text-[#D1D4DC] flex items-start gap-1">
                          <span>•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>

                    {latestAutopsy.confirmationsMissed.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-[#F23645] font-bold">✕ ভুল / মিস হওয়া বিষয়:</div>
                        {latestAutopsy.confirmationsMissed.map((item, i) => (
                          <div key={i} className="text-[11px] text-[#D1D4DC] flex items-start gap-1">
                            <span>•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="p-2 rounded bg-[#131722] border border-[#2A2E39] text-[11px] text-[#F59E0B]">
                      💡 {latestAutopsy.keyLesson}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TRADINGVIEW FLOATING BAR REPLAY CONTROLLER BAR */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 bg-[#1E222D]/95 backdrop-blur-md border border-[#2A2E39] rounded-xl shadow-2xl px-3 py-1.5 flex items-center gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setIsReplayCutMode((v) => !v)}
                title="Click any candle on the chart to cut & remove all candles after it"
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                  isReplayCutMode
                    ? 'bg-[#2962FF] text-white shadow-lg shadow-[#2962FF]/40'
                    : 'bg-[#131722] text-[#00E676] hover:bg-[#2A2E39]'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>{isReplayCutMode ? 'Click Chart to Cut!' : '✂ Select & Cut Chart'}</span>
              </button>

              <select
                aria-label="Rewind history"
                value=""
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!Number.isNaN(val)) handleJumpHistory(val);
                }}
                className="bg-[#131722] text-[#D1D4DC] px-2 py-1 rounded-lg border border-[#2A2E39] text-[11px] cursor-pointer"
              >
                <option value="" disabled>
                  ⏪ Quick Cut...
                </option>
                <option value="1200">-90 Days (3M)</option>
                <option value="800">-60 Days (2M)</option>
                <option value="400">-30 Days (1M)</option>
                <option value="120">-7 Days</option>
                <option value="45">-1 Day</option>
                <option value="0">🟢 Live Real-Time Feed</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  if (!isReplayMode) {
                    setIsReplayMode(true);
                    setReplayIndex(Math.max(100, allCandles.length - 120));
                  }
                  setIsPlaying((p) => !p);
                }}
                title="Play / Pause Replay (Spacebar)"
                className={`px-3.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  isPlaying ? 'bg-[#F59E0B] text-slate-950' : 'bg-[#089981] hover:bg-[#067F6B] text-white'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setIsReplayMode(true);
                  setReplayIndex((i) => Math.min(allCandles.length - 1, i + 1));
                }}
                title="Forward +1 Candle (Right Arrow →)"
                className="px-2.5 py-1 rounded-lg bg-[#131722] hover:bg-[#2A2E39] text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+1</span>
              </button>

              <select
                aria-label="Replay speed"
                value={replaySpeed}
                onChange={(e) => setReplaySpeed(Number(e.target.value))}
                className="bg-[#131722] text-white px-1.5 py-1 rounded-lg border border-[#2A2E39] text-[11px] cursor-pointer"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={3}>3x</option>
                <option value={5}>5x</option>
                <option value={10}>10x</option>
              </select>

              <input
                type="range"
                min={30}
                max={Math.max(31, allCandles.length - 1)}
                value={isReplayMode ? replayIndex : allCandles.length - 1}
                onChange={(e) => {
                  setIsPlaying(false);
                  setIsReplayMode(true);
                  setReplayIndex(Number(e.target.value));
                }}
                className="w-24 sm:w-40 accent-[#2962FF] cursor-pointer h-1.5 bg-[#131722] rounded-lg"
              />

              {isReplayMode && replayIndex < allCandles.length - 1 && (
                <button
                  type="button"
                  onClick={() => handleJumpHistory(0)}
                  title="Restore all removed candles & return to Live Stream"
                  className="px-2 py-1 rounded-lg bg-[#2962FF]/20 text-[#60A5FA] hover:bg-[#2962FF] hover:text-white font-bold text-[11px] cursor-pointer"
                >
                  Restore Live
                </button>
              )}
            </div>
          </div>

          {/* COLLAPSIBLE BOTTOM POSITIONS & HISTORY DRAWER */}
          {bottomDrawerOpen && (
            <div className="h-44 shrink-0 bg-[#131722] border-t border-[#2A2E39] flex flex-col z-20">
              <div className="h-8 bg-[#181C27] border-b border-[#2A2E39] px-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setBottomTab('POSITIONS')}
                    className={`h-8 font-bold border-b-2 transition-colors cursor-pointer ${
                      bottomTab === 'POSITIONS'
                        ? 'border-[#2962FF] text-white'
                        : 'border-transparent text-[#787B86] hover:text-white'
                    }`}
                  >
                    Open Positions ({activePosition ? 1 : 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBottomTab('HISTORY')}
                    className={`h-8 font-bold border-b-2 transition-colors cursor-pointer ${
                      bottomTab === 'HISTORY'
                        ? 'border-[#2962FF] text-white'
                        : 'border-transparent text-[#787B86] hover:text-white'
                    }`}
                  >
                    Trade History ({trades.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setBottomDrawerOpen(false)}
                  className="text-[#787B86] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 text-xs font-mono">
                {bottomTab === 'POSITIONS' ? (
                  activePosition ? (
                    <div className="p-2.5 rounded bg-[#1E222D] border border-[#2A2E39] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-white ${
                            activePosition.direction === 'LONG' ? 'bg-[#089981]' : 'bg-[#F23645]'
                          }`}
                        >
                          {activePosition.direction} {activePosition.lotSize} Lots
                        </span>
                        <span className="font-bold text-white">{activePosition.instrument}</span>
                        <span>Entry: {activePosition.entryPrice.toFixed(decimals)}</span>
                        <span className="text-[#F23645]">SL: {activePosition.stopLoss.toFixed(decimals)}</span>
                        <span className="text-[#00E676]">TP: {activePosition.takeProfit.toFixed(decimals)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-extrabold ${
                            livePositionPnl >= 0 ? 'text-[#00E676]' : 'text-[#F23645]'
                          }`}
                        >
                          {livePositionPnl >= 0 ? '+' : ''}${livePositionPnl.toFixed(2)} ({livePositionR}R)
                        </span>
                        <button
                          type="button"
                          onClick={handleMoveToBreakeven}
                          className="px-2 py-1 rounded bg-[#2962FF]/20 text-[#60A5FA] font-bold cursor-pointer"
                        >
                          SL → BE
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            activePosition.status === 'OPEN'
                              ? finalizeClosePosition(currentPrice, 'CLOSED_MANUAL')
                              : setActivePosition(null)
                          }
                          className="px-2.5 py-1 rounded bg-[#F23645] text-white font-bold cursor-pointer"
                        >
                          Close Position
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[#787B86]">
                      No open position. Click BUY (ORDER) or SELL (ORDER) on the chart to position SL & TP.
                    </div>
                  )
                ) : (
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="text-[#787B86] border-b border-[#2A2E39]">
                        <th className="py-1 px-2">Symbol</th>
                        <th className="py-1 px-2">Side</th>
                        <th className="py-1 px-2">Lots</th>
                        <th className="py-1 px-2">Entry → Exit</th>
                        <th className="py-1 px-2">P&L (R)</th>
                        <th className="py-1 px-2">Summary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((tr) => (
                        <tr key={tr.id} className="border-b border-[#1E222D] hover:bg-[#1E222D]/60">
                          <td className="py-1 px-2 font-bold text-white">{tr.instrument}</td>
                          <td className="py-1 px-2">{tr.direction}</td>
                          <td className="py-1 px-2">{tr.positionSize}</td>
                          <td className="py-1 px-2">
                            {tr.entryPrice} → {tr.exitPrice}
                          </td>
                          <td className={`py-1 px-2 font-bold ${tr.pnl >= 0 ? 'text-[#00E676]' : 'text-[#F23645]'}`}>
                            {tr.pnl >= 0 ? '+' : ''}${tr.pnl.toFixed(2)} ({tr.rMultiple}R)
                          </td>
                          <td className="py-1 px-2 text-[#94A3B8] truncate max-w-sm">{tr.aiReviewSummary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. SLIM BOTTOM STATUS BAR (DESKTOP) */}
      <footer className="h-[28px] shrink-0 bg-[#131722] border-t border-[#2A2E39] px-3 hidden md:flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setBottomDrawerOpen((v) => !v)}
            className="text-[#D1D4DC] hover:text-white font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Positions & Trade History ({trades.length})</span>
            {bottomDrawerOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>

          <span>
            Balance: <strong className="text-white">${profile.virtualBalance.toFixed(2)}</strong>
          </span>

          {activePosition && (
            <span>
              Floating P&L:{' '}
              <strong className={livePositionPnl >= 0 ? 'text-[#00E676]' : 'text-[#F23645]'}>
                {livePositionPnl >= 0 ? '+' : ''}${livePositionPnl.toFixed(2)} ({livePositionR}R)
              </strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[#787B86]">
          <span className="flex items-center gap-1 text-[10px]">
            <Radio className="w-3 h-3 text-[#00E676] animate-pulse" />
            <span className="text-[#00E676]">Binance Feed Connected</span>
          </span>
          <button
            type="button"
            onClick={() => setShowAiFloatingCard((v) => !v)}
            className="text-[#60A5FA] hover:underline font-bold cursor-pointer"
          >
            AI Coach ({aiLanguage.toUpperCase()})
          </button>
          <button
            type="button"
            onClick={() => {
              onUpdateBalance(10000, 90);
              showToast('Balance Reset to $10,000.00', 'blue');
            }}
            className="hover:text-white cursor-pointer"
          >
            Reset $10k
          </button>
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer ml-1"
              title="Log Out of Account"
            >
              <LogOut className="w-3 h-3" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </footer>

      {/* MOBILE BOTTOM ANALYSIS & ACTION BAR (FOR TOUCH SCREENS & MOBILE DEVICES) */}
      <div className="md:hidden shrink-0 bg-[#181C27] border-t border-[#2A2E39] px-2 py-1.5 flex items-center justify-between gap-1 z-30 select-none shadow-2xl">
        {/* Quick Pair Toggle */}
        <div className="flex items-center gap-1 bg-[#131722] p-0.5 rounded border border-[#2A2E39]">
          <button
            type="button"
            onClick={() => handleSelectSymbol('BTC/USD')}
            className={`px-2 py-1 rounded text-[11px] font-bold font-mono transition-all ${
              symbol === 'BTC/USD' ? 'bg-[#2962FF] text-white shadow' : 'text-[#94A3B8]'
            }`}
          >
            BTC
          </button>
          <button
            type="button"
            onClick={() => handleSelectSymbol('XAU/USD')}
            className={`px-2 py-1 rounded text-[11px] font-bold font-mono transition-all ${
              symbol === 'XAU/USD' ? 'bg-[#FFB300] text-black shadow' : 'text-[#94A3B8]'
            }`}
          >
            GOLD
          </button>
        </div>

        {/* Live Market vs Replay Mode Indicator Button */}
        <button
          type="button"
          onClick={() => {
            if (isReplayMode) {
              setIsReplayMode(false);
              setReplayIndex(allCandles.length - 1);
              showToast('Switched to Real Live Market', 'emerald');
            } else {
              setIsReplayMode(true);
              setReplayIndex(Math.max(100, allCandles.length - 120));
              showToast('Switched to Bar Replay', 'blue');
            }
          }}
          className={`px-1.5 py-1 rounded text-[10px] font-bold font-mono flex items-center gap-1 border transition-all ${
            !isReplayMode
              ? 'bg-emerald-500/20 text-[#00E676] border-emerald-500/40 animate-pulse'
              : 'bg-[#1E222D] text-[#94A3B8] border-[#2A2E39]'
          }`}
          title={!isReplayMode ? 'Live Market Stream Connected' : 'Click to Go Live'}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${!isReplayMode ? 'bg-[#00E676]' : 'bg-[#94A3B8]'}`} />
          <span>{!isReplayMode ? 'LIVE' : 'REPLAY'}</span>
        </button>

        {/* Timeframe Chips Carousel */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-[120px]">
          {(['1m', '5m', '15m', '1H', '4H', '1D'] as SupportedTimeframe[]).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 transition-colors ${
                timeframe === tf ? 'bg-[#2962FF] text-white' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Action Buttons: Fullscreen, Indicators, Mentor, Order */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleFullWindowChart}
            className="p-1.5 rounded bg-[#131722] hover:bg-[#2A2E39] border border-[#2A2E39] text-[#00E676]"
            title="Full Screen Chart"
          >
            {isFullWindowChart ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setShowIndicatorModal(true)}
            className="p-1.5 rounded bg-[#131722] hover:bg-[#2A2E39] border border-[#2A2E39] text-[#38BDF8]"
            title="Indicators"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsTeacherModalOpen(true)}
            className="px-2 py-1 rounded bg-[#AB47BC]/20 text-[#E1BEE7] border border-[#AB47BC]/40 text-[10px] font-bold flex items-center gap-1"
            title="Backtest Mentor"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#FFB300]" />
            <span className="hidden xs:inline">Mentor</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowOrderTicketFlyout((v) => !v);
              if (!showOrderTicketFlyout && !draftOrder) {
                handleStartDraftOrder('LONG');
              }
            }}
            className="px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-black text-[10px] font-extrabold flex items-center gap-1 shadow"
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>Order</span>
          </button>

          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="p-1.5 rounded bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/40"
              title="Log Out of Account"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. AI STRATEGY & SETUP LAB MODAL */}
      {showAiStrategyLab && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[88vh] rounded-2xl bg-[#1E222D] border border-[#2A2E39] shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#2A2E39] flex items-center justify-between bg-[#181C27]">
              <div className="flex items-center gap-2.5">
                <BrainCircuit className="w-5 h-5 text-[#FFB300]" />
                <div>
                  <h3 className="font-bold text-white text-sm">
                    AI Strategy & Setup Lab — Proven High-Probability Methods
                  </h3>
                  <p className="text-[11px] text-[#94A3B8]">
                    AI স্বয়ংক্রিয়ভাবে গত ৩ মাসের {symbol} চার্ট স্ক্যান করে হাই-উইনরেট স্ট্র্যাটেজি ও ক্যান্ডেলসহ বের করেছে
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleScanNewLiveMethods}
                  disabled={isScanningNewMethods}
                  className="px-3 py-1.5 rounded-lg bg-[#2962FF]/20 hover:bg-[#2962FF] text-[#60A5FA] hover:text-white border border-[#2962FF]/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanningNewMethods ? 'animate-spin' : ''}`} />
                  <span>{isScanningNewMethods ? 'স্ক্যানিং...' : '🔄 Scan Live for New Methods'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAiStrategyLab(false)}
                  className="text-[#787B86] hover:text-white p-1 rounded cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-5 py-2 border-b border-[#2A2E39] flex items-center gap-2 bg-[#131722] overflow-x-auto text-xs">
              {['ALL', 'ICT / SMC', 'FIBONACCI', 'LIQUIDITY', 'WYCKOFF'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setStrategyLabCategory(cat)}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    strategyLabCategory === cat
                      ? 'bg-[#2962FF] text-white shadow'
                      : 'bg-[#1E222D] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Setups Cards with Visual Candle Snapshots */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {filteredSetups.map((setup) => {
                const title = aiLanguage === 'en' ? setup.titleEn : setup.titleBn;
                const desc = aiLanguage === 'en' ? setup.descriptionEn : setup.descriptionBn;
                const checklist = aiLanguage === 'en' ? setup.confirmationChecklistEn : setup.confirmationChecklistBn;

                // Mini Candlestick Snapshot Canvas / SVG
                const slice = setup.candlesSlice;
                const minPrice = Math.min(...slice.map((c) => c.low));
                const maxPrice = Math.max(...slice.map((c) => c.high));
                const priceRange = maxPrice - minPrice || 1;

                return (
                  <div
                    key={setup.id}
                    className="p-4 rounded-xl bg-[#131722] border border-[#2A2E39] hover:border-[#2962FF] transition-all flex flex-col md:flex-row gap-4 shadow-xl"
                  >
                    {/* Left: Interactive Mini-Chart Snapshot Diagram */}
                    <div className="w-full md:w-[280px] shrink-0 bg-[#0E1118] border border-[#2A2E39] rounded-lg p-2.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#787B86] mb-1">
                        <span className="font-bold text-white">{setup.symbol}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold ${
                            setup.direction === 'BUY' ? 'bg-[#089981]/20 text-[#00E676]' : 'bg-[#F23645]/20 text-[#F23645]'
                          }`}
                        >
                          {setup.direction} SETUP
                        </span>
                      </div>

                      {/* SVG Candlestick Diagram */}
                      <div className="h-32 w-full relative my-1">
                        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 240 100">
                          {/* Grid background */}
                          <line x1="0" y1="25" x2="240" y2="25" stroke="#1E222D" strokeWidth="0.8" strokeDasharray="2 2" />
                          <line x1="0" y1="50" x2="240" y2="50" stroke="#1E222D" strokeWidth="0.8" strokeDasharray="2 2" />
                          <line x1="0" y1="75" x2="240" y2="75" stroke="#1E222D" strokeWidth="0.8" strokeDasharray="2 2" />

                          {/* Candlesticks */}
                          {slice.map((c, i) => {
                            const x = (i / (slice.length - 1)) * 220 + 10;
                            const isGreen = c.close >= c.open;
                            const topWickY = 100 - ((c.high - minPrice) / priceRange) * 85 - 5;
                            const botWickY = 100 - ((c.low - minPrice) / priceRange) * 85 - 5;
                            const bodyTopY = 100 - ((Math.max(c.open, c.close) - minPrice) / priceRange) * 85 - 5;
                            const bodyH = Math.max(
                              2,
                              ((Math.abs(c.close - c.open)) / priceRange) * 85
                            );

                            return (
                              <g key={i}>
                                <line
                                  x1={x}
                                  y1={topWickY}
                                  x2={x}
                                  y2={botWickY}
                                  stroke={isGreen ? '#089981' : '#F23645'}
                                  strokeWidth="1"
                                />
                                <rect
                                  x={x - 2.5}
                                  y={bodyTopY}
                                  width="5"
                                  height={bodyH}
                                  fill={isGreen ? '#089981' : '#F23645'}
                                />
                              </g>
                            );
                          })}

                          {/* Entry, SL & TP Guide Lines */}
                          <line x1="0" y1="48" x2="240" y2="48" stroke="#2962FF" strokeWidth="1.2" strokeDasharray="3 2" />
                          <line x1="0" y1="22" x2="240" y2="22" stroke="#00E676" strokeWidth="1.2" strokeDasharray="3 2" />
                          <line x1="0" y1="78" x2="240" y2="78" stroke="#F23645" strokeWidth="1.2" strokeDasharray="3 2" />
                        </svg>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-[#94A3B8]">
                        <span>Entry: {setup.entryPrice}</span>
                        <span className="text-[#00E676]">1:{setup.avgRR} R:R</span>
                      </div>
                    </div>

                    {/* Right: Rules, Checklist & Backtest Metrics */}
                    <div className="flex-1 flex flex-col justify-between space-y-2.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-white">{title}</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#FFB300]/20 text-[#FFB300] font-mono text-xs font-bold">
                            {setup.category}
                          </span>
                        </div>
                        <p className="text-xs text-[#94A3B8] leading-relaxed">{desc}</p>
                      </div>

                      {/* Performance Metrics Badges */}
                      <div className="grid grid-cols-4 gap-2 p-2 rounded-lg bg-[#181C27] border border-[#2A2E39] font-mono text-center">
                        <div>
                          <div className="text-[10px] text-[#787B86]">WIN RATE</div>
                          <div className="text-sm font-extrabold text-[#00E676]">{setup.winRate}%</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#787B86]">TOTAL GAIN</div>
                          <div className="text-sm font-extrabold text-[#00E676]">+{setup.totalR}R</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#787B86]">PROFIT FACTOR</div>
                          <div className="text-sm font-extrabold text-white">{setup.profitFactor}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#787B86]">SAMPLED</div>
                          <div className="text-sm font-extrabold text-[#60A5FA]">{setup.tradesSampled} Trades</div>
                        </div>
                      </div>

                      {/* Confirmations Checklist */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-[#FFB300] uppercase font-bold">
                          ✓ স্ট্র্যাটেজি রুলস ও কনফার্মেশন চেকলিস্ট:
                        </div>
                        {checklist.map((rule, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-[11px] text-[#D1D4DC]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#00E676] shrink-0 mt-0.5" />
                            <span>{rule}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action Button: Jump & Inspect Setup on Chart */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowAiStrategyLab(false);
                          const idx = allCandles.findIndex((c) => c.time >= setup.candleTimestamp);
                          if (idx >= 0) {
                            setIsReplayMode(true);
                            setReplayIndex(idx);
                            setIsPlaying(false);
                            setAiAutoMark({
                              direction: setup.direction,
                              setupName: setup.name,
                              entryPrice: setup.entryPrice,
                              stopLoss: setup.stopLoss,
                              takeProfit: setup.takeProfit,
                              rrRatio: setup.avgRR,
                              confirmations: checklist,
                              stepByStepGuide: desc,
                            });
                            showToast(
                              `🎯 Jumped to ${setup.name} setup at bar #${idx}! Press Play or +1 Bar to test.`,
                              'emerald'
                            );
                          }
                        }}
                        className="py-2 px-4 rounded-lg bg-[#2962FF] hover:bg-[#1E4BD8] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-transform hover:scale-[1.01]"
                      >
                        <Eye className="w-4 h-4" />
                        <span>চার্টে দেখুন ও প্র্যাকটিস করুন (Inspect on Chart & Practice)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. INDICATORS MODAL */}
      {showIndicatorModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-[#1E222D] border border-[#2A2E39] shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2A2E39] flex items-center justify-between">
              <span className="font-bold text-white text-sm">Indicators, SMC & Strategies</span>
              <button
                type="button"
                onClick={() => setShowIndicatorModal(false)}
                className="text-[#787B86] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-[#2A2E39] flex items-center gap-2 bg-[#131722]">
              <Search className="w-4 h-4 text-[#787B86]" />
              <input
                type="text"
                value={indicatorSearch}
                onChange={(e) => setIndicatorSearch(e.target.value)}
                placeholder="Search indicators (EMA, SMC, Order Block, RSI, Fibonacci, VWAP)..."
                className="w-full bg-transparent text-xs text-white focus:outline-none"
              />
            </div>

            <div className="max-h-[55vh] overflow-y-auto divide-y divide-[#2A2E39]">
              {indicators
                .filter((i) => i.name.toLowerCase().includes(indicatorSearch.toLowerCase()))
                .map((ind) => (
                  <div
                    key={ind.id}
                    onClick={() => toggleIndicator(ind.id)}
                    className="px-4 py-2.5 flex items-center justify-between hover:bg-[#2A2E39]/60 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ind.color }} />
                      <div>
                        <div className="text-xs font-medium text-white">{ind.name}</div>
                        <div className="text-[10px] font-mono text-[#787B86]">{ind.category}</div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        ind.visible ? 'bg-[#2962FF] text-white' : 'bg-[#131722] text-[#787B86]'
                      }`}
                    >
                      {ind.visible ? 'ACTIVE' : 'ADD'}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Chart Teacher & Deep Backtest Confluence Modal */}
      <AiChartTeacherModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        symbol={symbol}
        timeframe={timeframe}
        backtestReport={deepBacktestReport}
        activeCircle={activeConfirmationCircle}
        inspectedCandle={inspectedCandleSymptom}
        onSelectCircle={(circle) => {
          setActiveConfirmationCircle(circle);
          const idx = allCandles.findIndex((c) => c.time === circle.candleTime);
          if (idx >= 0) {
            setReplayIndex(idx);
          }
        }}
        onJumpToCandleTime={(time) => {
          const idx = allCandles.findIndex((c) => c.time === time);
          if (idx >= 0) {
            setReplayIndex(idx);
          }
        }}
        onApplySetupToOrderTicket={(setup) => {
          setDraftOrder({
            active: true,
            direction: setup.direction,
            entryPrice: setup.entry,
            stopLoss: setup.sl,
            takeProfit: setup.tp,
            lotSize: lotSize,
          });
          setShowOrderTicketFlyout(true);
          showToast(`🎯 99% Sniper Setup loaded: ${setup.direction} @ ${setup.entry} (Safe SL: ${setup.sl})`, 'emerald');
        }}
        language={aiLanguage}
      />

      {/* User Profile & Account Settings Modal with Logout */}
      <UserProfileModal
        isOpen={showUserProfileModal}
        onClose={() => setShowUserProfileModal(false)}
        profile={profile}
        userSubscription={userSubscription}
        onSignOut={onSignOut || (() => {})}
        onOpenSubscriptionModal={onOpenSubscriptionModal}
        onUpdatePreferences={(updates) => {
          if (updates.preferredMarket) {
            handleSelectSymbol(updates.preferredMarket as SupportedSymbol);
          }
        }}
      />
    </div>
  );
};
