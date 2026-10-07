import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  BaselineSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
} from 'lightweight-charts';
import {
  Crosshair,
  TrendingUp,
  Minus,
  SeparatorVertical,
  Square,
  Layers,
  Type as TypeIcon,
  Trash2,
  Maximize2,
  Minimize2,
  Target,
  Scissors,
  Sparkles,
  BarChart2,
  Magnet,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Ruler,
  PenTool,
  Undo2,
  X,
  Clock,
  CheckCircle2,
  Play,
  Check,
  Zap,
  BookOpen,
  Flame,
  RotateCw,
  Copy,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronsUpDown,
} from 'lucide-react';
import {
  CandleData,
  IndicatorConfig,
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateVWAP,
  calculateSuperTrend,
  TIMEFRAME_SECONDS,
  detectHighImpactSMCZonesAndMarkers,
  findRecentSwingPoints,
  HistoricalTradeLesson,
  HighImpactSMCData,
  AiChartSignal,
  getHistoricalTradeLessons,
} from '../services/marketEngine';
import { ConfirmationCircle, AiBacktestTeacherEngine } from '../services/aiBacktestTeacherEngine';
import { SupportedTimeframe, SupportedSymbol } from '../config/brand';

export type ChartVisualType = 'candlestick' | 'hollow' | 'heikin' | 'line' | 'area' | 'baseline';

export type DrawingToolType =
  | 'cursor'
  | 'trendline'
  | 'hline'
  | 'vline'
  | 'rect'
  | 'fib'
  | 'brush'
  | 'longpos'
  | 'shortpos'
  | 'measure'
  | 'text';

export interface ChartDrawing {
  id: string;
  type: DrawingToolType;
  time1: number; // Unix seconds (anchored to candle)
  price1: number; // Price anchor 1
  time2: number; // Unix seconds (anchored to candle)
  price2: number; // Price anchor 2
  color: string;
  lineWidth?: number;
  extendRight?: boolean;
  inverted?: boolean;
  stopPrice?: number;
  targetPrice?: number;
  points?: Array<{ time: number; price: number }>;
  text?: string;
  // Temporary coordinates for draft drawing in progress
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

export interface AiAutoMarkOverlay {
  direction: 'BUY' | 'SELL';
  setupName: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  rrRatio: number;
  confidenceLabel?: string;
  marketStructureSummary?: string;
  confirmations: string[];
  stepByStepGuide: string;
  invalidationWarning?: string;
  visualMarkers?: Array<{
    time: number;
    price: number;
    position: 'aboveBar' | 'belowBar';
    color: string;
    shape: string;
    text: string;
  }>;
}

export interface DraftOrderBracket {
  active: boolean;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
}

interface TradingChartProps {
  symbol: 'BTC/USD' | 'XAU/USD';
  onSelectSymbol?: (sym: 'BTC/USD' | 'XAU/USD') => void;
  timeframe: SupportedTimeframe;
  candles: CandleData[];
  totalAvailableCandles: number;
  chartType: ChartVisualType;
  indicators: IndicatorConfig[];
  onToggleIndicator: (id: string) => void;
  // Active Trade State
  entryPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  tradeDirection: 'LONG' | 'SHORT';
  hasActiveTrade: boolean;
  isPendingOrder?: boolean;
  activeTradePnl: number;
  activeTradeR?: number;
  lotSize: number;
  contractUnits: number;
  onChangeLotSize: (lots: number) => void;
  onUpdateEntryPrice?: (newPrice: number) => void;
  onUpdateStopLoss: (newSl: number) => void;
  onUpdateTakeProfit: (newTp: number) => void;
  onMoveToBreakeven?: () => void;
  onPartialClose50?: () => void;
  onReversePosition?: () => void;
  onClosePosition?: () => void;
  // Exness-Style Draft Order Setup
  draftOrder: DraftOrderBracket | null;
  onStartDraftOrder: (dir: 'LONG' | 'SHORT') => void;
  onUpdateDraftSl: (sl: number) => void;
  onUpdateDraftTp: (tp: number) => void;
  onUpdateDraftEntry?: (entry: number) => void;
  onConfirmDraftOrder: () => void;
  onCancelDraftOrder: () => void;
  // Quick Order Fallback
  onQuickOrder: (dir: 'LONG' | 'SHORT', customEntryPrice?: number) => void;
  // AI Auto-Mark
  aiAutoMark?: AiAutoMarkOverlay | null;
  onApplyAiSetup?: (setup: AiAutoMarkOverlay) => void;
  onExecuteAiSetupNow?: (setup: AiAutoMarkOverlay) => void;
  onClearAiAutoMark?: () => void;
  // Replay Cut Mode
  isReplayCutMode: boolean;
  onToggleReplayCutMode: () => void;
  onSelectReplayCutTime: (unixTime: number) => void;
  // Fullscreen Mode
  isFullWindowChart: boolean;
  onToggleFullWindowChart: () => void;
  // High-Impact SMC Overlay
  showHighImpactSmc?: boolean;
  onToggleHighImpactSmc?: () => void;
  // Educational Trade Lessons
  showLessonsMode?: boolean;
  onToggleLessonsMode?: () => void;
  lessons?: HistoricalTradeLesson[];
  activeLesson?: HistoricalTradeLesson | null;
  onSelectLesson?: (lesson: HistoricalTradeLesson) => void;
  onCloseLesson?: () => void;
  onReplayFromLesson?: (lesson: HistoricalTradeLesson) => void;
  aiLanguage?: 'bn' | 'banglish' | 'en' | 'hi';
  // Advanced Prediction & Confirmation Circles Teaching Engine
  confirmationCircles?: ConfirmationCircle[];
  showConfirmationCircles?: boolean;
  onToggleConfirmationCircles?: () => void;
  onSelectConfirmationCircle?: (circle: ConfirmationCircle) => void;
  showPerfectEntrySymbols?: boolean;
  onTogglePerfectEntrySymbols?: () => void;
  onOpenAutoBacktestReport?: () => void;
  onOpenPairPlaybook?: () => void;
  onInspectCandle?: (candle: CandleData, index: number) => void;
  onCandleTimerElapsed?: () => void;
}

function computeHeikinAshi(candles: CandleData[]): CandleData[] {
  if (candles.length === 0) return [];
  const res: CandleData[] = [];
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const prev = res[i - 1];
    const haOpen = prev ? (prev.open + prev.close) / 2 : (c.open + c.close) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);
    res.push({
      time: c.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: c.volume,
    });
  }
  return res;
}

const PALETTE_COLORS = [
  { label: 'Amber Gold', color: '#FFB300' },
  { label: 'Emerald Green', color: '#00E676' },
  { label: 'TradingView Blue', color: '#2962FF' },
  { label: 'Exness Crimson', color: '#F23645' },
  { label: 'Ice Cyan', color: '#00E5FF' },
  { label: 'Royal Violet', color: '#AB47BC' },
  { label: 'Crisp White', color: '#FFFFFF' },
];

export const TradingChart: React.FC<TradingChartProps> = ({
  symbol,
  onSelectSymbol,
  timeframe,
  candles,
  totalAvailableCandles,
  chartType,
  indicators,
  onToggleIndicator,
  entryPrice,
  stopLoss,
  takeProfit,
  tradeDirection,
  hasActiveTrade,
  isPendingOrder,
  activeTradePnl,
  activeTradeR = 0,
  lotSize,
  contractUnits,
  onChangeLotSize,
  onUpdateEntryPrice,
  onUpdateStopLoss,
  onUpdateTakeProfit,
  onMoveToBreakeven,
  onPartialClose50,
  onReversePosition,
  onClosePosition,
  draftOrder,
  onStartDraftOrder,
  onUpdateDraftSl,
  onUpdateDraftTp,
  onUpdateDraftEntry,
  onConfirmDraftOrder,
  onCancelDraftOrder,
  onQuickOrder,
  aiAutoMark,
  onExecuteAiSetupNow,
  onClearAiAutoMark,
  isReplayCutMode,
  onToggleReplayCutMode,
  onSelectReplayCutTime,
  isFullWindowChart,
  onToggleFullWindowChart,
  showHighImpactSmc: propShowHighImpactSmc,
  onToggleHighImpactSmc,
  showLessonsMode: propShowLessonsMode,
  onToggleLessonsMode,
  lessons: propLessons = [],
  activeLesson: propActiveLesson = null,
  onSelectLesson,
  onCloseLesson,
  onReplayFromLesson,
  aiLanguage = 'bn',
  confirmationCircles: propConfirmationCircles,
  showConfirmationCircles: propShowConfirmationCircles,
  onToggleConfirmationCircles,
  onSelectConfirmationCircle,
  showPerfectEntrySymbols: propShowPerfectEntrySymbols,
  onTogglePerfectEntrySymbols,
  onOpenAutoBacktestReport,
  onOpenPairPlaybook,
  onInspectCandle,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const overlaySeriesRefs = useRef<ISeriesApi<any>[]>([]);
  const candlesRef = useRef<CandleData[]>(candles);
  candlesRef.current = candles;
  const currentSeriesTypeRef = useRef<ChartVisualType | null>(null);
  const currentSeriesSymbolRef = useRef<SupportedSymbol | null>(null);
  const prevCandlesCountRef = useRef<number>(0);

  // Local state fallbacks for SMC & Educational Backtest Mentor
  const [internalHighImpactSmc, setInternalHighImpactSmc] = useState<boolean>(true);
  const showHighImpactSmc = propShowHighImpactSmc ?? internalHighImpactSmc;
  const toggleHighImpactSmc = onToggleHighImpactSmc || (() => setInternalHighImpactSmc((v) => !v));

  const [internalLessonsMode, setInternalLessonsMode] = useState<boolean>(false);
  const showLessonsMode = propShowLessonsMode ?? internalLessonsMode;
  const toggleLessonsMode = onToggleLessonsMode || (() => setInternalLessonsMode((v) => !v));

  const [internalActiveLesson, setInternalActiveLesson] = useState<HistoricalTradeLesson | null>(null);
  const activeLesson = propActiveLesson ?? internalActiveLesson;
  const selectLesson = onSelectLesson || ((l: HistoricalTradeLesson) => setInternalActiveLesson(l));
  const closeLesson = onCloseLesson || (() => setInternalActiveLesson(null));

  // Confirmation Circles & 99% A+ Sniper State & Memoization
  const [internalShowConfirmationCircles, setInternalShowConfirmationCircles] = useState<boolean>(true);
  const showConfirmationCircles = propShowConfirmationCircles ?? internalShowConfirmationCircles;
  const toggleConfirmationCircles = onToggleConfirmationCircles || (() => setInternalShowConfirmationCircles((v) => !v));

  // Dedicated Perfect Entry Place Symbols State (🎯 exact entry crosshair & trigger level on chart)
  const [internalShowPerfectEntrySymbols, setInternalShowPerfectEntrySymbols] = useState<boolean>(true);
  const showPerfectEntrySymbols = propShowPerfectEntrySymbols ?? internalShowPerfectEntrySymbols;
  const togglePerfectEntrySymbols = onTogglePerfectEntrySymbols || (() => setInternalShowPerfectEntrySymbols((v) => !v));

  // Selected Entry Circle for Perfect Entry Blueprint modal
  const [inspectedEntryCircle, setInspectedEntryCircle] = useState<ConfirmationCircle | null>(null);

  // Execution Blocks Toggles
  const [showExecutionBlocks, setShowExecutionBlocks] = useState<boolean>(true);

  const effectiveConfirmationCircles = useMemo(() => {
    if (propConfirmationCircles && propConfirmationCircles.length > 0) return propConfirmationCircles;
    return AiBacktestTeacherEngine.runDeepAutoBacktest(candles, symbol, timeframe, aiLanguage).circles;
  }, [propConfirmationCircles, candles, symbol, timeframe, aiLanguage]);

  const displayedConfirmationCircles = effectiveConfirmationCircles;

  // Drawing Tools State
  const [activeTool, setActiveTool] = useState<DrawingToolType>('cursor');
  const [drawings, setDrawings] = useState<ChartDrawing[]>([]);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [draftDrawing, setDraftDrawing] = useState<ChartDrawing | null>(null);
  const [magnetEnabled, setMagnetEnabled] = useState(false);
  const [drawingsLocked, setDrawingsLocked] = useState(false);
  const [drawingsHidden, setDrawingsHidden] = useState(false);
  const [currentColor, setCurrentColor] = useState('#FFB300');
  const [draggingDrawingHandle, setDraggingDrawingHandle] = useState<{
    id: string;
    handle: 'p1' | 'p2' | 'p2_width' | 'body' | 'stop' | 'target';
    startP1Price?: number;
    startP2Price?: number;
    startP1Time?: number;
    startP2Time?: number;
    mouseStartPrice?: number;
    mouseStartTime?: number;
  } | null>(null);

  // Text Tool Prompt Modal
  const [textPromptPos, setTextPromptPos] = useState<{ x: number; y: number; price: number; time: number } | null>(null);
  const [textInputVal, setTextInputVal] = useState('');

  // Dragging Trade Lines (Active or Draft Order)
  const [draggingTradeLine, setDraggingTradeLine] = useState<'SL' | 'TP' | 'ENTRY' | null>(null);

  // Fast coordinate sync tick triggered by pan/zoom/timer
  const [, setCoordTick] = useState(0);

  // Coordinates of draggable trade lines
  const [lineCoordinates, setLineCoordinates] = useState<{
    entryY: number | null;
    slY: number | null;
    tpY: number | null;
    aiEntryY: number | null;
    aiSlY: number | null;
    aiTpY: number | null;
  }>({
    entryY: null,
    slY: null,
    tpY: null,
    aiEntryY: null,
    aiSlY: null,
    aiTpY: null,
  });

  // Crosshair coordinate & time for Cut Tool
  const [crosshairPos, setCrosshairPos] = useState<{
    x: number;
    y: number;
    price: number | null;
    time: number | null;
  } | null>(null);

  // Live Candle Countdown Timer
  const [candleCountdown, setCandleCountdown] = useState<string>('00:00');

  // Selected Signal Modal state
  const [inspectedSignal, setInspectedSignal] = useState<AiChartSignal | null>(null);

  const decimals = symbol === 'BTC/USD' ? 2 : 2;
  const currentCandle = candles[candles.length - 1];
  const currentClose = currentCandle ? currentCandle.close : 0;
  const spread = symbol === 'BTC/USD' ? 2.5 : 0.25;
  const askPrice = currentClose ? currentClose + spread : 0;
  const bidPrice = currentClose ? currentClose - spread : 0;

  // Real-time calculation of candle close countdown
  // Auto-calculates based on current clock period and automatically resets to full duration when period completes
  useEffect(() => {
    const updateCountdown = () => {
      const stepSec = TIMEFRAME_SECONDS[timeframe] || 900;
      const nowSec = Math.floor(Date.now() / 1000);
      const currentPeriodStart = Math.floor(nowSec / stepSec) * stepSec;
      const nextPeriodStart = currentPeriodStart + stepSec;
      const remainingSec = Math.max(0, nextPeriodStart - nowSec);

      const hours = Math.floor(remainingSec / 3600);
      const mins = Math.floor((remainingSec % 3600) / 60);
      const secs = remainingSec % 60;

      if (hours > 0) {
        setCandleCountdown(
          `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        );
      } else {
        setCandleCountdown(
          `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        );
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [timeframe]);

  // Determine current active/draft SL, TP, Entry
  const isDraftMode = draftOrder !== null && draftOrder.active;
  const effectiveEntry = isDraftMode ? draftOrder.entryPrice : entryPrice;
  const effectiveSl = isDraftMode ? draftOrder.stopLoss : stopLoss;
  const effectiveTp = isDraftMode ? draftOrder.takeProfit : takeProfit;
  const effectiveDir = isDraftMode ? draftOrder.direction : tradeDirection;
  const effectiveLots = isDraftMode ? draftOrder.lotSize : lotSize;

  // Convert Price & Time to Coordinates
  const getXFromTime = useCallback((time: number, fallbackX = 0): number => {
    if (!chartRef.current) return fallbackX;
    try {
      const coord = chartRef.current.timeScale().timeToCoordinate(time as UTCTimestamp);
      return coord !== null ? Number(coord) : fallbackX;
    } catch {
      return fallbackX;
    }
  }, []);

  const getYFromPrice = useCallback((price: number, fallbackY = 0): number => {
    if (!mainSeriesRef.current) return fallbackY;
    try {
      const coord = mainSeriesRef.current.priceToCoordinate(price);
      return coord !== null ? Number(coord) : fallbackY;
    } catch {
      return fallbackY;
    }
  }, []);

  // Sync trade line pixel coordinates whenever chart moves, resizes, or price changes
  const syncPriceLineCoordinates = useCallback(() => {
    const series = mainSeriesRef.current;
    if (!series) return;

    try {
      const entryY = effectiveEntry !== null ? series.priceToCoordinate(effectiveEntry) : null;
      const slY = effectiveSl !== null ? series.priceToCoordinate(effectiveSl) : null;
      const tpY = effectiveTp !== null ? series.priceToCoordinate(effectiveTp) : null;

      const aiEntryY = aiAutoMark?.entryPrice ? series.priceToCoordinate(aiAutoMark.entryPrice) : null;
      const aiSlY = aiAutoMark?.stopLoss ? series.priceToCoordinate(aiAutoMark.stopLoss) : null;
      const aiTpY = aiAutoMark?.takeProfit ? series.priceToCoordinate(aiAutoMark.takeProfit) : null;

      setLineCoordinates({
        entryY: entryY !== null ? Number(entryY) : null,
        slY: slY !== null ? Number(slY) : null,
        tpY: tpY !== null ? Number(tpY) : null,
        aiEntryY: aiEntryY !== null ? Number(aiEntryY) : null,
        aiSlY: aiSlY !== null ? Number(aiSlY) : null,
        aiTpY: aiTpY !== null ? Number(aiTpY) : null,
      });

      setCoordTick((t) => t + 1);
    } catch (_e) {
      // ignore
    }
  }, [effectiveEntry, effectiveSl, effectiveTp, aiAutoMark]);

  // Mobile Drawing Tools Slideout State
  const [mobileDrawOpen, setMobileDrawOpen] = useState(false);

  // Ultra-Deep Candle Zoom In Function (Inspect micro-wicks & entries in high-definition)
  const handleZoomIn = useCallback(() => {
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const currentBarSpacing = timeScale.options().barSpacing || 10;
    // Generously boost barSpacing up to 450px so candles can become massive and crystal clear
    const newBarSpacing = Math.min(450, Math.round(currentBarSpacing * 1.55 + 2));
    timeScale.applyOptions({ barSpacing: newBarSpacing });

    const currentRange = timeScale.getVisibleLogicalRange();
    if (currentRange) {
      const barsCount = currentRange.to - currentRange.from;
      const reduction = Math.max(2, barsCount * 0.35);
      if (barsCount - reduction >= 2) {
        timeScale.setVisibleLogicalRange({
          from: currentRange.from + reduction * 0.45,
          to: currentRange.to - reduction * 0.55,
        });
      }
    }
    syncPriceLineCoordinates();
  }, [syncPriceLineCoordinates]);

  // Macro Zoom Out Function (View larger trend context)
  const handleZoomOut = useCallback(() => {
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const currentBarSpacing = timeScale.options().barSpacing || 10;
    const newBarSpacing = Math.max(0.8, Math.round(currentBarSpacing / 1.55));
    timeScale.applyOptions({ barSpacing: newBarSpacing });

    const currentRange = timeScale.getVisibleLogicalRange();
    if (currentRange) {
      const barsCount = currentRange.to - currentRange.from;
      const expansion = Math.max(6, barsCount * 0.45);
      timeScale.setVisibleLogicalRange({
        from: currentRange.from - expansion / 2,
        to: currentRange.to + expansion / 2,
      });
    }
    syncPriceLineCoordinates();
  }, [syncPriceLineCoordinates]);

  // Reset / Fit Content Zoom Function
  const handleResetZoom = useCallback(() => {
    if (!chartRef.current) return;
    chartRef.current.timeScale().applyOptions({ barSpacing: 12 });
    chartRef.current.timeScale().fitContent();
    chartRef.current.priceScale('right').applyOptions({ autoScale: true });
    syncPriceLineCoordinates();
  }, [syncPriceLineCoordinates]);

  // Auto-Scale Price Height
  const handleAutoScalePrice = useCallback(() => {
    if (!chartRef.current) return;
    chartRef.current.priceScale('right').applyOptions({ autoScale: true });
    syncPriceLineCoordinates();
  }, [syncPriceLineCoordinates]);

  // Initialize Lightweight Chart Instance
  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartContainerRef.current.innerHTML = '';

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#B2B5BE',
        fontFamily: "'JetBrains Mono', -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.45)', style: LineStyle.SparseDotted },
        horzLines: { color: 'rgba(42, 46, 57, 0.45)', style: LineStyle.SparseDotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#2962FF',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#2962FF',
        },
        horzLine: {
          color: '#2962FF',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#2962FF',
        },
      },
      timeScale: {
        borderColor: '#2A2E39',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 10,
        minBarSpacing: 0.2,
        maxBarSpacing: 500,
      },
      rightPriceScale: {
        borderColor: '#2A2E39',
        autoScale: true,
        scaleMargins: { top: 0.12, bottom: 0.22 },
        alignLabels: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        axisDoubleClickReset: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      syncPriceLineCoordinates();
    });

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
        syncPriceLineCoordinates();
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      mainSeriesRef.current = null;
      overlaySeriesRefs.current = [];
    };
  }, []);

  // Update Series when candles, indicators or chart type changes
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || candles.length === 0) return;

    const candleDataToUse = chartType === 'heikin' ? computeHeikinAshi(candles) : candles;
    const sameSeriesType =
      currentSeriesTypeRef.current === chartType &&
      currentSeriesSymbolRef.current === symbol &&
      mainSeriesRef.current !== null;

    if (!sameSeriesType) {
      if (mainSeriesRef.current) {
        try {
          chart.removeSeries(mainSeriesRef.current);
        } catch (_e) {
          // ignore
        }
        mainSeriesRef.current = null;
      }

      let series: ISeriesApi<any>;

      if (chartType === 'candlestick' || chartType === 'heikin') {
        series = chart.addSeries(CandlestickSeries, {
          upColor: '#089981',
          downColor: '#F23645',
          borderUpColor: '#089981',
          borderDownColor: '#F23645',
          wickUpColor: '#089981',
          wickDownColor: '#F23645',
        });
      } else if (chartType === 'hollow') {
        series = chart.addSeries(CandlestickSeries, {
          upColor: 'transparent',
          downColor: '#F23645',
          borderUpColor: '#089981',
          borderDownColor: '#F23645',
          wickUpColor: '#089981',
          wickDownColor: '#F23645',
        });
      } else if (chartType === 'line') {
        series = chart.addSeries(LineSeries, {
          color: '#2962FF',
          lineWidth: 2,
        });
      } else if (chartType === 'area') {
        series = chart.addSeries(AreaSeries, {
          topColor: 'rgba(41, 98, 255, 0.45)',
          bottomColor: 'rgba(41, 98, 255, 0.02)',
          lineColor: '#2962FF',
          lineWidth: 2,
        });
      } else {
        series = chart.addSeries(BaselineSeries, {
          baseValue: { type: 'price', price: currentClose },
          topFillColor1: 'rgba(8, 153, 129, 0.35)',
          topFillColor2: 'rgba(8, 153, 129, 0.05)',
          topLineColor: '#089981',
          bottomFillColor1: 'rgba(242, 54, 69, 0.05)',
          bottomFillColor2: 'rgba(242, 54, 69, 0.35)',
          bottomLineColor: '#F23645',
          lineWidth: 2,
        });
      }

      mainSeriesRef.current = series;
      currentSeriesTypeRef.current = chartType;
      currentSeriesSymbolRef.current = symbol;
    }

    // Set series data smoothly
    const series = mainSeriesRef.current!;
    if (chartType === 'candlestick' || chartType === 'heikin') {
      series.setData(
        candleDataToUse.map((c) => ({
          time: c.time as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      );
    } else if (chartType === 'hollow') {
      series.setData(
        candles.map((c) => ({
          time: c.time as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      );
    } else {
      series.setData(candles.map((c) => ({ time: c.time as UTCTimestamp, value: c.close })));
    }

    // When a brand new candle forms (candles count increases), automatically scroll time scale to live candle
    if (candles.length > prevCandlesCountRef.current && prevCandlesCountRef.current > 0) {
      try {
        chart.timeScale().scrollToRealTime();
      } catch (_e) {}
    }
    prevCandlesCountRef.current = candles.length;

    // Attach overlays
    overlaySeriesRefs.current.forEach((s) => {
      try {
        chart.removeSeries(s);
      } catch (_e) {
        // ignore
      }
    });
    overlaySeriesRefs.current = [];

    indicators.forEach((ind) => {
      if (!ind.visible) return;
      if (ind.id === 'ema20' || ind.id === 'ema50') {
        const emaData = calculateEMA(candles, ind.period, ind.source);
        const s = chart.addSeries(LineSeries, {
          color: ind.color,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        s.setData(emaData.map((d) => ({ time: d.time as UTCTimestamp, value: d.value })));
        overlaySeriesRefs.current.push(s);
      } else if (ind.id === 'sma200') {
        const smaData = calculateSMA(candles, ind.period, ind.source);
        const s = chart.addSeries(LineSeries, {
          color: ind.color,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        s.setData(smaData.map((d) => ({ time: d.time as UTCTimestamp, value: d.value })));
        overlaySeriesRefs.current.push(s);
      } else if (ind.id === 'vwap') {
        const vwapData = calculateVWAP(candles);
        const s = chart.addSeries(LineSeries, {
          color: ind.color,
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        s.setData(vwapData.map((d) => ({ time: d.time as UTCTimestamp, value: d.value })));
        overlaySeriesRefs.current.push(s);
      } else if (ind.id === 'supertrend') {
        const stData = calculateSuperTrend(candles, 10, 2.6);
        const s = chart.addSeries(LineSeries, {
          color: '#00E676',
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        s.setData(stData.map((d) => ({ time: d.time as UTCTimestamp, value: d.value })));
        overlaySeriesRefs.current.push(s);
      } else if (ind.id === 'bb') {
        const bb = calculateBollingerBands(candles, 20, 2);
        const u = chart.addSeries(LineSeries, {
          color: 'rgba(41, 98, 255, 0.55)',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        const l = chart.addSeries(LineSeries, {
          color: 'rgba(41, 98, 255, 0.55)',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        u.setData(bb.upper.map((d) => ({ time: d.time as UTCTimestamp, value: d.value })));
        l.setData(bb.lower.map((d) => ({ time: d.time as UTCTimestamp, value: d.value })));
        overlaySeriesRefs.current.push(u, l);
      }
    });

    if (chart && candles.length > 0) {
      chart.priceScale('right').applyOptions({ autoScale: true });
    }
    requestAnimationFrame(syncPriceLineCoordinates);
  }, [candles, indicators, chartType, symbol, syncPriceLineCoordinates]);

  // Handle pair (symbol) switch cleanly so charts never disappear or get stuck off-scale
  const prevSymbolRef = useRef<SupportedSymbol>(symbol);
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (prevSymbolRef.current !== symbol) {
      prevSymbolRef.current = symbol;
      chart.priceScale('right').applyOptions({ autoScale: true });
      chart.timeScale().resetTimeScale();
      chart.timeScale().fitContent();
      requestAnimationFrame(() => {
        chart.timeScale().scrollToPosition(6, false);
        syncPriceLineCoordinates();
      });
    }
  }, [symbol, syncPriceLineCoordinates]);

  // Convert Y pixel on chart to Price
  const yToPrice = useCallback(
    (y: number, x?: number): number => {
      const series = mainSeriesRef.current;
      const chart = chartRef.current;
      if (!series) return currentClose;
      const rawPrice = Number(series.coordinateToPrice(y) || currentClose);

      if (magnetEnabled && chart && x !== undefined) {
        const t = chart.timeScale().coordinateToTime(x);
        if (t) {
          const bar = candlesRef.current.find((c) => c.time === Number(t));
          if (bar) {
            const candidates = [bar.open, bar.high, bar.low, bar.close];
            let closest = candidates[0];
            let minDiff = Math.abs(rawPrice - closest);
            candidates.forEach((p) => {
              const d = Math.abs(rawPrice - p);
              if (d < minDiff) {
                minDiff = d;
                closest = p;
              }
            });
            return Number(closest.toFixed(decimals));
          }
        }
      }
      return Number(rawPrice.toFixed(decimals));
    },
    [currentClose, magnetEnabled, decimals]
  );

  // Convert X pixel to candle Unix Time
  const xToTime = useCallback(
    (x: number): number => {
      const chart = chartRef.current;
      if (!chart || candlesRef.current.length === 0) return Date.now() / 1000;
      const t = chart.timeScale().coordinateToTime(x);
      if (t) return Number(t);

      const logical = chart.timeScale().coordinateToLogical(x);
      if (logical !== null) {
        const idx = Math.max(0, Math.min(candlesRef.current.length - 1, Math.round(logical)));
        return candlesRef.current[idx]?.time || Date.now() / 1000;
      }
      return candlesRef.current[candlesRef.current.length - 1]?.time || Date.now() / 1000;
    },
    []
  );

  // Global Mouse Move & Up for Dragging
  useEffect(() => {
    if (!draggingTradeLine && !draggingDrawingHandle) return;

    if (chartRef.current) {
      chartRef.current.applyOptions({
        handleScroll: { pressedMouseMove: false },
      });
    }

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!chartContainerRef.current) return;
      const rect = chartContainerRef.current.getBoundingClientRect();
      const relY = Math.max(12, Math.min(rect.height - 28, e.clientY - rect.top));
      const relX = Math.max(0, Math.min(rect.width - 60, e.clientX - rect.left));
      const newPrice = yToPrice(relY, relX);
      const newTime = xToTime(relX);

      // Dragging Trade Lines
      if (draggingTradeLine === 'SL') {
        if (isDraftMode) onUpdateDraftSl(newPrice);
        else onUpdateStopLoss(newPrice);
      } else if (draggingTradeLine === 'TP') {
        if (isDraftMode) onUpdateDraftTp(newPrice);
        else onUpdateTakeProfit(newPrice);
      } else if (draggingTradeLine === 'ENTRY') {
        if (isDraftMode && onUpdateDraftEntry) onUpdateDraftEntry(newPrice);
        else if (onUpdateEntryPrice) onUpdateEntryPrice(newPrice);
      }

      // Dragging Drawing Handles (Points or whole Body)
      if (draggingDrawingHandle) {
        setDrawings((prev) =>
          prev.map((d) => {
            if (d.id !== draggingDrawingHandle.id) return d;
            if (draggingDrawingHandle.handle === 'p1') {
              return { ...d, time1: newTime, price1: newPrice };
            }
            if (draggingDrawingHandle.handle === 'p2') {
              return { ...d, time2: newTime, price2: newPrice };
            }
            if (draggingDrawingHandle.handle === 'p2_width') {
              return { ...d, time2: newTime };
            }
            if (draggingDrawingHandle.handle === 'body') {
              const pDelta = newPrice - (draggingDrawingHandle.mouseStartPrice ?? newPrice);
              const tDelta = newTime - (draggingDrawingHandle.mouseStartTime ?? newTime);
              return {
                ...d,
                price1: Number(((draggingDrawingHandle.startP1Price ?? d.price1) + pDelta).toFixed(decimals)),
                price2: Number(((draggingDrawingHandle.startP2Price ?? d.price2) + pDelta).toFixed(decimals)),
                time1: (draggingDrawingHandle.startP1Time ?? d.time1) + tDelta,
                time2: (draggingDrawingHandle.startP2Time ?? d.time2) + tDelta,
              };
            }
            if (draggingDrawingHandle.handle === 'stop') {
              return { ...d, stopPrice: newPrice };
            }
            if (draggingDrawingHandle.handle === 'target') {
              return { ...d, targetPrice: newPrice };
            }
            return d;
          })
        );
        setCoordTick((t) => t + 1);
      }
    };

    const handleGlobalMouseUp = () => {
      setDraggingTradeLine(null);
      setDraggingDrawingHandle(null);
      if (chartRef.current) {
        chartRef.current.applyOptions({
          handleScroll: { pressedMouseMove: true },
        });
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [
    draggingTradeLine,
    draggingDrawingHandle,
    yToPrice,
    xToTime,
    isDraftMode,
    onUpdateDraftSl,
    onUpdateDraftTp,
    onUpdateDraftEntry,
    onUpdateStopLoss,
    onUpdateTakeProfit,
    onUpdateEntryPrice,
    decimals,
  ]);

  // Handle Cut Bar Click OR Drawing Creation
  const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isReplayCutMode) {
      if (crosshairPos?.time) {
        onSelectReplayCutTime(crosshairPos.time);
        return;
      }
      const t = xToTime(x);
      onSelectReplayCutTime(t);
      return;
    }

    if (activeTool === 'cursor' || drawingsLocked) {
      setSelectedDrawingId(null);
      return;
    }

    const p = yToPrice(y, x);
    const t = xToTime(x);

    if (activeTool === 'text') {
      setTextPromptPos({ x, y, price: p, time: t });
      setTextInputVal('');
      return;
    }

    const defaultOffset = symbol === 'BTC/USD' ? 420 : 6.5;
    const stepSec = TIMEFRAME_SECONDS[timeframe] || 900;
    const t2 = t + stepSec * (activeTool === 'longpos' || activeTool === 'shortpos' ? 24 : 14);

    const newDraft: ChartDrawing = {
      id: `drw_${Date.now()}`,
      type: activeTool,
      time1: t,
      price1: p,
      time2: t2,
      price2: p,
      color: currentColor,
      extendRight: activeTool === 'fib',
      x1: x,
      y1: y,
      x2: x + 80,
      y2: y,
      stopPrice: activeTool === 'longpos' ? p - defaultOffset : p + defaultOffset,
      targetPrice: activeTool === 'longpos' ? p + defaultOffset * 3.0 : p - defaultOffset * 3.0,
      points: activeTool === 'brush' ? [{ time: t, price: p }] : undefined,
    };

    setDraftDrawing(newDraft);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isReplayCutMode && chartRef.current) {
      const t = xToTime(x);
      const p = yToPrice(y, x);
      setCrosshairPos({ x, y, price: p, time: t });
    }

    if (!draftDrawing) return;
    const p = yToPrice(y, x);
    const t = xToTime(x);

    if (draftDrawing.type === 'brush') {
      setDraftDrawing({
        ...draftDrawing,
        time2: t,
        price2: p,
        points: [...(draftDrawing.points || []), { time: t, price: p }],
      });
    } else if (draftDrawing.type === 'longpos' || draftDrawing.type === 'shortpos') {
      setDraftDrawing({
        ...draftDrawing,
        time2: Math.max(draftDrawing.time1 + (TIMEFRAME_SECONDS[timeframe] || 900) * 4, t),
        targetPrice: p,
      });
    } else {
      setDraftDrawing({
        ...draftDrawing,
        time2: t,
        price2: p,
        x2: x,
        y2: y,
      });
    }
  };

  const handleCanvasMouseUp = () => {
    if (draftDrawing) {
      setDrawings((prev) => [...prev, draftDrawing]);
      setSelectedDrawingId(draftDrawing.id);
      setDraftDrawing(null);
      if (activeTool !== 'brush') {
        setActiveTool('cursor');
      }
    }
  };

  // Text Tool Submission
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textPromptPos && textInputVal.trim()) {
      const newD: ChartDrawing = {
        id: `txt_${Date.now()}`,
        type: 'text',
        time1: textPromptPos.time,
        price1: textPromptPos.price,
        time2: textPromptPos.time,
        price2: textPromptPos.price,
        color: currentColor,
        text: textInputVal.trim(),
      };
      setDrawings((prev) => [...prev, newD]);
      setSelectedDrawingId(newD.id);
    }
    setTextPromptPos(null);
    setTextInputVal('');
    setActiveTool('cursor');
  };

  // 1-Click Auto-Snap Fibonacci from Recent Swings
  const handleCreateAutoSnapFibonacci = () => {
    const swings = findRecentSwingPoints(candles);
    const newFib: ChartDrawing = {
      id: `drw_fib_${Date.now()}`,
      type: 'fib',
      time1: swings.swingHigh.time,
      price1: swings.swingHigh.price,
      time2: swings.swingLow.time,
      price2: swings.swingLow.price,
      color: '#FFB300',
      extendRight: true,
    };
    setDrawings((prev) => [...prev, newFib]);
    setSelectedDrawingId(newFib.id);
    setActiveTool('cursor');
  };

  const handleAutoSnapExistingFibonacci = (drawingId: string) => {
    const swings = findRecentSwingPoints(candles);
    setDrawings((prev) =>
      prev.map((d) => {
        if (d.id !== drawingId) return d;
        return {
          ...d,
          time1: swings.swingHigh.time,
          price1: swings.swingHigh.price,
          time2: swings.swingLow.time,
          price2: swings.swingLow.price,
        };
      })
    );
    setCoordTick((t) => t + 1);
  };

  // Flip/Invert Fibonacci direction
  const handleFlipFibonacci = (drawingId: string) => {
    setDrawings((prev) =>
      prev.map((d) => {
        if (d.id !== drawingId) return d;
        return {
          ...d,
          price1: d.price2,
          price2: d.price1,
          inverted: !d.inverted,
        };
      })
    );
    setCoordTick((t) => t + 1);
  };

  // Toggle Extend Right for Fibonacci
  const handleToggleExtendRight = (drawingId: string) => {
    setDrawings((prev) =>
      prev.map((d) => {
        if (d.id !== drawingId) return d;
        return {
          ...d,
          extendRight: !d.extendRight,
        };
      })
    );
    setCoordTick((t) => t + 1);
  };

  // Duplicate drawing
  const handleDuplicateDrawing = (drawingId: string) => {
    const item = drawings.find((d) => d.id === drawingId);
    if (!item) return;
    const delta = (candles[candles.length - 1]?.close || 100) * 0.004;
    const dup: ChartDrawing = {
      ...item,
      id: `drw_${Date.now()}`,
      price1: item.price1 + delta,
      price2: item.price2 + delta,
    };
    setDrawings((prev) => [...prev, dup]);
    setSelectedDrawingId(dup.id);
  };

  // Detect High-Impact SMC Elements & AI Trade Signals
  const smcData: HighImpactSMCData = useMemo(() => {
    return showHighImpactSmc
      ? detectHighImpactSMCZonesAndMarkers(candles)
      : { fvgs: [], bosLevels: [], chochLevels: [], sweeps: [], noTradeZones: [], aiSignals: [], tpTargetZones: [] };
  }, [candles, showHighImpactSmc]);

  // Lessons catalog fallback
  const effectiveLessons = useMemo(() => {
    return propLessons.length > 0 ? propLessons : getHistoricalTradeLessons(candles, symbol, timeframe);
  }, [propLessons, candles, symbol, timeframe]);

  // Live Dollar P&L for Draggable SL / TP Tags
  const orderRefPrice = effectiveEntry || currentClose;
  const tpDollar =
    effectiveTp && orderRefPrice
      ? Number((Math.abs(effectiveTp - orderRefPrice) * contractUnits).toFixed(2))
      : 0;
  const slDollar =
    effectiveSl && orderRefPrice
      ? Number((Math.abs(orderRefPrice - effectiveSl) * contractUnits).toFixed(2))
      : 0;
  const liveRrVal = slDollar > 0 && tpDollar > 0 ? Number((tpDollar / slDollar).toFixed(2)) : 0;
  const tpPips = effectiveTp && orderRefPrice ? Math.abs(effectiveTp - orderRefPrice) : 0;
  const slPips = effectiveSl && orderRefPrice ? Math.abs(orderRefPrice - effectiveSl) : 0;

  const leftTools: Array<{ id: DrawingToolType; label: string; icon: React.ReactNode }> = [
    { id: 'cursor', label: 'Crosshair', icon: <Crosshair className="w-4 h-4" /> },
    { id: 'trendline', label: 'Trend Line', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'hline', label: 'Horizontal Price Line', icon: <Minus className="w-4 h-4" /> },
    { id: 'vline', label: 'Vertical Time Line', icon: <SeparatorVertical className="w-4 h-4" /> },
    { id: 'rect', label: 'Order Block / Supply-Demand Box', icon: <Square className="w-4 h-4" /> },
    { id: 'fib', label: 'TradingView Fibonacci Retracement', icon: <Layers className="w-4 h-4 text-[#FFB300]" /> },
    { id: 'longpos', label: 'Long Position R:R Tool (Draggable)', icon: <Target className="w-4 h-4 text-[#089981]" /> },
    { id: 'shortpos', label: 'Short Position R:R Tool (Draggable)', icon: <Target className="w-4 h-4 text-[#F23645]" /> },
    { id: 'brush', label: 'Brush / Highlighter', icon: <PenTool className="w-4 h-4" /> },
    { id: 'measure', label: 'Price & Bar Ruler', icon: <Ruler className="w-4 h-4" /> },
    { id: 'text', label: 'Text Callout', icon: <TypeIcon className="w-4 h-4" /> },
  ];

  const candlesToCutCount = (() => {
    if (!isReplayCutMode || !crosshairPos?.time) return 0;
    const idx = candles.findIndex((c) => c.time >= crosshairPos.time!);
    if (idx < 0) return 0;
    return Math.max(0, candles.length - 1 - idx);
  })();

  const allRenderedDrawings = draftDrawing ? [...drawings, draftDrawing] : drawings;
  const selectedDrawing = drawings.find((d) => d.id === selectedDrawingId) || null;

  return (
    <div ref={wrapperRef} className="w-full h-full flex bg-[#131722] select-none overflow-hidden relative">
      {/* LEFT VERTICAL TRADINGVIEW DRAWING TOOLBAR */}
      <div className="w-[42px] shrink-0 bg-[#131722] border-r border-[#2A2E39] hidden sm:flex flex-col items-center py-2 gap-1 z-20">
        <button
          type="button"
          title="Cut & Remove Chart Candles from Cursor (Bar Replay)"
          onClick={onToggleReplayCutMode}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors cursor-pointer ${
            isReplayCutMode
              ? 'bg-[#2962FF] text-white shadow-lg shadow-[#2962FF]/40'
              : 'text-[#00E676] bg-[#089981]/15 hover:bg-[#2962FF] hover:text-white'
          }`}
        >
          <Scissors className="w-4 h-4" />
        </button>

        <div className="w-6 h-[1px] bg-[#2A2E39] my-0.5" />

        {leftTools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            title={tool.label}
            onClick={() => {
              if (isReplayCutMode) onToggleReplayCutMode();
              setActiveTool(tool.id);
            }}
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors cursor-pointer ${
              activeTool === tool.id && !isReplayCutMode
                ? 'bg-[#2962FF] text-white'
                : 'text-[#B2B5BE] hover:bg-[#2A2E39] hover:text-white'
            }`}
          >
            {tool.icon}
          </button>
        ))}

        <div className="w-6 h-[1px] bg-[#2A2E39] my-0.5" />

        {/* Quick Auto-Snap Fibonacci button right on toolbar */}
        <button
          type="button"
          title="1-Click Auto-Snap Fibonacci to Recent Swings"
          onClick={handleCreateAutoSnapFibonacci}
          className="w-8 h-8 rounded flex items-center justify-center text-[#FFB300] hover:bg-[#FFB300]/20 hover:text-white transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        <button
          type="button"
          title={magnetEnabled ? 'Magnet Mode Active (Snaps to OHLC)' : 'Enable Magnet Mode'}
          onClick={() => setMagnetEnabled((v) => !v)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors cursor-pointer ${
            magnetEnabled ? 'bg-[#00E676] text-black font-bold' : 'text-[#B2B5BE] hover:bg-[#2A2E39] hover:text-white'
          }`}
        >
          <Magnet className="w-4 h-4" />
        </button>

        <button
          type="button"
          title={drawingsLocked ? 'Drawings Locked' : 'Lock Drawings'}
          onClick={() => setDrawingsLocked((v) => !v)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors cursor-pointer ${
            drawingsLocked ? 'bg-[#FF9100] text-black' : 'text-[#B2B5BE] hover:bg-[#2A2E39] hover:text-white'
          }`}
        >
          {drawingsLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>

        <button
          type="button"
          title={drawingsHidden ? 'Show Drawings' : 'Hide Drawings'}
          onClick={() => setDrawingsHidden((v) => !v)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors cursor-pointer ${
            drawingsHidden ? 'bg-[#F23645] text-white' : 'text-[#B2B5BE] hover:bg-[#2A2E39] hover:text-white'
          }`}
        >
          {drawingsHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        <button
          type="button"
          title="Undo Last Drawing"
          onClick={() => {
            setDrawings((prev) => prev.slice(0, -1));
            setSelectedDrawingId(null);
          }}
          className="w-8 h-8 rounded flex items-center justify-center text-[#B2B5BE] hover:bg-[#2A2E39] hover:text-white cursor-pointer"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          title="Clear All Drawings"
          onClick={() => {
            setDrawings([]);
            setSelectedDrawingId(null);
          }}
          className="w-8 h-8 rounded flex items-center justify-center text-[#B2B5BE] hover:bg-[#F23645]/20 hover:text-[#F23645] cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="mt-auto flex flex-col items-center gap-1">
          <button
            type="button"
            title="Full Screen Chart"
            onClick={onToggleFullWindowChart}
            className="w-8 h-8 rounded flex items-center justify-center text-[#00E676] bg-[#089981]/15 hover:bg-[#2962FF] hover:text-white cursor-pointer"
          >
            {isFullWindowChart ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWING TOOL TOGGLE BUTTON */}
      <button
        type="button"
        onClick={() => setMobileDrawOpen((v) => !v)}
        className="sm:hidden absolute top-12 left-2 z-30 p-1.5 rounded-lg bg-[#181C27]/95 border border-[#2A2E39] text-[#B2B5BE] hover:text-white shadow-xl pointer-events-auto flex items-center gap-1 text-[11px]"
        title="Toggle Drawing Tools on Mobile"
      >
        <PenTool className="w-3.5 h-3.5 text-[#FFB300]" />
        <span className="text-[10px] text-[#94A3B8]">Draw</span>
      </button>

      {/* MOBILE SLIDE-OUT DRAWING PALETTE */}
      {mobileDrawOpen && (
        <div className="sm:hidden absolute top-20 left-2 z-40 bg-[#181C27]/98 border border-[#2A2E39] rounded-xl p-2.5 shadow-2xl flex flex-col gap-1.5 backdrop-blur-xl animate-fadeIn pointer-events-auto max-w-[200px]">
          <div className="flex items-center justify-between pb-1 border-b border-[#2A2E39] text-[10px] text-[#94A3B8] font-bold">
            <span>Chart Drawing Tools</span>
            <button onClick={() => setMobileDrawOpen(false)} className="text-[#787B86] hover:text-white px-1">✕</button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {leftTools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                title={tool.label}
                onClick={() => {
                  if (isReplayCutMode) onToggleReplayCutMode();
                  setActiveTool(tool.id);
                  setMobileDrawOpen(false);
                }}
                className={`p-1.5 rounded-lg flex items-center justify-center border transition-all ${
                  activeTool === tool.id
                    ? 'bg-[#2962FF] border-[#60A5FA] text-white shadow'
                    : 'bg-[#1E222D] border-[#2A2E39] text-[#B2B5BE] hover:text-white'
                }`}
              >
                {tool.icon}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MAIN CHART AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <div className="flex-1 relative min-h-0">
          <div ref={chartContainerRef} className="w-full h-full" />

          {/* CLEAN RESPONSIVE TOP-RIGHT ON-CHART CONTROLS (HORIZONTAL TOUCH CAROUSEL ON MOBILE) */}
          <div className="absolute top-2.5 right-2 left-2 sm:left-auto sm:right-3 z-30 flex items-center justify-start sm:justify-end gap-1.5 pointer-events-none max-w-full overflow-x-auto no-scrollbar py-0.5 whitespace-nowrap">
            {/* Live Candle Countdown Timer */}
            <div
              title="Time remaining until current timeframe candle closes"
              className="pointer-events-auto px-2 py-1 rounded-md bg-[#1E222D]/95 border border-[#2A2E39] text-xs font-mono flex items-center gap-1.5 shadow-lg shrink-0"
            >
              <Clock className="w-3.5 h-3.5 text-[#00E676]" />
              <span className="text-[#94A3B8] text-[11px]">{timeframe}:</span>
              <span className="font-bold text-white text-[11px]">{candleCountdown}</span>
            </div>

            {/* Pair Mastery Playbook Trigger */}
            {onOpenPairPlaybook && (
              <button
                type="button"
                onClick={onOpenPairPlaybook}
                className="pointer-events-auto px-2.5 py-1 rounded-md bg-purple-500/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer shrink-0"
                title={`Open institutional trading playbook for ${symbol}`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>📘 {symbol === 'XAU/USD' ? 'Gold Playbook' : 'BTC Playbook'}</span>
              </button>
            )}

            {/* Auto Backtest Deep Scanner Modal Trigger */}
            {onOpenAutoBacktestReport && (
              <button
                type="button"
                onClick={onOpenAutoBacktestReport}
                className="pointer-events-auto px-2.5 py-1 rounded-md bg-[#2962FF]/20 hover:bg-[#2962FF] text-[#60A5FA] hover:text-white border border-[#2962FF]/40 text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer shrink-0"
                title="Open 3-Month Deep Auto-Backtest & Strategy Confluence Analysis"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>📊 Auto Backtest</span>
              </button>
            )}

            {/* Toggle On-Chart Educational Backtest Lessons */}
            <button
              type="button"
              onClick={toggleLessonsMode}
              className={`pointer-events-auto px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 border shadow-lg transition-all cursor-pointer shrink-0 ${
                showLessonsMode
                  ? 'bg-[#AB47BC] border-[#E1BEE7] text-white shadow-lg shadow-[#AB47BC]/40'
                  : 'bg-[#1E222D]/95 hover:bg-[#2A2E39] border-[#2A2E39] text-[#E1BEE7]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#FFB300]" />
              <span>{showLessonsMode ? '🎓 Mentor: ON' : '🎓 Mentor'}</span>
            </button>

            {/* Toggle Auto AI High-Impact SMC (FVG/BOS/Signals) */}
            <button
              type="button"
              onClick={toggleHighImpactSmc}
              className={`pointer-events-auto px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 border shadow-lg transition-all cursor-pointer shrink-0 ${
                showHighImpactSmc
                  ? 'bg-[#00E676] border-[#00E676] text-black shadow-[#00E676]/30'
                  : 'bg-[#1E222D]/95 hover:bg-[#2A2E39] border-[#2A2E39] text-[#00E676]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>
                {showHighImpactSmc
                  ? `⚡ SMC: ON (${smcData.fvgs.length + smcData.bosLevels.length + smcData.aiSignals.length})`
                  : '⚡ SMC: OFF'}
              </span>
            </button>

            {/* 🎯 NEW: Dedicated Toggle for Exact Perfect Entry Place Symbols & Trigger Lines */}
            <button
              type="button"
              onClick={togglePerfectEntrySymbols}
              className={`pointer-events-auto px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 border shadow-lg transition-all cursor-pointer shrink-0 ${
                showPerfectEntrySymbols
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 border-sky-400 text-white shadow-sky-500/40'
                  : 'bg-[#1E222D]/95 hover:bg-[#2A2E39] border-[#2A2E39] text-sky-400'
              }`}
              title="Toggle Exact Perfect Entry Place Symbols (🎯 Pinpoint entry crosshairs, price trigger levels, and R:R brackets)"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>{showPerfectEntrySymbols ? '🎯 Entry Symbol: ON' : '🎯 Entry Symbol: OFF'}</span>
            </button>

            {/* Toggle Confirmation Circles (High Probability Markers) */}
            <button
              type="button"
              onClick={toggleConfirmationCircles}
              className={`pointer-events-auto px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 border shadow-lg transition-all cursor-pointer shrink-0 ${
                showConfirmationCircles
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-emerald-500/20'
                  : 'bg-[#1E222D]/95 hover:bg-[#2A2E39] border-[#2A2E39] text-[#787B86]'
              }`}
              title="Toggle glowing circular rings around confirmation candles on the chart"
            >
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {showConfirmationCircles
                  ? `⭕ Circles: ON (${displayedConfirmationCircles.length})`
                  : '⭕ Circles: OFF'}
              </span>
            </button>

            {/* Toggle On-Chart Execution Block System (Entry Box / Safe SL Box / TP Boxes) */}
            <button
              type="button"
              onClick={() => setShowExecutionBlocks((v) => !v)}
              className={`pointer-events-auto px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 border shadow-lg transition-all cursor-pointer shrink-0 ${
                showExecutionBlocks
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-[#1E222D]/95 hover:bg-[#2A2E39] border-[#2A2E39] text-[#787B86]'
              }`}
              title="Toggle On-Chart Execution Block System (Entry Box, Safe SL Zone, TP Expansion Pools)"
            >
              <Square className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showExecutionBlocks ? '🧱 Blocks: ON' : '🧱 Blocks: OFF'}</span>
            </button>

            {/* Select & Cut Chart Candles */}
            <button
              type="button"
              onClick={onToggleReplayCutMode}
              className={`pointer-events-auto px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 border shadow-lg transition-all cursor-pointer shrink-0 ${
                isReplayCutMode
                  ? 'bg-[#2962FF] border-[#60A5FA] text-white animate-pulse'
                  : 'bg-[#1E222D]/95 hover:bg-[#2A2E39] border-[#2A2E39] text-[#00E676]'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>{isReplayCutMode ? 'Click Candle to Cut' : '✂ Cut'}</span>
            </button>

            {/* Full Screen Chart Button */}
            <button
              type="button"
              onClick={onToggleFullWindowChart}
              className="pointer-events-auto px-2.5 py-1 rounded-md bg-[#089981]/20 hover:bg-[#089981] text-[#00E676] hover:text-white border border-[#089981]/40 text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer shrink-0"
            >
              {isFullWindowChart ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullWindowChart ? 'Exit Full' : 'Full Chart'}</span>
            </button>
          </div>

          {/* TOP-LEFT OVERLAY: ONLY NON-INTRUSIVE ACTIVE INDICATOR CHIPS (NO CLASH WITH TOP TOOLS) */}
          <div className="absolute top-2.5 left-3 z-20 flex flex-wrap items-center gap-1.5 pointer-events-none">
            {indicators
              .filter((i) => i.visible && i.category !== 'Oscillator')
              .map((ind) => (
                <div
                  key={ind.id}
                  className="pointer-events-auto inline-flex items-center gap-1.5 text-[10px] font-mono text-[#B2B5BE] bg-[#131722]/90 border border-[#2A2E39] px-2 py-0.5 rounded shadow"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ind.color }} />
                  <span>{ind.shortName}</span>
                  <button
                    type="button"
                    onClick={() => onToggleIndicator(ind.id)}
                    className="opacity-70 hover:opacity-100 text-[#787B86] hover:text-white cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
          </div>

          {/* ACTIVE POSITION LIVE STATUS (ONLY WHEN A POSITION IS OPEN, ZERO OBSTRUCTION WHEN FLAT) */}
          {hasActiveTrade && (
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 pointer-events-auto select-none">
              <div className="px-3 py-1.5 rounded-md bg-[#1E222D]/95 border border-[#2962FF] flex items-center gap-2 font-mono text-xs shadow-xl backdrop-blur-md">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                    tradeDirection === 'LONG' ? 'bg-[#089981]' : 'bg-[#F23645]'
                  }`}
                >
                  {tradeDirection === 'LONG' ? 'BUY' : 'SELL'} {lotSize}
                </span>
                <span
                  className={`font-extrabold text-sm ${
                    activeTradePnl >= 0 ? 'text-[#00E676]' : 'text-[#F23645]'
                  }`}
                >
                  {activeTradePnl >= 0 ? '+' : ''}${activeTradePnl.toFixed(2)} ({activeTradeR >= 0 ? '+' : ''}
                  {activeTradeR}R)
                </span>
                {onMoveToBreakeven && (
                  <button
                    type="button"
                    onClick={onMoveToBreakeven}
                    className="px-2 py-0.5 rounded bg-[#2962FF]/25 hover:bg-[#2962FF] text-[#60A5FA] hover:text-white text-[10px] font-bold cursor-pointer"
                  >
                    BE
                  </button>
                )}
                {onPartialClose50 && (
                  <button
                    type="button"
                    onClick={onPartialClose50}
                    className="px-2 py-0.5 rounded bg-[#089981]/25 hover:bg-[#089981] text-[#00E676] hover:text-white text-[10px] font-bold cursor-pointer"
                  >
                    50%
                  </button>
                )}
                {onClosePosition && (
                  <button
                    type="button"
                    onClick={onClosePosition}
                    className="px-2 py-0.5 rounded bg-[#F23645] hover:bg-[#D92B3A] text-white text-[10px] font-bold cursor-pointer"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          )}

          {/* FLOATING PRO ZOOM & SCALE CONTROLS (DEEP CANDLE ZOOM & MACRO VIEW) */}
          <div className="absolute bottom-20 right-3 z-30 flex flex-col items-center gap-1.5 bg-[#181C27]/95 border border-[#2A2E39] p-1.5 rounded-xl shadow-2xl backdrop-blur-md pointer-events-auto select-none">
            {/* Zoom In Button */}
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom In (+) - Inspect individual candle wicks and entry details deeply"
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1E222D] hover:bg-[#2962FF] text-[#00E676] hover:text-white border border-[#2A2E39] transition-all cursor-pointer shadow active:scale-95"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* Zoom Out Button */}
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom Out (-) - View macro market structure and swing points"
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1E222D] hover:bg-[#2962FF] text-[#94A3B8] hover:text-white border border-[#2A2E39] transition-all cursor-pointer shadow active:scale-95"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            {/* Fit / Reset Zoom Button */}
            <button
              type="button"
              onClick={handleResetZoom}
              title="Fit Chart / Reset Zoom (⟲)"
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1E222D] hover:bg-[#2962FF] text-amber-400 hover:text-amber-300 border border-[#2A2E39] transition-all cursor-pointer shadow active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Auto-Scale Vertical Price Axis Button */}
            <button
              type="button"
              onClick={handleAutoScalePrice}
              title="Auto-Scale Price (⇕) - Fit vertical candle amplitude"
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1E222D] hover:bg-[#2962FF] text-[#38BDF8] hover:text-white border border-[#2A2E39] transition-all cursor-pointer shadow active:scale-95"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* EXNESS ORDER CONFIRMATION PILL */}
          {isDraftMode && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-[#1E222D]/95 border-2 border-[#2962FF] rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-white font-extrabold ${
                    effectiveDir === 'LONG' ? 'bg-[#089981]' : 'bg-[#F23645]'
                  }`}
                >
                  {effectiveDir === 'LONG' ? 'BUY' : 'SELL'} {effectiveLots} LOT
                </span>
                <span className="text-white font-bold">@ {orderRefPrice.toFixed(decimals)}</span>
              </div>

              <div className="flex items-center gap-3 border-l border-[#2A2E39] pl-3">
                <span className="text-[#F23645] font-bold">
                  Risk: -${slDollar.toFixed(2)} ({slPips.toFixed(1)} pips)
                </span>
                <span className="text-[#00E676] font-bold">
                  Target: +${tpDollar.toFixed(2)} (1:{liveRrVal} R:R)
                </span>
              </div>

              <div className="flex items-center gap-2 border-l border-[#2A2E39] pl-3">
                <button
                  type="button"
                  onClick={onConfirmDraftOrder}
                  className={`px-4 py-1.5 rounded-lg text-white font-extrabold flex items-center gap-1.5 shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95 ${
                    effectiveDir === 'LONG' ? 'bg-[#089981] hover:bg-[#067F6B]' : 'bg-[#F23645] hover:bg-[#D92B3A]'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>CONFIRM {effectiveDir === 'LONG' ? 'BUY' : 'SELL'}</span>
                </button>

                <button
                  type="button"
                  onClick={onCancelDraftOrder}
                  className="px-2.5 py-1.5 rounded-lg bg-[#2A2E39] hover:bg-[#363A45] text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* INTERACTIVE DRAGGABLE TRADE LINES (EXNESS BRACKET) */}
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            {lineCoordinates.entryY !== null && lineCoordinates.tpY !== null && (
              <div
                style={{
                  top: Math.min(lineCoordinates.entryY, lineCoordinates.tpY),
                  height: Math.abs(lineCoordinates.tpY - lineCoordinates.entryY),
                }}
                className="absolute left-0 right-[70px] bg-[#089981]/12 border-x border-[#089981]/30 pointer-events-none"
              />
            )}

            {lineCoordinates.entryY !== null && lineCoordinates.slY !== null && (
              <div
                style={{
                  top: Math.min(lineCoordinates.entryY, lineCoordinates.slY),
                  height: Math.abs(lineCoordinates.slY - lineCoordinates.entryY),
                }}
                className="absolute left-0 right-[70px] bg-[#F23645]/12 border-x border-[#F23645]/30 pointer-events-none"
              />
            )}

            {/* 1. Take Profit Line */}
            {lineCoordinates.tpY !== null && effectiveTp && (
              <div
                style={{ top: lineCoordinates.tpY }}
                className="absolute left-0 right-0 -translate-y-1/2 flex items-center"
              >
                <div className="flex-1 border-t-2 border-dashed border-[#00E676]" />
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingTradeLine('TP');
                  }}
                  title="Drag up or down to adjust Take Profit"
                  className="pointer-events-auto mr-[70px] flex items-center bg-[#131722] border-2 border-[#00E676] rounded shadow-xl text-[11px] font-mono cursor-ns-resize select-none hover:scale-[1.02] transition-transform"
                >
                  <span className="px-2 py-0.5 bg-[#00E676] text-slate-950 font-extrabold">
                    TP (DRAG ⇅)
                  </span>
                  <span className="px-2 py-0.5 text-[#00E676] font-bold">
                    +${tpDollar.toFixed(2)} (1:{liveRrVal}R)
                  </span>
                  <span className="px-2 py-0.5 border-l border-[#2A2E39] text-white">
                    {effectiveTp.toFixed(decimals)}
                  </span>
                </div>
              </div>
            )}

            {/* 2. Stop Loss Line */}
            {lineCoordinates.slY !== null && effectiveSl && (
              <div
                style={{ top: lineCoordinates.slY }}
                className="absolute left-0 right-0 -translate-y-1/2 flex items-center"
              >
                <div className="flex-1 border-t-2 border-dashed border-[#F23645]" />
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingTradeLine('SL');
                  }}
                  title="Drag up or down to adjust Stop Loss"
                  className="pointer-events-auto mr-[70px] flex items-center bg-[#131722] border-2 border-[#F23645] rounded shadow-xl text-[11px] font-mono cursor-ns-resize select-none hover:scale-[1.02] transition-transform"
                >
                  <span className="px-2 py-0.5 bg-[#F23645] text-white font-bold">
                    SL (DRAG ⇅)
                  </span>
                  <span className="px-2 py-0.5 text-[#F23645] font-bold">
                    -${slDollar.toFixed(2)}
                  </span>
                  <span className="px-2 py-0.5 border-l border-[#2A2E39] text-white">
                    {effectiveSl.toFixed(decimals)}
                  </span>
                  {hasActiveTrade && onMoveToBreakeven && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={onMoveToBreakeven}
                      className="px-2 py-0.5 bg-[#2962FF] text-white font-bold border-l border-[#2A2E39] cursor-pointer"
                    >
                      BE
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 3. Entry Line */}
            {lineCoordinates.entryY !== null && effectiveEntry && (
              <div
                style={{ top: lineCoordinates.entryY }}
                className="absolute left-0 right-0 -translate-y-1/2 flex items-center"
              >
                <div
                  className={`flex-1 border-t-2 ${
                    effectiveDir === 'LONG' ? 'border-[#2962FF]' : 'border-[#F23645]'
                  }`}
                />
                <div
                  onMouseDown={(e) => {
                    if (isDraftMode || (!hasActiveTrade && onUpdateEntryPrice)) {
                      e.stopPropagation();
                      setDraggingTradeLine('ENTRY');
                    }
                  }}
                  className={`pointer-events-auto mr-[70px] flex items-center bg-[#131722] border-2 rounded shadow-xl text-[11px] font-mono select-none ${
                    effectiveDir === 'LONG' ? 'border-[#2962FF]' : 'border-[#F23645]'
                  } ${isDraftMode ? 'cursor-ns-resize' : ''}`}
                >
                  <span
                    className={`px-2 py-0.5 font-bold text-white ${
                      effectiveDir === 'LONG' ? 'bg-[#2962FF]' : 'bg-[#F23645]'
                    }`}
                  >
                    {isDraftMode
                      ? `PENDING ${effectiveDir}`
                      : isPendingOrder
                      ? `LIMIT ${effectiveDir}`
                      : effectiveDir === 'LONG'
                      ? 'BUY'
                      : 'SELL'}{' '}
                    {effectiveLots}
                  </span>

                  {hasActiveTrade ? (
                    <span
                      className={`px-2 py-0.5 font-extrabold ${
                        activeTradePnl >= 0 ? 'text-[#00E676]' : 'text-[#F23645]'
                      }`}
                    >
                      {activeTradePnl >= 0 ? '+' : ''}${activeTradePnl.toFixed(2)} ({activeTradeR}R)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-white">@ {effectiveEntry.toFixed(decimals)}</span>
                  )}

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingTradeLine('TP');
                    }}
                    title="Drag to adjust Take Profit"
                    className="px-1.5 py-0.5 text-[#00E676] hover:bg-[#089981]/20 border-l border-[#2A2E39] font-bold cursor-ns-resize"
                  >
                    +TP
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingTradeLine('SL');
                    }}
                    title="Drag to adjust Stop Loss"
                    className="px-1.5 py-0.5 text-[#F23645] hover:bg-[#F23645]/20 border-l border-[#2A2E39] font-bold cursor-ns-resize"
                  >
                    +SL
                  </button>
                </div>
              </div>
            )}

            {/* 4. AI Auto-Mark Setup Lines */}
            {aiAutoMark && lineCoordinates.aiEntryY !== null && (
              <>
                {lineCoordinates.aiTpY !== null && (
                  <div
                    style={{ top: lineCoordinates.aiTpY }}
                    className="absolute left-14 right-[70px] -translate-y-1/2 flex items-center"
                  >
                    <div className="flex-1 border-t-2 border-dashed border-[#00E676]" />
                    <span className="px-2 py-0.5 rounded bg-[#089981] text-white font-mono text-[10px] font-bold shadow">
                      ▲ AI TP: {aiAutoMark.takeProfit.toFixed(decimals)} (1:{aiAutoMark.rrRatio}R)
                    </span>
                  </div>
                )}
                <div
                  style={{ top: lineCoordinates.aiEntryY }}
                  className="absolute left-14 right-[70px] -translate-y-1/2 flex items-center"
                >
                  <div className="flex-1 border-t-2 border-[#2962FF]" />
                  <div className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2962FF] text-white font-mono text-[11px] font-bold shadow-xl">
                    <span>
                      🎯 AI {aiAutoMark.direction}: {aiAutoMark.entryPrice.toFixed(decimals)}
                    </span>
                    {onExecuteAiSetupNow && (
                      <button
                        type="button"
                        onClick={() => onExecuteAiSetupNow(aiAutoMark)}
                        className="px-2 py-0.5 rounded bg-[#00E676] text-slate-950 font-extrabold cursor-pointer hover:opacity-95"
                      >
                        Execute
                      </button>
                    )}
                    {onClearAiAutoMark && (
                      <button type="button" onClick={onClearAiAutoMark} className="opacity-80 hover:opacity-100 cursor-pointer">
                        ×
                      </button>
                    )}
                  </div>
                </div>
                {lineCoordinates.aiSlY !== null && (
                  <div
                    style={{ top: lineCoordinates.aiSlY }}
                    className="absolute left-14 right-[70px] -translate-y-1/2 flex items-center"
                  >
                    <div className="flex-1 border-t-2 border-dashed border-[#F23645]" />
                    <span className="px-2 py-0.5 rounded bg-[#F23645] text-white font-mono text-[10px] font-bold shadow">
                      ✕ AI SL: {aiAutoMark.stopLoss.toFixed(decimals)}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* 5. Bar Replay Cut Curtain */}
            {isReplayCutMode && crosshairPos && (
              <div
                style={{ left: crosshairPos.x }}
                className="absolute top-0 bottom-0 right-[65px] bg-[#2962FF]/15 border-l-2 border-[#2962FF] pointer-events-none flex flex-col items-start"
              >
                <div className="mt-14 -ml-3 px-3 py-1.5 rounded-lg bg-[#2962FF] text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-2xl whitespace-nowrap">
                  <Scissors className="w-4 h-4" />
                  <span>
                    Click to Cut {candlesToCutCount > 0 ? `(${candlesToCutCount} Candles)` : ''}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* INTERACTIVE SVG LAYER (Clean SMC Detection, TradingView Fibonacci & Backtest Mentor) */}
          <svg
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            className={`absolute inset-0 w-full h-full z-10 ${
              isReplayCutMode || activeTool !== 'cursor'
                ? 'pointer-events-auto cursor-crosshair'
                : 'pointer-events-none'
            }`}
          >
            <defs>
              <pattern id="diagonalHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#F23645" strokeWidth="1" strokeOpacity="0.4" />
              </pattern>
            </defs>

            {/* 1. AUTO AI DETECTION OF HIGH-IMPACT FVG, BOS, CHOCH, SIGNALS & NO-TRADE ZONES */}
            {showHighImpactSmc && (
              <g className="pointer-events-none">
                {/* No-Trade Choppy Zones */}
                {smcData.noTradeZones.map((z) => {
                  const x1 = getXFromTime(z.startTime, 0);
                  const x2 = getXFromTime(z.endTime, 100);
                  const y1 = getYFromPrice(z.topPrice, 0);
                  const y2 = getYFromPrice(z.bottomPrice, 50);
                  const minX = Math.min(x1, x2);
                  const w = Math.max(40, Math.abs(x2 - x1));
                  const minY = Math.min(y1, y2);
                  const h = Math.max(14, Math.abs(y2 - y1));
                  return (
                    <g key={z.id}>
                      <rect x={minX} y={minY} width={w} height={h} fill="url(#diagonalHatch)" stroke="#F23645" strokeWidth="1" strokeDasharray="3 3" />
                      <rect x={minX + 4} y={minY + 3} width={52} height={14} rx={3} fill="#1E222D" stroke="#F23645" strokeWidth="0.8" />
                      <text x={minX + 8} y={minY + 13} fill="#F23645" fontSize="8.5" fontFamily="JetBrains Mono" fontWeight="bold">
                        ⛔ CHOP
                      </text>
                    </g>
                  );
                })}

                {/* Fair Value Gaps (FVG) - Short Clean Institutional Markings */}
                {smcData.fvgs.map((fvg) => {
                  const x1 = getXFromTime(fvg.startTime, 0);
                  const x2 = getXFromTime(fvg.endTime, 180);
                  const yTop = getYFromPrice(fvg.topPrice, 0);
                  const yBottom = getYFromPrice(fvg.bottomPrice, 40);
                  const isBull = fvg.type === 'BULLISH';
                  const minX = Math.min(x1, x2);
                  const w = Math.max(60, Math.abs(x2 - x1));
                  const minY = Math.min(yTop, yBottom);
                  const h = Math.max(8, Math.abs(yBottom - yTop));
                  const strokeColor = isBull ? '#00E676' : '#F23645';
                  const fillColor = isBull ? 'rgba(0, 230, 118, 0.14)' : 'rgba(242, 54, 69, 0.14)';

                  return (
                    <g key={fvg.id}>
                      <rect
                        x={minX}
                        y={minY}
                        width={w}
                        height={h}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={0.8}
                        strokeDasharray={fvg.mitigated ? '2 2' : undefined}
                      />
                      {/* Boundary lines */}
                      <line x1={minX} y1={yTop} x2={minX + w} y2={yTop} stroke={strokeColor} strokeWidth={1} />
                      <line x1={minX} y1={yBottom} x2={minX + w} y2={yBottom} stroke={strokeColor} strokeWidth={1} />
                      {/* Short clean tag */}
                      <rect x={minX + 4} y={minY + 2} width={36} height={13} rx={2} fill="#131722" stroke={strokeColor} strokeWidth={0.8} />
                      <text x={minX + 8} y={minY + 11} fill={strokeColor} fontSize="8.5" fontFamily="JetBrains Mono" fontWeight="bold">
                        FVG
                      </text>
                    </g>
                  );
                })}

                {/* Break of Structure (BOS) Lines - Clean Short Name */}
                {smcData.bosLevels.map((bos) => {
                  const x = getXFromTime(bos.time, 0);
                  const y = getYFromPrice(bos.price, 0);
                  const isBull = bos.type === 'BULLISH';
                  const color = isBull ? '#00E676' : '#F23645';

                  return (
                    <g key={bos.id}>
                      <line x1={x} y1={y} x2={x + 140} y2={y} stroke={color} strokeWidth={1.2} strokeDasharray="3 3" />
                      <rect x={x + 4} y={y - 12} width={34} height={13} rx={2} fill="#131722" stroke={color} strokeWidth={0.8} />
                      <text x={x + 8} y={y - 3} fill={color} fontSize="8.5" fontFamily="JetBrains Mono" fontWeight="bold">
                        BOS
                      </text>
                    </g>
                  );
                })}

                {/* Change of Character (CHoCH) Lines */}
                {smcData.chochLevels?.map((choch) => {
                  const x = getXFromTime(choch.time, 0);
                  const y = getYFromPrice(choch.price, 0);
                  const isBull = choch.type === 'BULLISH';
                  const color = isBull ? '#00E5FF' : '#AB47BC';

                  return (
                    <g key={choch.id}>
                      <line x1={x} y1={y} x2={x + 160} y2={y} stroke={color} strokeWidth={1.5} strokeDasharray="4 3" />
                      <rect x={x + 4} y={y - 12} width={42} height={13} rx={2} fill="#131722" stroke={color} strokeWidth={0.8} />
                      <text x={x + 7} y={y - 3} fill={color} fontSize="8.5" fontFamily="JetBrains Mono" fontWeight="bold">
                        CHoCH
                      </text>
                    </g>
                  );
                })}

                {/* Liquidity Sweeps - Clean Short Name */}
                {smcData.sweeps.map((sw) => {
                  const x = getXFromTime(sw.time, 0);
                  const y = getYFromPrice(sw.price, 0);
                  const isBull = sw.type === 'BULLISH_SWEEP';
                  const color = isBull ? '#00E676' : '#FF1744';

                  return (
                    <g key={sw.id}>
                      <circle cx={x} cy={y} r={3.5} fill={color} stroke="#FFFFFF" strokeWidth={1} />
                      <line x1={x - 8} y1={y} x2={x + 8} y2={y} stroke={color} strokeWidth={1} />
                      <rect x={x - 22} y={isBull ? y + 6 : y - 18} width={44} height={13} rx={2} fill="#1E222D" stroke={color} strokeWidth={0.8} />
                      <text x={x - 18} y={isBull ? y + 15 : y - 9} fill={color} fontSize="8" fontFamily="JetBrains Mono" fontWeight="bold">
                        ✕ SWEEP
                      </text>
                    </g>
                  );
                })}

                {/* Target Liquidity Pools (Take Profit Zones) */}
                {smcData.tpTargetZones?.map((tz) => {
                  const y = getYFromPrice(tz.price, 0);
                  const isBull = tz.type === 'BULLISH_TARGET';
                  const color = isBull ? '#00E676' : '#FFB300';
                  return (
                    <g key={tz.id}>
                      <line x1={40} y1={y} x2="98%" y2={y} stroke={color} strokeWidth={1} strokeDasharray="3 3" />
                      <rect x={70} y={y - 10} width={70} height={13} rx={2} fill="#131722" stroke={color} strokeWidth={0.8} />
                      <text x={74} y={y} fill={color} fontSize="8" fontFamily="JetBrains Mono" fontWeight="bold">
                        🎯 TP TARGET
                      </text>
                    </g>
                  );
                })}

                {/* AI TRADE CONFIRMATION SIGNALS DIRECTLY ON CANDLE (CLEAN COMPACT) */}
                {smcData.aiSignals?.map((sig) => {
                  const x = getXFromTime(sig.candleTime, 0);
                  const entryY = getYFromPrice(sig.entryPrice, 0);
                  const slY = getYFromPrice(sig.stopLoss, 0);
                  const isBuy = sig.direction === 'BUY';
                  const badgeY = isBuy ? slY + 16 : slY - 20;

                  return (
                    <g
                      key={sig.id}
                      className="pointer-events-auto cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectedSignal(sig);
                      }}
                    >
                      {/* Compact Direction Badge */}
                      <rect
                        x={x - 22}
                        y={badgeY}
                        width={44}
                        height={16}
                        rx={3}
                        fill={isBuy ? '#089981' : '#F23645'}
                        stroke="#FFFFFF"
                        strokeWidth={1}
                        className="shadow"
                      />
                      <text
                        x={x - 17}
                        y={badgeY + 11}
                        fill="#FFFFFF"
                        fontSize="9"
                        fontFamily="JetBrains Mono"
                        fontWeight="bold"
                      >
                        {isBuy ? '▲ BUY' : '▼ SELL'}
                      </text>

                      {/* Small Direction Arrow pointing to wick */}
                      <polygon
                        points={
                          isBuy
                            ? `${x},${entryY + 4} ${x - 4},${badgeY} ${x + 4},${badgeY}`
                            : `${x},${entryY - 4} ${x - 4},${badgeY + 16} ${x + 4},${badgeY + 16}`
                        }
                        fill={isBuy ? '#089981' : '#F23645'}
                      />
                    </g>
                  );
                })}
              </g>
            )}

            {/* 2. NUMBERED INTERACTIVE EDUCATIONAL LESSON PINS (BACKTEST MENTOR) */}
            {showLessonsMode &&
              effectiveLessons.map((lesson) => {
                const x = getXFromTime(lesson.candleTime, 0);
                const y = getYFromPrice(lesson.entryPrice, 50);
                const isSelected = activeLesson?.id === lesson.id;
                const isBuy = lesson.direction === 'BUY';

                return (
                  <g
                    key={lesson.id}
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectLesson(lesson);
                    }}
                  >
                    <rect
                      x={x - 40}
                      y={isBuy ? y + 16 : y - 32}
                      width={80}
                      height={18}
                      rx={3}
                      fill={isSelected ? '#FFB300' : '#AB47BC'}
                      stroke="#FFFFFF"
                      strokeWidth={isSelected ? 1.5 : 0.8}
                      className="shadow-xl"
                    />
                    <text
                      x={x - 34}
                      y={isBuy ? y + 29 : y - 19}
                      fill={isSelected ? '#000000' : '#FFFFFF'}
                      fontSize="9"
                      fontFamily="JetBrains Mono"
                      fontWeight="bold"
                    >
                      🎓 Lesson #{lesson.lessonNumber}
                    </text>
                    <polygon
                      points={
                        isBuy
                          ? `${x},${y + 10} ${x - 4},${y + 16} ${x + 4},${y + 16}`
                          : `${x},${y - 8} ${x - 4},${y - 14} ${x + 4},${y - 14}`
                      }
                      fill={isSelected ? '#FFB300' : '#AB47BC'}
                    />

                    {/* Highlighted Confirmation Candle Halo */}
                    {isSelected && (
                      <g className="pointer-events-none animate-pulse">
                        <circle cx={x} cy={y} r={14} fill="none" stroke="#FFB300" strokeWidth={2} strokeDasharray="3 3" />
                      </g>
                    )}
                  </g>
                );
              })}

            {/* 2B. INTERACTIVE 99% A+ SNIPER EXECUTION BLOCKS & CONFIRMATION CIRCLES */}
            {showConfirmationCircles &&
              displayedConfirmationCircles.map((circle) => {
                const x = getXFromTime(circle.candleTime, 0);
                const y = getYFromPrice(circle.price, 0);
                const isBull = circle.direction === 'BULLISH';
                const ringColor = circle.color || (isBull ? '#00E676' : '#FF1744');
                const badgeY = isBull ? y + circle.radius + 6 : y - circle.radius - 22;
                const isAplus = circle.isSniperAplus;

                return (
                  <g key={circle.id}>
                    {/* Execution Block System: Entry Box */}
                    {showExecutionBlocks && circle.entryBox && (() => {
                      const ebX1 = getXFromTime(circle.entryBox.startTime, 0);
                      const ebW = Math.max(80, Math.min(260, 180));
                      const ebYTop = getYFromPrice(circle.entryBox.topPrice, 0);
                      const ebYBottom = getYFromPrice(circle.entryBox.bottomPrice, 30);
                      const minY = Math.min(ebYTop, ebYBottom);
                      const h = Math.max(12, Math.abs(ebYBottom - ebYTop));
                      const fillColor = isBull ? 'rgba(0, 230, 118, 0.16)' : 'rgba(255, 23, 68, 0.16)';
                      const strokeColor = isBull ? '#00E676' : '#FF1744';

                      return (
                        <g key={`entrybox_${circle.id}`} className="pointer-events-none">
                          <rect
                            x={ebX1}
                            y={minY}
                            width={ebW}
                            height={h}
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={1.2}
                            rx={2}
                            strokeDasharray="4 2"
                          />
                          <rect
                            x={ebX1 + 4}
                            y={minY - 14}
                            width={130}
                            height={14}
                            rx={2}
                            fill="#131722"
                            stroke={strokeColor}
                            strokeWidth={0.8}
                          />
                          <text
                            x={ebX1 + 8}
                            y={minY - 3}
                            fill={strokeColor}
                            fontSize="8"
                            fontFamily="JetBrains Mono"
                            fontWeight="bold"
                          >
                            🎯 99% SNIPER ENTRY BLOCK
                          </text>
                        </g>
                      );
                    })()}

                    {/* Execution Block System: Safe Stop Loss Line & Protected Shield */}
                    {showExecutionBlocks && circle.stopLossBox && (() => {
                      const slX = getXFromTime(circle.candleTime, 0);
                      const slY = getYFromPrice(circle.stopLossBox.invalidationPrice, 0);
                      return (
                        <g key={`slbox_${circle.id}`} className="pointer-events-none">
                          <line
                            x1={slX - 10}
                            y1={slY}
                            x2={slX + 160}
                            y2={slY}
                            stroke="#FF1744"
                            strokeWidth={1.5}
                            strokeDasharray="3 3"
                          />
                          <rect
                            x={slX}
                            y={isBull ? slY + 2 : slY - 14}
                            width={120}
                            height={13}
                            rx={2}
                            fill="#1E222D"
                            stroke="#FF1744"
                            strokeWidth={0.8}
                          />
                          <text
                            x={slX + 4}
                            y={isBull ? slY + 11 : slY - 4}
                            fill="#FF1744"
                            fontSize="7.5"
                            fontFamily="JetBrains Mono"
                            fontWeight="bold"
                          >
                            🛡️ SAFE SL ({circle.stopLossBox.invalidationPrice})
                          </text>
                        </g>
                      );
                    })()}

                    {/* Execution Block System: Target Expansion Pools (TP1 / TP2) */}
                    {showExecutionBlocks &&
                      circle.targetBoxes?.slice(0, 2).map((tb, ti) => {
                        const tpX = getXFromTime(circle.candleTime, 0);
                        const tpY = getYFromPrice(tb.price, 0);
                        return (
                          <g key={`target_${circle.id}_${ti}`} className="pointer-events-none">
                            <line
                              x1={tpX}
                              y1={tpY}
                              x2={tpX + 180}
                              y2={tpY}
                              stroke="#00E676"
                              strokeWidth={1}
                              strokeDasharray="4 3"
                            />
                            <rect
                              x={tpX + 30}
                              y={tpY - 11}
                              width={125}
                              height={13}
                              rx={2}
                              fill="#131722"
                              stroke="#00E676"
                              strokeWidth={0.8}
                            />
                            <text
                              x={tpX + 34}
                              y={tpY - 1}
                              fill="#00E676"
                              fontSize="7.5"
                              fontFamily="JetBrains Mono"
                              fontWeight="bold"
                            >
                              {tb.label}
                            </text>
                          </g>
                        );
                      })}

                    {/* DEDICATED 🎯 PERFECT ENTRY PLACE SYMBOL & HORIZONTAL TRIGGER LEVEL (সঠিক এন্ট্রি নেওয়ার নির্দিষ্ট স্থান ও সিম্বল) */}
                    {showPerfectEntrySymbols && (() => {
                      const entryPrice = circle.prediction?.entryPrice || circle.price;
                      const entryY = getYFromPrice(entryPrice, y);
                      const slY = getYFromPrice(
                        circle.prediction?.stopLoss || circle.stopLossBox?.invalidationPrice || (isBull ? entryPrice - 50 : entryPrice + 50),
                        isBull ? y + 45 : y - 45
                      );
                      const tpY = getYFromPrice(
                        circle.prediction?.takeProfit1 || (circle.targetBoxes?.[0]?.price || (isBull ? entryPrice + 100 : entryPrice - 100)),
                        isBull ? y - 60 : y + 60
                      );
                      const entryColor = isBull ? '#00E676' : '#FF1744';

                      return (
                        <g key={`perfect_entry_${circle.id}`}>
                          {/* Visual Risk-Reward Shaded Bracket Area */}
                          <g className="pointer-events-none opacity-20">
                            {/* Risk Zone (Entry to SL) Shading */}
                            <rect
                              x={x}
                              y={Math.min(entryY, slY)}
                              width={75}
                              height={Math.max(4, Math.abs(entryY - slY))}
                              fill="rgba(242, 54, 69, 0.28)"
                              stroke="#FF1744"
                              strokeWidth={0.8}
                              strokeDasharray="2 2"
                            />
                            {/* Reward Zone (Entry to TP) Shading */}
                            <rect
                              x={x}
                              y={Math.min(entryY, tpY)}
                              width={75}
                              height={Math.max(4, Math.abs(entryY - tpY))}
                              fill="rgba(0, 230, 118, 0.28)"
                              stroke="#00E676"
                              strokeWidth={0.8}
                              strokeDasharray="2 2"
                            />
                          </g>

                          {/* Horizontal Solid/Neon Entry Trigger Line */}
                          <line
                            x1={x}
                            y1={entryY}
                            x2={x + 200}
                            y2={entryY}
                            stroke={entryColor}
                            strokeWidth={2}
                            strokeDasharray="5 2"
                            className="pointer-events-none"
                          />

                          {/* Prominent High-Visibility Entry Badge & Label */}
                          <g
                            className="pointer-events-auto cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectedEntryCircle(circle);
                            }}
                          >
                            <rect
                              x={x + 6}
                              y={entryY - 14}
                              width={160}
                              height={26}
                              rx={4}
                              fill="#0B0E14"
                              stroke={entryColor}
                              strokeWidth={1.8}
                              className="shadow-2xl"
                            />
                            <text
                              x={x + 12}
                              y={entryY - 1}
                              fill={isBull ? '#00E676' : '#FF5252'}
                              fontSize="9.5"
                              fontFamily="JetBrains Mono"
                              fontWeight="bold"
                            >
                              {isBull ? '🎯 PERFECT BUY ENTRY' : '🎯 PERFECT SELL ENTRY'}
                            </text>
                            <text
                              x={x + 12}
                              y={entryY + 9}
                              fill="#FFFFFF"
                              fontSize="8"
                              fontFamily="JetBrains Mono"
                              fontWeight="bold"
                            >
                              @{entryPrice.toFixed(decimals)} (1:{circle.prediction.riskRewardRatio}R)
                            </text>

                            {/* Pulsing Beacon Indicator */}
                            <circle cx={x + 152} cy={entryY - 1} r={3} fill={entryColor} className="animate-ping" />
                          </g>

                          {/* Dedicated Pinpoint Target Crosshair Symbol Directly at Entry Candle & Price */}
                          <g
                            className="pointer-events-auto cursor-pointer group"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectedEntryCircle(circle);
                            }}
                          >
                            {/* Core Disc */}
                            <circle
                              cx={x}
                              cy={entryY}
                              r={8}
                              fill={isBull ? 'rgba(0, 230, 118, 0.4)' : 'rgba(255, 23, 68, 0.4)'}
                              stroke="#FFFFFF"
                              strokeWidth={1.8}
                              className="group-hover:scale-125 transition-transform"
                            />
                            {/* Crosshairs */}
                            <line x1={x - 12} y1={entryY} x2={x + 12} y2={entryY} stroke="#FFFFFF" strokeWidth={1.4} />
                            <line x1={x} y1={entryY - 12} x2={x} y2={entryY + 12} stroke="#FFFFFF" strokeWidth={1.4} />
                            <circle cx={x} cy={entryY} r={2.5} fill="#FFFFFF" />

                            {/* Direction Entry Chevron pointing directly at entry price */}
                            <polygon
                              points={
                                isBull
                                  ? `${x},${entryY - 11} ${x - 5},${entryY - 3} ${x + 5},${entryY - 3}`
                                  : `${x},${entryY + 11} ${x - 5},${entryY + 3} ${x + 5},${entryY + 3}`
                              }
                              fill={entryColor}
                              stroke="#FFFFFF"
                              strokeWidth={0.8}
                            />
                          </g>
                        </g>
                      );
                    })()}

                    {/* Interactive Confirmation Circle Button */}
                    <g
                      className="pointer-events-auto cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectConfirmationCircle) onSelectConfirmationCircle(circle);
                      }}
                    >
                      {/* Concentric Outer Glowing Pulse Ring */}
                      <circle
                        cx={x}
                        cy={y}
                        r={circle.radius + (isAplus ? 10 : 8)}
                        fill="none"
                        stroke={ringColor}
                        strokeWidth={isAplus ? 2 : 1.5}
                        strokeDasharray="4 3"
                        opacity={0.75}
                        className="animate-pulse pointer-events-none"
                      />

                      {/* Main Circular Ring Highlight Around Candle */}
                      <circle
                        cx={x}
                        cy={y}
                        r={circle.radius}
                        fill={isBull ? 'rgba(0, 230, 118, 0.16)' : 'rgba(255, 23, 68, 0.16)'}
                        stroke={ringColor}
                        strokeWidth={isAplus ? 2.8 : 2.2}
                        className="transition-transform group-hover:scale-110"
                      />

                      {/* Interactive Badge / Label */}
                      <rect
                        x={x - (isAplus ? 52 : 44)}
                        y={badgeY}
                        width={isAplus ? 104 : 88}
                        height={18}
                        rx={4}
                        fill="#131722"
                        stroke={ringColor}
                        strokeWidth={isAplus ? 1.5 : 1.2}
                        className="shadow-xl"
                      />
                      <text
                        x={x}
                        y={badgeY + 12}
                        textAnchor="middle"
                        fill={ringColor}
                        fontSize="8.5"
                        fontFamily="JetBrains Mono"
                        fontWeight="bold"
                      >
                        {circle.label || (circle.direction === 'BULLISH' ? '🎯 BUY CONFIRM' : '🎯 SELL CONFIRM')}
                      </text>
                    </g>
                  </g>
                );
              })}

            {/* 3. USER DRAWINGS & TRADINGVIEW-EXACT FIBONACCI RETRACEMENT */}
            {!drawingsHidden &&
              allRenderedDrawings.map((d) => {
                const x1 = getXFromTime(d.time1, d.x1 ?? 0);
                const x2 = getXFromTime(d.time2, d.x2 ?? 0);
                const y1 = getYFromPrice(d.price1, d.y1 ?? 0);
                const y2 = getYFromPrice(d.price2, d.y2 ?? 0);
                const isSelected = selectedDrawingId === d.id;
                const toolColor = d.color || '#FFB300';

                if (d.type === 'trendline') {
                  return (
                    <g
                      key={d.id}
                      className="pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDrawingId(d.id);
                      }}
                    >
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={toolColor} strokeWidth={isSelected ? 3 : 2} />
                      {isSelected && (
                        <>
                          <circle
                            cx={x1}
                            cy={y1}
                            r={6}
                            fill="#FFFFFF"
                            stroke="#131722"
                            strokeWidth={2}
                            className="cursor-move"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setDraggingDrawingHandle({ id: d.id, handle: 'p1' });
                            }}
                          />
                          <circle
                            cx={x2}
                            cy={y2}
                            r={6}
                            fill="#FFFFFF"
                            stroke="#131722"
                            strokeWidth={2}
                            className="cursor-move"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setDraggingDrawingHandle({ id: d.id, handle: 'p2' });
                            }}
                          />
                        </>
                      )}
                    </g>
                  );
                }

                if (d.type === 'hline') {
                  return (
                    <g
                      key={d.id}
                      className="pointer-events-auto cursor-ns-resize"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDrawingId(d.id);
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelectedDrawingId(d.id);
                        setDraggingDrawingHandle({ id: d.id, handle: 'p1' });
                      }}
                    >
                      <line x1={0} y1={y1} x2="100%" y2={y1} stroke={toolColor} strokeWidth={isSelected ? 2.5 : 1.5} strokeDasharray="5 4" />
                      <rect x={76} y={y1 - 18} width={130} height={16} rx={3} fill="#1E222D" stroke={toolColor} strokeWidth={1} />
                      <text x={82} y={y1 - 6} fill={toolColor} fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                        {d.price1.toFixed(decimals)}
                      </text>
                    </g>
                  );
                }

                if (d.type === 'vline') {
                  return (
                    <g
                      key={d.id}
                      className="pointer-events-auto cursor-ew-resize"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDrawingId(d.id);
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelectedDrawingId(d.id);
                        setDraggingDrawingHandle({ id: d.id, handle: 'p1' });
                      }}
                    >
                      <line x1={x1} y1={0} x2={x1} y2="100%" stroke={toolColor} strokeWidth={isSelected ? 2.5 : 1.5} strokeDasharray="4 4" />
                    </g>
                  );
                }

                if (d.type === 'rect') {
                  const minX = Math.min(x1, x2);
                  const minY = Math.min(y1, y2);
                  const w = Math.max(30, Math.abs(x2 - x1));
                  const h = Math.max(14, Math.abs(y2 - y1));
                  return (
                    <g
                      key={d.id}
                      className="pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDrawingId(d.id);
                      }}
                    >
                      <rect
                        x={minX}
                        y={minY}
                        width={w}
                        height={h}
                        fill={`${toolColor}26`}
                        stroke={toolColor}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                      />
                      <text x={minX + 6} y={minY + 14} fill={toolColor} fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                        OB ({Math.min(d.price1, d.price2).toFixed(decimals)} - {Math.max(d.price1, d.price2).toFixed(decimals)})
                      </text>
                    </g>
                  );
                }

                // TRADINGVIEW EXACT FIBONACCI RETRACEMENT (Matches attached user picture)
                if (d.type === 'fib') {
                  // Standard TradingView ratios, colors, and shaded background bands
                  const fibLevels = [
                    { ratio: 0.0, color: '#F23645' },
                    { ratio: 0.236, color: '#F23645' },
                    { ratio: 0.382, color: '#FF9100' },
                    { ratio: 0.5, color: '#FFD700' },
                    { ratio: 0.618, color: '#00E676' },
                    { ratio: 0.786, color: '#00B4D8' },
                    { ratio: 1.0, color: '#94A3B8' },
                  ];

                  // Colored bands between adjacent levels matching TradingView design
                  const bands = [
                    { r1: 0.0, r2: 0.236, fill: 'rgba(220, 38, 38, 0.24)' },
                    { r1: 0.236, r2: 0.382, fill: 'rgba(234, 88, 12, 0.24)' },
                    { r1: 0.382, r2: 0.5, fill: 'rgba(202, 138, 4, 0.22)' },
                    { r1: 0.5, r2: 0.618, fill: 'rgba(22, 163, 74, 0.26)' },
                    { r1: 0.618, r2: 0.786, fill: 'rgba(13, 148, 136, 0.26)' },
                    { r1: 0.786, r2: 1.0, fill: 'rgba(51, 65, 85, 0.28)' },
                  ];

                  const minX = Math.min(x1, x2);
                  const maxX = Math.max(x1, x2);
                  // Bounded width matching user's exact drag distance (no infinite lines)
                  const w = Math.max(50, maxX - minX);
                  const dy = y2 - y1;
                  const dp = d.price2 - d.price1;

                  return (
                    <g
                      key={d.id}
                      className="pointer-events-auto cursor-move select-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDrawingId(d.id);
                      }}
                      onMouseDown={(e) => {
                        // Allow dragging anywhere on the Fibonacci to move it effortlessly!
                        e.stopPropagation();
                        setSelectedDrawingId(d.id);
                        const chartRect = chartContainerRef.current?.getBoundingClientRect();
                        const mouseY = chartRect ? e.clientY - chartRect.top : e.clientY;
                        const mouseX = chartRect ? e.clientX - chartRect.left : e.clientX;
                        setDraggingDrawingHandle({
                          id: d.id,
                          handle: 'body',
                          startP1Price: d.price1,
                          startP2Price: d.price2,
                          startP1Time: d.time1,
                          startP2Time: d.time2,
                          mouseStartPrice: yToPrice(mouseY, mouseX),
                          mouseStartTime: xToTime(mouseX),
                        });
                      }}
                    >
                      {/* Background Colored Bands between adjacent levels (TradingView Style) */}
                      {bands.map((b, idx) => {
                        const by1 = y1 + dy * b.r1;
                        const by2 = y1 + dy * b.r2;
                        const bTop = Math.min(by1, by2);
                        const bHeight = Math.max(2, Math.abs(by2 - by1));
                        return (
                          <rect
                            key={`band_${idx}`}
                            x={minX}
                            y={bTop}
                            width={w}
                            height={bHeight}
                            fill={b.fill}
                          />
                        );
                      })}

                      {/* Dashed Anchor Trendline connecting Anchor 1 and Anchor 2 */}
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="rgba(255, 255, 255, 0.75)"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                      />

                      {/* Level Horizontal Lines and Right-Side Only Labels */}
                      {fibLevels.map((lvl) => {
                        const ly = y1 + dy * lvl.ratio;
                        const lPrice = d.price1 + dp * lvl.ratio;
                        const isMain = lvl.ratio === 0.5 || lvl.ratio === 0.618;

                        return (
                          <g key={lvl.ratio}>
                            <line
                              x1={minX}
                              y1={ly}
                              x2={minX + w}
                              y2={ly}
                              stroke={lvl.color}
                              strokeWidth={isMain ? 1.8 : 1.2}
                            />
                            {/* Right-aligned text label as requested: clean, readable, no clutter */}
                            <text
                              x={minX + w - 6}
                              y={ly - 4}
                              textAnchor="end"
                              fill={lvl.color}
                              fontSize="10"
                              fontFamily="'JetBrains Mono', monospace"
                              fontWeight={isMain ? 'bold' : '600'}
                            >
                              {lvl.ratio} ({lPrice.toFixed(decimals)})
                            </text>
                          </g>
                        );
                      })}

                      {/* Right Edge Horizontal Width Stretch Handle */}
                      <circle
                        cx={minX + w}
                        cy={(y1 + y2) / 2}
                        r={5.5}
                        fill="#2962FF"
                        stroke="#FFFFFF"
                        strokeWidth={1.5}
                        className="cursor-ew-resize"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setSelectedDrawingId(d.id);
                          setDraggingDrawingHandle({ id: d.id, handle: 'p2_width' });
                        }}
                      />

                      {/* Anchor Node 1 (Circular White with Border) */}
                      <circle
                        cx={x1}
                        cy={y1}
                        r={6.5}
                        fill="#FFFFFF"
                        stroke="#131722"
                        strokeWidth={2}
                        className="cursor-move"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setSelectedDrawingId(d.id);
                          setDraggingDrawingHandle({ id: d.id, handle: 'p1' });
                        }}
                      />

                      {/* Anchor Node 2 (Circular White with Border) */}
                      <circle
                        cx={x2}
                        cy={y2}
                        r={6.5}
                        fill="#FFFFFF"
                        stroke="#131722"
                        strokeWidth={2}
                        className="cursor-move"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setSelectedDrawingId(d.id);
                          setDraggingDrawingHandle({ id: d.id, handle: 'p2' });
                        }}
                      />
                    </g>
                  );
                }

                if (d.type === 'longpos' || d.type === 'shortpos') {
                  const isLong = d.type === 'longpos';
                  const entryY = y1;
                  const defaultDist = symbol === 'BTC/USD' ? 400 : 6.0;
                  const tpPrice = d.targetPrice ?? (isLong ? d.price1 + defaultDist * 3.0 : d.price1 - defaultDist * 3.0);
                  const slPrice = d.stopPrice ?? (isLong ? d.price1 - defaultDist : d.price1 + defaultDist);
                  const tpY = getYFromPrice(tpPrice, entryY - 70);
                  const slY = getYFromPrice(slPrice, entryY + 40);
                  const minX = Math.min(x1, x2);
                  const w = Math.max(140, Math.abs(x2 - x1));
                  const rr =
                    Math.abs(d.price1 - slPrice) > 0
                      ? (Math.abs(tpPrice - d.price1) / Math.abs(d.price1 - slPrice)).toFixed(2)
                      : '3.00';

                  return (
                    <g
                      key={d.id}
                      className="pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDrawingId(d.id);
                      }}
                    >
                      <rect
                        x={minX}
                        y={Math.min(entryY, tpY)}
                        width={w}
                        height={Math.max(12, Math.abs(tpY - entryY))}
                        fill="rgba(8, 153, 129, 0.24)"
                        stroke="#089981"
                        strokeWidth={1.5}
                      />
                      <rect
                        x={minX}
                        y={Math.min(entryY, slY)}
                        width={w}
                        height={Math.max(12, Math.abs(slY - entryY))}
                        fill="rgba(242, 54, 69, 0.24)"
                        stroke="#F23645"
                        strokeWidth={1.5}
                      />
                      <line x1={minX} y1={entryY} x2={minX + w} y2={entryY} stroke="#FFFFFF" strokeWidth={2} />
                      <text
                        x={minX + 8}
                        y={entryY - 6}
                        fill="#FFFFFF"
                        fontSize="10"
                        fontFamily="JetBrains Mono"
                        fontWeight="bold"
                      >
                        {isLong ? 'LONG POSITION' : 'SHORT POSITION'} (1:{rr} R:R)
                      </text>
                    </g>
                  );
                }

                if (d.type === 'brush' && d.points && d.points.length > 1) {
                  const pathData = d.points.reduce((acc, pt, idx) => {
                    const px = getXFromTime(pt.time, 0);
                    const py = getYFromPrice(pt.price, 0);
                    return idx === 0 ? `M ${px} ${py}` : `${acc} L ${px} ${py}`;
                  }, '');
                  return (
                    <path
                      key={d.id}
                      d={pathData}
                      fill="none"
                      stroke={toolColor}
                      strokeWidth={isSelected ? 3.5 : 2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="pointer-events-auto cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDrawingId(d.id);
                      }}
                    />
                  );
                }

                if (d.type === 'text' && d.text) {
                  return (
                    <g
                      key={d.id}
                      className="pointer-events-auto cursor-move"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDrawingId(d.id);
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingDrawingHandle({ id: d.id, handle: 'p1' });
                      }}
                    >
                      <rect
                        x={x1 - 4}
                        y={y1 - 18}
                        width={Math.max(50, d.text.length * 8 + 12)}
                        height={22}
                        rx={4}
                        fill="#1E222D"
                        stroke={toolColor}
                        strokeWidth={isSelected ? 2 : 1}
                      />
                      <text x={x1 + 2} y={y1 - 4} fill={toolColor} fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">
                        {d.text}
                      </text>
                    </g>
                  );
                }

                return null;
              })}
          </svg>

          {/* FLOATING ACTION TOOLBAR FOR SELECTED DRAWING (FIBONACCI & TOOLS) */}
          {selectedDrawing && (
            <div
              style={{
                top: Math.max(10, getYFromPrice(selectedDrawing.price1, 40) - 46),
                left: Math.max(50, getXFromTime(selectedDrawing.time1, 80)),
              }}
              className="absolute z-40 bg-[#1E222D] border border-[#2A2E39] rounded-lg px-2.5 py-1.5 shadow-2xl flex items-center gap-2 select-none"
            >
              <div className="flex items-center gap-1">
                {PALETTE_COLORS.map((p) => (
                  <button
                    key={p.color}
                    type="button"
                    onClick={() => {
                      setDrawings((prev) =>
                        prev.map((d) => (d.id === selectedDrawing.id ? { ...d, color: p.color } : d))
                      );
                    }}
                    className={`w-4 h-4 rounded-full transition-transform hover:scale-125 cursor-pointer ${
                      selectedDrawing.color === p.color ? 'ring-2 ring-white scale-110' : ''
                    }`}
                    style={{ backgroundColor: p.color }}
                    title={p.label}
                  />
                ))}
              </div>

              {/* Special Advanced Controls for Fibonacci */}
              {selectedDrawing.type === 'fib' && (
                <>
                  <div className="w-[1px] h-4 bg-[#2A2E39]" />
                  <button
                    type="button"
                    onClick={() => handleAutoSnapExistingFibonacci(selectedDrawing.id)}
                    className="px-2 py-0.5 rounded bg-[#FFB300]/20 hover:bg-[#FFB300] text-[#FFB300] hover:text-black font-mono font-bold text-[10px] cursor-pointer"
                    title="Auto-Snap to recent Swing High & Swing Low"
                  >
                    Auto-Snap Swings
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFlipFibonacci(selectedDrawing.id)}
                    className="px-2 py-0.5 rounded bg-[#2A2E39] hover:bg-[#363A45] text-white font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                    title="Flip 0% <-> 100% Direction"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Flip</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleExtendRight(selectedDrawing.id)}
                    className={`px-2 py-0.5 rounded font-mono text-[10px] cursor-pointer ${
                      selectedDrawing.extendRight
                        ? 'bg-[#00E676] text-black font-bold'
                        : 'bg-[#2A2E39] text-[#94A3B8] hover:text-white'
                    }`}
                    title="Extend Lines to Right Edge"
                  >
                    Extend
                  </button>
                </>
              )}

              <div className="w-[1px] h-4 bg-[#2A2E39]" />

              <button
                type="button"
                onClick={() => handleDuplicateDrawing(selectedDrawing.id)}
                className="text-[#94A3B8] hover:text-white p-1 rounded hover:bg-[#2A2E39] cursor-pointer"
                title="Duplicate Drawing"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setDrawings((prev) => prev.filter((d) => d.id !== selectedDrawing.id));
                  setSelectedDrawingId(null);
                }}
                className="text-[#F23645] hover:text-white p-1 rounded hover:bg-[#F23645]/20 cursor-pointer"
                title="Delete Drawing"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* AI SIGNAL INSPECTOR MODAL */}
          {inspectedSignal && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 w-[420px] max-w-[94vw] rounded-2xl bg-[#1E222D]/98 border-2 border-[#00E676] shadow-2xl p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-[#2A2E39] pb-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#00E676] animate-ping" />
                  <span className="font-extrabold text-white text-xs uppercase">AI {inspectedSignal.title} SIGNAL</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedSignal(null)}
                  className="text-[#787B86] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="font-bold text-white">{inspectedSignal.subTitle}</div>
                <div className="grid grid-cols-3 gap-1.5 p-2 rounded bg-[#131722] border border-[#2A2E39] font-mono text-[11px]">
                  <div>
                    <div className="text-[9px] text-[#787B86]">ENTRY</div>
                    <div className="font-bold text-[#60A5FA]">{inspectedSignal.entryPrice.toFixed(decimals)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#787B86]">STOP LOSS</div>
                    <div className="font-bold text-[#F23645]">{inspectedSignal.stopLoss.toFixed(decimals)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#787B86]">TARGET TP</div>
                    <div className="font-bold text-[#00E676]">{inspectedSignal.takeProfit.toFixed(decimals)}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-[#00E676] font-bold">✓ Confirmation Factors on this Candle:</div>
                  {inspectedSignal.checklist.map((c, i) => (
                    <div key={i} className="text-[11px] text-[#D1D4DC] flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#00E676] shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>

                {inspectedSignal.avoidZoneNote && (
                  <div className="p-2 rounded bg-[#F23645]/15 border border-[#F23645]/30 text-[11px] text-[#FF8A80]">
                    <strong>⛔ Avoid Trap Note:</strong> {inspectedSignal.avoidZoneNote}
                  </div>
                )}

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onStartDraftOrder(inspectedSignal.direction === 'BUY' ? 'LONG' : 'SHORT');
                      onUpdateDraftEntry?.(inspectedSignal.entryPrice);
                      onUpdateDraftSl(inspectedSignal.stopLoss);
                      onUpdateDraftTp(inspectedSignal.takeProfit);
                      setInspectedSignal(null);
                    }}
                    className="flex-1 py-2 rounded-xl bg-[#00E676] hover:bg-[#00C853] text-slate-950 font-extrabold text-xs cursor-pointer shadow-lg"
                  >
                    ⚡ Take This Trade (Bracket Ready)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectedSignal(null)}
                    className="px-3 py-2 rounded-xl bg-[#2A2E39] text-[#94A3B8] hover:text-white cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ON-CHART 🎯 PERFECT ENTRY PLACE BLUEPRINT & EXECUTION MODAL */}
          {inspectedEntryCircle && (() => {
            const isBull = inspectedEntryCircle.direction === 'BULLISH';
            const entryColor = isBull ? '#00E676' : '#FF1744';
            const pred = inspectedEntryCircle.prediction;

            return (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 w-[460px] max-w-[94vw] max-h-[82vh] overflow-y-auto rounded-2xl bg-[#141722]/98 border-2 border-sky-400 shadow-2xl p-4 space-y-3 backdrop-blur-xl select-none animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#2A2E39] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                      <Crosshair className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="font-extrabold text-white text-xs block">
                        {aiLanguage === 'en'
                          ? '🎯 Perfect Entry Place & Execution Blueprint'
                          : '🎯 সঠিক এন্ট্রি নেওয়ার নির্দিষ্ট স্থান ও ট্রেড রুলস'}
                      </span>
                      <span className="text-[10px] text-sky-400 font-mono font-bold">
                        {inspectedEntryCircle.grade || '99% A+ INSTITUTIONAL SNIPER'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInspectedEntryCircle(null)}
                    className="text-[#787B86] hover:text-white p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Key Numbers Grid: Exact Entry, SL, TP, RR */}
                <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-[#0E1118] border border-[#2A2E39] font-mono text-[11px]">
                  <div>
                    <div className="text-[9px] text-[#787B86]">DIRECTION</div>
                    <div className="font-extrabold" style={{ color: entryColor }}>
                      {pred.direction}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-sky-400 font-bold">🎯 EXACT ENTRY</div>
                    <div className="font-extrabold text-white">{pred.entryPrice.toFixed(decimals)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#FF1744] font-bold">🛡️ SAFE SL</div>
                    <div className="font-bold text-[#FF1744]">{pred.stopLoss.toFixed(decimals)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#00E676] font-bold">🏆 TARGET TP</div>
                    <div className="font-bold text-[#00E676]">
                      {pred.takeProfit1.toFixed(decimals)} (1:{pred.riskRewardRatio}R)
                    </div>
                  </div>
                </div>

                {/* Exact Entry Instruction (When & Where to Enter) */}
                <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-400/30 space-y-1">
                  <div className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    <span>
                      {aiLanguage === 'en'
                        ? '⚡ Exact Entry Trigger Rule:'
                        : '⚡ কখন ও কীভাবে পারফেক্ট এন্ট্রি নিবেন:'}
                    </span>
                  </div>
                  <div className="text-xs text-[#E2E8F0] leading-relaxed">
                    {aiLanguage === 'en'
                      ? `Pull the trigger at precisely ${pred.entryPrice.toFixed(decimals)} on candle close confirmation. Do NOT enter mid-candle while wicks are still forming to eliminate false stop-out hunts!`
                      : `এই ক্যান্ডেলের বডি ক্লোজ হওয়ার সাথে সাথে ঠিক ${pred.entryPrice.toFixed(decimals)} প্রাইসে এন্ট্রি নিবেন। ক্যান্ডেল চলাকালীন উইক গঠন অবস্থায় তাড়াহুড়া করে কখনো এন্ট্রি নিবেন না, তাহলে মার্কেট ফেকআউট দিয়ে এসএল খেয়ে ফেলতে পারে।`}
                  </div>
                </div>

                {/* Safe SL Explanation (Avoiding premature stopouts) */}
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1">
                  <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {aiLanguage === 'en'
                        ? '🛡️ Why Stop Loss is Protected Here:'
                        : '🛡️ কেন স্টপ লস এখানে সুরক্ষিত (ফেকআউট এড়ানোর উপায়):'}
                    </span>
                  </div>
                  <div className="text-xs text-[#D1D4DC] leading-relaxed">
                    {inspectedEntryCircle.riskManagementGuide?.whySlIsSafeHere ||
                      `স্টপ লস সুইং পয়েন্টের বাইরে নিরাপদ বাফার দিয়ে সেট করা হয়েছে। প্রাতিষ্ঠানিক লিকুইডিটি হান্ট উইক আগেই হয়ে যাওয়ায় এই এসএল হিট হওয়ার ঝুঁকি অত্যন্ত কম।`}
                  </div>
                </div>

                {/* Profit Booking & Breakeven Rule */}
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                  <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {aiLanguage === 'en'
                        ? '🎯 Profit Taking & Breakeven Guide:'
                        : '🎯 প্রফিট বুকিং ও রিস্ক-ফ্রি ট্রেডিং নিয়ম:'}
                    </span>
                  </div>
                  <div className="text-xs text-[#D1D4DC] leading-relaxed">
                    {inspectedEntryCircle.riskManagementGuide?.breakevenRule ||
                      `মার্কেট ১:১.৫ আর মুভ করলে সাথে সাথে স্টপ লস এন্ট্রি প্রাইসে (Breakeven) সরিয়ে আনবেন এবং TP1 এ ৫০% প্রফিট বুক করবেন।`}
                  </div>
                </div>

                {/* 1-Click Action Execution */}
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onStartDraftOrder(pred.direction === 'BUY' ? 'LONG' : 'SHORT');
                      onUpdateDraftEntry?.(pred.entryPrice);
                      onUpdateDraftSl(pred.stopLoss);
                      onUpdateDraftTp(pred.takeProfit1);
                      setInspectedEntryCircle(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl cursor-pointer active:scale-95 transition-all"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>
                      {aiLanguage === 'en'
                        ? '⚡ Load Perfect Entry into Order Ticket (1-Click)'
                        : '⚡ এই এন্ট্রিতে এখনই অর্ডার টিকেট ওপেন করুন'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectedEntryCircle(null)}
                    className="px-3.5 py-2.5 rounded-xl bg-[#2A2E39] text-[#94A3B8] hover:text-white text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ON-CHART FLOATING MASTERCLASS EDUCATIONAL LESSON CARD (BACKTEST MENTOR) */}
          {activeLesson && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 w-[480px] max-w-[94vw] max-h-[78vh] overflow-y-auto rounded-2xl bg-[#181C27]/98 border-2 border-[#AB47BC] shadow-2xl p-4 space-y-3 backdrop-blur-xl select-none">
              <div className="flex items-center justify-between border-b border-[#2A2E39] pb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#AB47BC]/20 text-[#E1BEE7]">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="font-extrabold text-white text-xs block">
                      {aiLanguage === 'en' ? activeLesson.titleEn : activeLesson.titleBn}
                    </span>
                    <span className="text-[10px] text-[#FFB300] font-mono">
                      Master Backtest Lesson #{activeLesson.lessonNumber}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeLesson}
                  className="text-[#787B86] hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Trade Execution Metrics */}
              <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-[#131722] border border-[#2A2E39] font-mono text-[11px]">
                <div>
                  <div className="text-[9px] text-[#787B86]">DIRECTION</div>
                  <div className={`font-extrabold ${activeLesson.direction === 'BUY' ? 'text-[#00E676]' : 'text-[#F23645]'}`}>
                    {activeLesson.direction}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-[#787B86]">ENTRY</div>
                  <div className="font-bold text-[#60A5FA]">{activeLesson.entryPrice.toFixed(decimals)}</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#787B86]">STOP LOSS</div>
                  <div className="font-bold text-[#F23645]">{activeLesson.stopLoss.toFixed(decimals)}</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#787B86]">TARGET TP</div>
                  <div className="font-bold text-[#00E676]">{activeLesson.takeProfit.toFixed(decimals)} (1:{activeLesson.rrRatio}R)</div>
                </div>
              </div>

              {/* Why Trade Here (Institutional Confluences) */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-[#00E676] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{aiLanguage === 'en' ? 'Why Enter Trade Here?' : 'কেন এখানে ট্রেড নেওয়া হলো?'}</span>
                </div>
                {(aiLanguage === 'en' ? activeLesson.reasonsEn : activeLesson.reasonsBn).map((r, i) => (
                  <div key={i} className="text-xs text-[#D1D4DC] pl-4 border-l-2 border-[#00E676]/40 leading-relaxed">
                    {r}
                  </div>
                ))}
              </div>

              {/* Confirmation Candle Signature */}
              <div className="p-2.5 rounded-xl bg-[#2962FF]/10 border border-[#2962FF]/30 space-y-1">
                <div className="text-[11px] font-bold text-[#60A5FA] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{aiLanguage === 'en' ? 'Confirmation Candle Signature:' : 'কনফার্মেশন ক্যান্ডেল সিগনেচার:'}</span>
                </div>
                <div className="text-xs text-[#D1D4DC] leading-relaxed">
                  {aiLanguage === 'en' ? activeLesson.signatureWickEn : activeLesson.signatureWickBn}
                </div>
              </div>

              {/* Golden Rule / Trader Takeaway */}
              <div className="p-2.5 rounded-xl bg-[#FFB300]/10 border border-[#FFB300]/30 space-y-1">
                <div className="text-[11px] font-bold text-[#FFB300] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{aiLanguage === 'en' ? 'Golden Rule / Key Takeaway:' : 'কী শিখলাম? (গোল্ডেন রুল)'}</span>
                </div>
                <div className="text-xs text-[#D1D4DC] leading-relaxed">
                  {aiLanguage === 'en' ? activeLesson.goldenRuleEn : activeLesson.goldenRuleBn}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex items-center gap-2">
                {onReplayFromLesson && (
                  <button
                    type="button"
                    onClick={() => {
                      onReplayFromLesson(activeLesson);
                      closeLesson();
                    }}
                    className="flex-1 py-2 rounded-xl bg-[#AB47BC] hover:bg-[#8E24AA] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{aiLanguage === 'en' ? 'Jump to Candle & Practice Replay' : 'এই ক্যান্ডেলে যান এবং রিপ্লে দিয়ে প্র্যাকটিস করুন'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeLesson}
                  className="px-4 py-2 rounded-xl bg-[#2A2E39] text-[#94A3B8] hover:text-white text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Text Tool Modal */}
          {textPromptPos && (
            <div
              style={{ top: textPromptPos.y, left: textPromptPos.x }}
              className="absolute z-50 bg-[#1E222D] border border-[#2962FF] rounded-lg p-2.5 shadow-2xl"
            >
              <form onSubmit={handleTextSubmit} className="flex items-center gap-1.5">
                <input
                  type="text"
                  autoFocus
                  placeholder="Enter chart note / marker text..."
                  value={textInputVal}
                  onChange={(e) => setTextInputVal(e.target.value)}
                  className="px-2 py-1 rounded bg-[#131722] border border-[#2A2E39] text-xs text-white focus:outline-none focus:border-[#2962FF] w-52 font-mono"
                />
                <button type="submit" className="px-2.5 py-1 rounded bg-[#2962FF] text-white text-xs font-bold cursor-pointer">
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setTextPromptPos(null)}
                  className="px-2 py-1 rounded bg-[#2A2E39] text-[#94A3B8] text-xs cursor-pointer"
                >
                  ✕
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
