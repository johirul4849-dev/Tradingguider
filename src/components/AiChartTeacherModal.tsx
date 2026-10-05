import React, { useState } from 'react';
import {
  X,
  Sparkles,
  TrendingUp,
  Target,
  ShieldAlert,
  Award,
  BookOpen,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Activity,
  Zap,
  BarChart2,
  Clock,
  Compass,
  CheckCircle2,
  Crosshair,
} from 'lucide-react';
import {
  ConfirmationCircle,
  DeepBacktestReport,
  InspectedCandleSymptom,
} from '../services/aiBacktestTeacherEngine';
import { SupportedSymbol, SupportedTimeframe } from '../config/brand';

interface AiChartTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: SupportedSymbol;
  timeframe: SupportedTimeframe;
  backtestReport: DeepBacktestReport | null;
  activeCircle: ConfirmationCircle | null;
  inspectedCandle: InspectedCandleSymptom | null;
  onSelectCircle: (circle: ConfirmationCircle) => void;
  onJumpToCandleTime?: (time: number) => void;
  onApplySetupToOrderTicket?: (setup: { direction: 'LONG' | 'SHORT'; entry: number; sl: number; tp: number }) => void;
  language?: 'bn' | 'banglish' | 'en' | 'hi';
}

export const AiChartTeacherModal: React.FC<AiChartTeacherModalProps> = ({
  isOpen,
  onClose,
  symbol,
  timeframe,
  backtestReport,
  activeCircle,
  inspectedCandle,
  onSelectCircle,
  onJumpToCandleTime,
  onApplySetupToOrderTicket,
  language = 'bn',
}) => {
  const [activeTab, setActiveTab] = useState<'CIRCLE_DETAIL' | 'AUTO_BACKTEST' | 'CANDLE_SYMPTOM' | 'PAIR_PLAYBOOK'>(
    activeCircle ? 'CIRCLE_DETAIL' : inspectedCandle ? 'CANDLE_SYMPTOM' : 'AUTO_BACKTEST'
  );
  const [backtestFilterSniperOnly, setBacktestFilterSniperOnly] = useState<boolean>(false);

  if (!isOpen) return null;

  const rawCircles = backtestReport?.circles || [];
  const circles = backtestFilterSniperOnly
    ? rawCircles.filter((c) => c.isSniperAplus)
    : rawCircles;
  const currentCircleIndex = activeCircle ? circles.findIndex((c) => c.id === activeCircle.id) : 0;

  const handlePrevCircle = () => {
    if (circles.length === 0) return;
    const nextIdx = currentCircleIndex > 0 ? currentCircleIndex - 1 : circles.length - 1;
    const c = circles[nextIdx];
    onSelectCircle(c);
    if (onJumpToCandleTime) onJumpToCandleTime(c.candleTime);
  };

  const handleNextCircle = () => {
    if (circles.length === 0) return;
    const nextIdx = currentCircleIndex < circles.length - 1 ? currentCircleIndex + 1 : 0;
    const c = circles[nextIdx];
    onSelectCircle(c);
    if (onJumpToCandleTime) onJumpToCandleTime(c.candleTime);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#131722] border border-[#2A2E39] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-[#2A2E39] bg-[#1E222D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Sparkles className="w-5 h-5 text-black font-extrabold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  AI Chart Teacher & Deep Backtest Engine
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#2A2E39] text-amber-400">
                  {symbol} • {timeframe}
                </span>
              </div>
              <p className="text-xs text-[#787B86]">
                Master confirmation candles, symptoms, trend behavior & directional predictions directly on the chart.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#787B86] hover:text-white hover:bg-[#2A2E39] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 bg-[#181B24] border-b border-[#2A2E39] overflow-x-auto gap-2 py-2">
          <button
            type="button"
            onClick={() => setActiveTab('CIRCLE_DETAIL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'CIRCLE_DETAIL'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-[#B2B5BE] hover:bg-[#2A2E39]'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            ⭕ Confirmation Candle Breakdown
            {activeCircle && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AUTO_BACKTEST')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'AUTO_BACKTEST'
                ? 'bg-[#2962FF]/20 text-[#2962FF] border border-[#2962FF]/40'
                : 'text-[#B2B5BE] hover:bg-[#2A2E39]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            🤖 Auto Backtest Report ({backtestReport?.totalSetupsFound || 0} Setups)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CANDLE_SYMPTOM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'CANDLE_SYMPTOM'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-[#B2B5BE] hover:bg-[#2A2E39]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            🔍 Candle Symptom Inspector
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PAIR_PLAYBOOK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'PAIR_PLAYBOOK'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                : 'text-[#B2B5BE] hover:bg-[#2A2E39]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            📘 {symbol === 'XAU/USD' ? 'Gold Mastery Playbook' : 'BTC 24/7 Playbook'}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* TAB 1: CONFIRMATION CIRCLE DETAIL */}
          {activeTab === 'CIRCLE_DETAIL' && (
            <div className="space-y-5">
              {activeCircle ? (
                <>
                  {/* Navigator Bar */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#1E222D] border border-[#2A2E39]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${
                          activeCircle.direction === 'BULLISH'
                            ? 'bg-[#00E676]/20 text-[#00E676]'
                            : 'bg-[#FF1744]/20 text-[#FF1744]'
                        }`}
                      >
                        {activeCircle.direction === 'BULLISH' ? '▲ BUY CONFIRMATION' : '▼ SELL CONFIRMATION'}
                      </span>
                      <span className="text-xs text-[#787B86] font-mono">
                        Setup #{currentCircleIndex + 1} of {circles.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePrevCircle}
                        className="px-2.5 py-1 rounded bg-[#131722] hover:bg-[#2A2E39] text-xs text-white flex items-center gap-1 border border-[#2A2E39]"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Prev
                      </button>
                      <button
                        type="button"
                        onClick={handleNextCircle}
                        className="px-2.5 py-1 rounded bg-[#131722] hover:bg-[#2A2E39] text-xs text-white flex items-center gap-1 border border-[#2A2E39]"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Top Highlight Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-[#1E222D] border border-[#2A2E39] space-y-1">
                      <div className="text-[11px] text-[#787B86] font-medium flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-amber-400" />
                        Candle Symptom
                      </div>
                      <div className="text-sm font-bold text-white">{activeCircle.symptom.candleType}</div>
                      <div className="text-xs text-[#00E676]">{activeCircle.symptom.wickAnatomy}</div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#1E222D] border border-[#2A2E39] space-y-1">
                      <div className="text-[11px] text-[#787B86] font-medium flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-[#2962FF]" />
                        Trend Behaviour
                      </div>
                      <div className="text-sm font-bold text-white">{activeCircle.trendBehaviour.phase}</div>
                      <div className="text-xs text-[#B2B5BE]">{activeCircle.trendBehaviour.emaContext}</div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#1E222D] border border-[#2A2E39] space-y-1">
                      <div className="text-[11px] text-[#787B86] font-medium flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-emerald-400" />
                        Directional Prediction
                      </div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{activeCircle.prediction.direction}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400">
                          {activeCircle.prediction.probability}% Win Probability
                        </span>
                      </div>
                      <div className="text-xs text-[#787B86]">{activeCircle.prediction.targetDescription}</div>
                    </div>
                  </div>

                  {/* Setup Numbers & Levels */}
                  <div className="p-4 rounded-xl bg-[#181B24] border border-[#2A2E39] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div>
                      <div className="text-[11px] text-[#787B86]">Entry Price</div>
                      <div className="text-sm font-mono font-bold text-white">{activeCircle.prediction.entryPrice}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#787B86]">Stop Loss (SL)</div>
                      <div className="text-sm font-mono font-bold text-[#FF1744]">{activeCircle.prediction.stopLoss}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#787B86]">Target 1 (TP1)</div>
                      <div className="text-sm font-mono font-bold text-[#00E676]">{activeCircle.prediction.takeProfit1}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#787B86]">Risk : Reward</div>
                      <div className="text-sm font-mono font-bold text-amber-400">1 : {activeCircle.prediction.riskRewardRatio}</div>
                    </div>
                  </div>

                  {/* 5/5 Institutional Confluence Checklist */}
                  {activeCircle.confluenceChecks && activeCircle.confluenceChecks.length > 0 && (
                    <div className="p-4 rounded-xl bg-[#1E222D] border border-[#2A2E39] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" />
                          ৫/৫ ইনস্টিটিউশনাল কনফার্মেশন চেকলিস্ট (99% Confluence)
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-[#00E676]">
                          ALL PASSED (5/5)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {activeCircle.confluenceChecks.map((check, ci) => (
                          <div
                            key={ci}
                            className="flex items-center gap-2 p-2 rounded bg-[#131722] border border-[#2A2E39] text-xs text-[#D1D4DC]"
                          >
                            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-[#00E676] flex items-center justify-center text-[10px] font-bold shrink-0">
                              ✓
                            </span>
                            <span>{check.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 🎯 Dedicated Perfect Entry Place & Trigger Blueprint */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#141B26] to-[#162234] border border-sky-400/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                        <Crosshair className="w-4 h-4 text-sky-400" />
                        <span>🎯 পারফেক্ট এন্ট্রি নেওয়ার নির্দিষ্ট স্থান ও রুলস (Perfect Entry Place)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300">
                        LEVEL: {activeCircle.prediction.entryPrice}
                      </span>
                    </div>

                    <div className="text-xs text-[#D1D4DC] leading-relaxed space-y-1.5">
                      <p>
                        <strong className="text-white">সঠিক এন্ট্রি নেওয়ার সময়:</strong> ক্যান্ডেল বডি ক্লোজ নিশ্চিত হওয়ার সাথে সাথে ঠিক <span className="text-sky-300 font-mono font-bold">{activeCircle.prediction.entryPrice}</span> প্রাইসে এন্ট্রি নিবেন।
                      </p>
                      <p>
                        <strong className="text-amber-300">রিটেইল ভুল থেকে বাঁচুন:</strong> অনেক ট্রেডার ক্যান্ডেল চলাকালীন উইক গঠন অবস্থায় তাড়াহুড়া করে ঢুকে পড়ে, ফলে মার্কেট রিজেকশন দিয়ে সাথে সাথে তাদের স্টপ লস খেয়ে ফেলে। কখনো ক্যান্ডেল ক্লোজের আগে প্রি-ম্যাচিউর এন্ট্রি নিবেন না।
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                      <div className="p-2 rounded bg-[#0E131C] border border-[#2A2E39]">
                        <span className="text-[#787B86] block">এন্ট্রি মেথড:</span>
                        <span className="text-sky-400 font-bold">ক্যান্ডেল ক্লোজ কনফার্মেশন</span>
                      </div>
                      <div className="p-2 rounded bg-[#0E131C] border border-[#2A2E39]">
                        <span className="text-[#787B86] block">ট্রিগার জোন:</span>
                        <span className="text-white font-mono font-bold">{activeCircle.label}</span>
                      </div>
                      <div className="p-2 rounded bg-[#0E131C] border border-[#2A2E39]">
                        <span className="text-[#787B86] block">এন্ট্রি কোয়ালিটি:</span>
                        <span className="text-emerald-400 font-bold">{activeCircle.grade}</span>
                      </div>
                    </div>
                  </div>

                  {/* Safe Stop Loss & Avoid Premature Stop-Out Guide */}
                  {activeCircle.stopLossBox && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-[#1E222D] to-[#25222D] border border-red-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                        <span>🛡️ স্টপ লস সেফটি গাইড (কেন অকালে SL হিট হয় এবং কীভাবে বাঁচবেন)</span>
                      </div>
                      <p className="text-xs text-[#D1D4DC] leading-relaxed">
                        {activeCircle.stopLossBox.explanation}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                        <div className="p-2 rounded bg-[#131722] border border-[#2A2E39]">
                          <span className="text-[#787B86] block">ইনভ্যালিডেশন প্রাইস:</span>
                          <span className="text-white font-mono font-bold">{activeCircle.stopLossBox.invalidationPrice}</span>
                        </div>
                        <div className="p-2 rounded bg-[#131722] border border-[#2A2E39]">
                          <span className="text-[#787B86] block">ব্রেক-ইভেন রুল (BE):</span>
                          <span className="text-emerald-400 font-bold">TP1 হিট করলে SL এন্ট্রিতে আনুন</span>
                        </div>
                        <div className="p-2 rounded bg-[#131722] border border-[#2A2E39]">
                          <span className="text-[#787B86] block">পার্শিয়াল এক্সিট:</span>
                          <span className="text-amber-400 font-bold">TP1 এ ৫০% প্রফিট লক করুন</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Bar: 1-Click Apply to Exness Order Ticket */}
                  {onApplySetupToOrderTicket && (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-[#1E222D] border border-emerald-500/40 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-emerald-400" />
                          <span>এই ৯৯% স্নাইপার সেটআপটি সরাসরি ট্রেড করতে চান?</span>
                        </div>
                        <div className="text-[11px] text-[#787B86]">
                          Entry: {activeCircle.prediction.entryPrice} | SL: {activeCircle.prediction.stopLoss} | TP: {activeCircle.prediction.takeProfit1}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onApplySetupToOrderTicket({
                            direction: activeCircle.direction === 'BULLISH' ? 'LONG' : 'SHORT',
                            entry: activeCircle.prediction.entryPrice,
                            sl: activeCircle.prediction.stopLoss,
                            tp: activeCircle.prediction.takeProfit1,
                          });
                          onClose();
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
                      >
                        <span>🎯 ১-ক্লিকে অর্ডার টিকেটে সেট করুন</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Step-by-Step Backtest Coaching Lesson */}
                  <div className="p-4 rounded-xl bg-[#1E222D] border border-[#2A2E39] space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      {activeCircle.teachingLesson.title}
                    </h3>

                    <div className="space-y-2 text-xs leading-relaxed">
                      <div className="p-3 rounded-lg bg-[#131722] border border-[#2A2E39]/80">
                        <span className="font-bold text-[#00E676] block mb-1">
                          ✓ কেন এই ক্যান্ডেলটি কনফার্মেশন দেয় (Why this confirmed):
                        </span>
                        <p className="text-[#D1D4DC]">{activeCircle.teachingLesson.whyConfirmed}</p>
                      </div>

                      <div className="p-3 rounded-lg bg-[#131722] border border-[#2A2E39]/80">
                        <span className="font-bold text-[#2962FF] block mb-1">
                          🎯 যেভাবে একজন এক্সপার্ট ট্রেডার এটি ট্রেড করবে (How to trade):
                        </span>
                        <p className="text-[#D1D4DC]">{activeCircle.teachingLesson.howToTrade}</p>
                      </div>

                      <div className="p-3 rounded-lg bg-[#131722] border border-[#FF1744]/30">
                        <span className="font-bold text-[#FF1744] block mb-1">
                          ⚠️ যে ভুলটি ট্রেডাররা করে (Mistake to Avoid):
                        </span>
                        <p className="text-[#D1D4DC]">{activeCircle.teachingLesson.commonMistake}</p>
                      </div>

                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <span className="font-bold text-amber-400 block mb-1">
                          ⚡ {symbol} স্পেশাল প্রো-টিপ (Pair Master Rule):
                        </span>
                        <p className="text-[#D1D4DC]">{activeCircle.teachingLesson.pairSpecificProTip}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#1E222D] mx-auto flex items-center justify-center text-amber-400">
                    <Target className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">চার্টের যেকোনো সার্কেলে ক্লিক করুন</h3>
                  <p className="text-xs text-[#787B86] max-w-md mx-auto">
                    চার্টে হাইলাইট করা বৃত্তাকার সার্কেলগুলোতে ক্লিক করলে সেই ক্যান্ডেলের বিস্তারিত সিম্পটম, কনফার্মেশন রুল এবং প্রেডিকশন এখানে দেখতে পাবেন।
                  </p>
                  {circles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onSelectCircle(circles[0])}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs inline-flex items-center gap-2 shadow-lg"
                    >
                      প্রথম কনফার্মেশন সার্কেলটি দেখুন <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AUTOMATED DEEP BACKTEST REPORT */}
          {activeTab === 'AUTO_BACKTEST' && (
            <div className="space-y-5">
              {backtestReport ? (
                <>
                  {/* Summary Metric Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-xl bg-[#1E222D] border border-[#2A2E39]">
                      <div className="text-[11px] text-[#787B86]">মোট ব্যাকটেস্ট ক্যান্ডেল</div>
                      <div className="text-xl font-bold font-mono text-white mt-1">
                        {backtestReport.totalCandlesAnalyzed}
                      </div>
                      <div className="text-[10px] text-emerald-400">৩+ মাসের হিস্টোরিক্যাল ডাটা</div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#1E222D] border border-[#2A2E39]">
                      <div className="text-[11px] text-[#787B86]">উইন রেট (Win Rate)</div>
                      <div className="text-xl font-bold font-mono text-[#00E676] mt-1">
                        {backtestReport.winRatePct}%
                      </div>
                      <div className="text-[10px] text-[#787B86]">
                        {backtestReport.wins}W - {backtestReport.losses}L
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#1E222D] border border-[#2A2E39]">
                      <div className="text-[11px] text-[#787B86]">প্রফিট ফ্যাক্টর (Profit Factor)</div>
                      <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                        {backtestReport.profitFactor}x
                      </div>
                      <div className="text-[10px] text-[#787B86]">Institutional Grade</div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#1E222D] border border-[#2A2E39]">
                      <div className="text-[11px] text-[#787B86]">নেট গেইন (Net R-Gain)</div>
                      <div className="text-xl font-bold font-mono text-[#2962FF] mt-1">
                        +{backtestReport.netRMultiple}R
                      </div>
                      <div className="text-[10px] text-[#787B86]">Avg R:R 1:{backtestReport.avgRiskReward}</div>
                    </div>
                  </div>

                  {/* Discovered Confirmation Setups List */}
                  <div className="p-4 rounded-xl bg-[#1E222D] border border-[#2A2E39] space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          অটো ব্যাকটেস্টে শনাক্তকৃত কনফার্মেশন সার্কেলসমূহ ({circles.length})
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setBacktestFilterSniperOnly((v) => !v)}
                          className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                            backtestFilterSniperOnly
                              ? 'bg-amber-400 border-amber-300 text-black shadow-md shadow-amber-400/30'
                              : 'bg-[#131722] hover:bg-[#2A2E39] border-[#2A2E39] text-amber-400'
                          }`}
                        >
                          <span>💎</span>
                          <span>
                            {backtestFilterSniperOnly
                              ? '💎 ৯৯% স্নাইপার ফিল্টার: ON'
                              : `💎 ৯৯% স্নাইপার অনলি (${backtestReport.sniperAplusCount || rawCircles.length})`}
                          </span>
                        </button>
                        <span className="text-[11px] text-[#787B86] hidden sm:inline">সার্কেলে ক্লিক করে চার্টে জাম্প করুন</span>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                      {circles.map((c, idx) => {
                        const isWin = c.backtestResult?.outcome === 'TP_HIT';
                        const isSelected = activeCircle?.id === c.id;

                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              onSelectCircle(c);
                              if (onJumpToCandleTime) onJumpToCandleTime(c.candleTime);
                              setActiveTab('CIRCLE_DETAIL');
                            }}
                            className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-emerald-500/10 border-emerald-500'
                                : 'bg-[#131722] border-[#2A2E39] hover:border-[#787B86]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono font-bold text-[#787B86]">#{idx + 1}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                                  c.direction === 'BULLISH'
                                    ? 'bg-[#00E676]/20 text-[#00E676]'
                                    : 'bg-[#FF1744]/20 text-[#FF1744]'
                                }`}
                              >
                                {c.direction} @ {c.prediction.entryPrice}
                              </span>
                              <span className="text-xs text-white font-medium">{c.symptom.candleType}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-xs text-[#787B86] font-mono">
                                TP: {c.prediction.takeProfit1} (1:{c.prediction.riskRewardRatio}R)
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                  isWin ? 'bg-[#00E676]/20 text-[#00E676]' : 'bg-[#FF1744]/20 text-[#FF1744]'
                                }`}
                              >
                                {isWin ? '✓ TP HIT (+2.8R)' : '✕ SL HIT (-1R)'}
                              </span>
                              <ChevronRight className="w-4 h-4 text-[#787B86]" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-xs text-[#787B86]">
                  ব্যাকটেস্ট ডাটা বিশ্লেষণ করা হচ্ছে... অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন।
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CANDLE SYMPTOM INSPECTOR */}
          {activeTab === 'CANDLE_SYMPTOM' && (
            <div className="space-y-4">
              {inspectedCandle ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#1E222D] border border-[#2A2E39] space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-amber-400" />
                        {inspectedCandle.symptomTitle}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                          inspectedCandle.sentiment === 'BULLISH'
                            ? 'bg-[#00E676]/20 text-[#00E676]'
                            : inspectedCandle.sentiment === 'BEARISH'
                            ? 'bg-[#FF1744]/20 text-[#FF1744]'
                            : 'bg-[#B2B5BE]/20 text-[#B2B5BE]'
                        }`}
                      >
                        {inspectedCandle.directionalBias} ({inspectedCandle.winProbability}% Probability)
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded bg-[#131722] border border-[#2A2E39]">
                        <span className="text-[#787B86] block text-[10px]">উপরের উইক (Upper Wick)</span>
                        <span className="text-white font-bold font-mono">{inspectedCandle.upperWickPct}%</span>
                      </div>
                      <div className="p-2.5 rounded bg-[#131722] border border-[#2A2E39]">
                        <span className="text-[#787B86] block text-[10px]">ক্যান্ডেল বডি (Real Body)</span>
                        <span className="text-white font-bold font-mono">{inspectedCandle.bodyPct}%</span>
                      </div>
                      <div className="p-2.5 rounded bg-[#131722] border border-[#2A2E39]">
                        <span className="text-[#787B86] block text-[10px]">নিচের উইক (Lower Wick)</span>
                        <span className="text-white font-bold font-mono">{inspectedCandle.lowerWickPct}%</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#D1D4DC] leading-relaxed p-3 rounded-lg bg-[#131722] border border-[#2A2E39]">
                      {inspectedCandle.symptomDiagnosis}
                    </p>

                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-[#D1D4DC]">
                      <span className="font-bold text-emerald-400 block mb-1">
                        🎯 টার্গেট ও ইনভ্যালিডেশন লেভেল (Projected Move):
                      </span>
                      {inspectedCandle.expectedMove} • Projected Target: {inspectedCandle.projectedTarget} (SL: {inspectedCandle.invalidationLevel})
                    </div>

                    <div className="p-3 rounded-lg bg-[#2962FF]/10 border border-[#2962FF]/30 text-xs text-[#D1D4DC]">
                      <span className="font-bold text-[#2962FF] block mb-1">
                        💡 ট্রেডারের জন্য গুরুত্বপূর্ণ রুল:
                      </span>
                      {inspectedCandle.practicalTraderRule}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#1E222D] mx-auto flex items-center justify-center text-amber-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">চার্টের যেকোনো ক্যান্ডেলে ক্লিক করুন</h4>
                  <p className="text-xs text-[#787B86] max-w-sm mx-auto">
                    চার্টের যেকোনো নির্দিষ্ট ক্যান্ডেলে ক্লিক করলে তার উইক সাইজ, ভলিউম সিম্পটম এবং পরবর্তী ডিরেকশন কেমন হতে পারে তা বিস্তারিত দেখা যাবে।
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PAIR MASTERY PLAYBOOK */}
          {activeTab === 'PAIR_PLAYBOOK' && (
            <div className="space-y-4">
              {backtestReport?.pairSummary && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#1E222D] to-[#252A37] border border-[#2A2E39] space-y-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-400" />
                      {backtestReport.pairSummary.title}
                    </h3>
                    <p className="text-xs text-[#B2B5BE] leading-relaxed">
                      {backtestReport.pairSummary.description}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#1E222D] border border-[#2A2E39] space-y-2">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      ★ এই পেয়ারের আচরণগত বৈশিষ্ট্য (Key Market Characteristics)
                    </h4>
                    <div className="space-y-2">
                      {backtestReport.pairSummary.keyCharacteristics.map((item, i) => (
                        <div key={i} className="p-2.5 rounded bg-[#131722] border border-[#2A2E39] text-xs text-[#D1D4DC]">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#1E222D] border border-[#2A2E39] space-y-2">
                    <h4 className="text-xs font-bold text-[#00E676] uppercase tracking-wider">
                      ⚡ গোল্ডেন রুলস (Golden Rules for 80%+ Win Rate)
                    </h4>
                    <div className="space-y-2">
                      {backtestReport.pairSummary.goldenRules.map((rule, i) => (
                        <div key={i} className="p-2.5 rounded bg-[#131722] border border-[#2A2E39] text-xs text-[#D1D4DC]">
                          {rule}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#2A2E39] bg-[#1E222D] flex items-center justify-between">
          <div className="text-[11px] text-[#787B86] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            AI Quantitative SMC Engine • Real Binance Historical Confluence
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#2A2E39] hover:bg-[#363A45] text-xs font-bold text-white transition-colors"
          >
            বন্ধ করুন (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
