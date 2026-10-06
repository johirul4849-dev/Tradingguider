import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Crosshair,
  Zap,
  BarChart2,
  Clock,
  Shield,
  Tag,
  DollarSign,
  Download,
  Users,
  Lock,
  ChevronRight,
  Award,
  Play,
  Layers,
  Activity,
  Cpu,
  Eye,
  Radio,
  ExternalLink,
  Flame,
  Check,
} from 'lucide-react';
import { BRAND_CONFIG } from '../config/brand';
import {
  SUBSCRIPTION_PACKAGES,
  BINANCE_PAYMENT_CONFIG,
  subscriptionService,
} from '../services/subscriptionService';
import { liveMarketStreamer, LiveMarketTick } from '../services/liveMarketStreamer';
import { InfluencerPortalModal } from './InfluencerPortalModal';
import { AdminPanelModal } from './AdminPanelModal';

// 3D Visual Asset Renders
import hero3dImg from '../assets/images/hero_3d_glass_terminal_1791211140813.jpg';
import bullionImg from '../assets/images/bullion_btc_3d_glass_1791211157383.jpg';
import smcPrismImg from '../assets/images/smc_neural_prism_1791211169874.jpg';

interface LandingPageProps {
  onGoogleLogin: () => Promise<void>;
  isSigningIn: boolean;
  authError: string | null;
  onEnterDemoSandbox?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoogleLogin,
  isSigningIn,
  authError,
  onEnterDemoSandbox,
}) => {
  // Preview Chart State
  const [previewSymbol, setPreviewSymbol] = useState<'BTC/USD' | 'XAU/USD'>('BTC/USD');
  const [previewAiMarked, setPreviewAiMarked] = useState<boolean>(true);

  // Live Original Market Prices for BTC/USD and XAU/USD
  const [liveBtcTick, setLiveBtcTick] = useState<LiveMarketTick | null>(() =>
    liveMarketStreamer.getLatestTick('BTC/USD')
  );
  const [liveGoldTick, setLiveGoldTick] = useState<LiveMarketTick | null>(() =>
    liveMarketStreamer.getLatestTick('XAU/USD')
  );

  useEffect(() => {
    const unsub = liveMarketStreamer.subscribeTicks((tick) => {
      if (tick.symbol === 'BTC/USD') setLiveBtcTick(tick);
      if (tick.symbol === 'XAU/USD') setLiveGoldTick(tick);
    });
    return unsub;
  }, []);

  // Modals
  const [showInfluencerModal, setShowInfluencerModal] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);

  // Interactive Promo Calculator on Landing
  const [calculatorPromoCode, setCalculatorPromoCode] = useState('');
  const [calcAppliedPromo, setCalcAppliedPromo] = useState<string | null>(null);

  const isGold = previewSymbol === 'XAU/USD';

  const handleTestPromo = () => {
    if (!calculatorPromoCode.trim()) return;
    const res = subscriptionService.validatePromoCode(calculatorPromoCode);
    if (res.valid && res.code) {
      setCalcAppliedPromo(res.code);
    } else {
      setCalcAppliedPromo(null);
    }
  };

  const currentPreviewPrice = isGold
    ? liveGoldTick?.price
      ? `$${liveGoldTick.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : '$4,145.50'
    : liveBtcTick?.price
    ? `$${liveBtcTick.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    : '$85,950.00';

  return (
    <div className="min-h-screen bg-[#0A1022] text-slate-100 flex flex-col font-sans antialiased overflow-x-hidden selection:bg-[#2962FF] selection:text-white relative">
      {/* High-Contrast Radial Radiant Ambient Lighting */}
      <div className="fixed -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#2962FF]/20 via-[#00E5FF]/10 to-transparent rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 -left-40 w-[600px] h-[600px] bg-gradient-to-r from-[#00E676]/10 to-transparent rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[700px] h-[500px] bg-gradient-to-l from-[#2962FF]/15 to-transparent rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* 1. TOP LIVE TICKER BAR (High-Contrast, Crystal Clear Text) */}
      <div className="bg-[#0E172E] border-b border-slate-700/80 px-4 py-2.5 text-xs relative z-50 shadow-sm">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-[#00E676] border border-emerald-500/40 font-mono font-bold text-[11px] tracking-wider uppercase shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#00E676] animate-ping" />
              LIVE TICKER ACTIVE
            </span>
            <span className="text-slate-300 hidden sm:inline text-xs font-mono font-medium">
              Zero-Latency Real Price Oracle · No API Key Needed
            </span>
          </div>

          {/* Original Live Pairs Real-Time Quotes */}
          <div className="flex items-center gap-6 text-xs font-mono">
            <div className="flex items-center gap-2 bg-[#14203D] px-3 py-1 rounded-lg border border-slate-700">
              <span className="text-white font-bold tracking-tight">BTC/USD</span>
              <span className="text-[#00E676] font-bold tabular-nums">
                {liveBtcTick?.price
                  ? `$${liveBtcTick.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                  : '$85,950.00'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-[#00E676] rounded font-bold">
                +{liveBtcTick?.change24hPct?.toFixed(2) || '0.95'}%
              </span>
            </div>

            <div className="flex items-center gap-2 bg-[#14203D] px-3 py-1 rounded-lg border border-slate-700">
              <span className="text-white font-bold tracking-tight">XAU/USD GOLD</span>
              <span className="text-[#FFD700] font-bold tabular-nums">
                {liveGoldTick?.price
                  ? `$${liveGoldTick.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                  : '$4,145.50'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-[#FFD700] rounded font-bold">
                +{liveGoldTick?.change24hPct?.toFixed(2) || '0.45'}%
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs">
            <span className="text-slate-200">
              Sign in with Google now to get <strong className="text-white font-bold underline decoration-[#00E5FF]">24 Hours Free Full Access</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. HIGH-CONTRAST HEADER WITH CRYSTAL CLEAR FUNCTION LINKS */}
      <header className="sticky top-0 z-40 bg-[#0F1934]/95 backdrop-blur-xl border-b border-slate-700 shadow-lg">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          {/* Logo & Tradingguider Brand */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2962FF] via-[#00E5FF] to-[#00E676] p-[2px] shadow-lg shadow-[#2962FF]/30">
              <div className="w-full h-full bg-[#0B132B] rounded-[9px] flex items-center justify-center font-black text-white text-sm font-mono tracking-tighter">
                TG
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-black tracking-tight text-white font-display">
                  {BRAND_CONFIG.name}
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-[#00E5FF] border border-blue-500/40">
                  PRO REPLAY ENGINE
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-300 tracking-wider">
                Institutional Price Action & SMC Mentorship
              </div>
            </div>
          </div>

          {/* High-Visibility Navigation Links with Crystal Clear Contrast */}
          <nav className="hidden lg:flex items-center gap-2 text-xs font-bold">
            <a
              href="#terminal"
              className="px-3.5 py-2 rounded-xl text-white hover:text-[#00E5FF] bg-[#142345] hover:bg-[#1E3362] border border-slate-600/80 hover:border-[#00E5FF]/60 shadow-sm transition-all"
            >
              Replay Terminal
            </a>
            <a
              href="#pairs"
              className="px-3.5 py-2 rounded-xl text-white hover:text-[#00E5FF] bg-[#142345] hover:bg-[#1E3362] border border-slate-600/80 hover:border-[#00E5FF]/60 shadow-sm transition-all"
            >
              Original Pairs (BTC & Gold)
            </a>
            <a
              href="#smc"
              className="px-3.5 py-2 rounded-xl text-white hover:text-[#00E5FF] bg-[#142345] hover:bg-[#1E3362] border border-slate-600/80 hover:border-[#00E5FF]/60 shadow-sm transition-all"
            >
              AI SMC Detection
            </a>
            <a
              href="#pricing"
              className="px-3.5 py-2 rounded-xl text-white hover:text-[#00E5FF] bg-[#142345] hover:bg-[#1E3362] border border-slate-600/80 hover:border-[#00E5FF]/60 shadow-sm transition-all"
            >
              Plans & Pricing
            </a>
            <button
              type="button"
              onClick={() => setShowInfluencerModal(true)}
              className="px-3.5 py-2 rounded-xl text-[#FFD700] hover:text-white bg-[#FFD700]/15 hover:bg-[#FFD700]/30 border border-[#FFD700]/50 transition-all flex items-center gap-1.5 cursor-pointer font-extrabold shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
              <span>Partner Program</span>
            </button>
          </nav>

          {/* High-Contrast Action Buttons */}
          <div className="flex items-center gap-2.5">
            {onEnterDemoSandbox && (
              <button
                type="button"
                onClick={onEnterDemoSandbox}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2962FF]/20 hover:bg-[#2962FF] text-[#00E5FF] hover:text-white font-bold text-xs border border-[#2962FF]/50 transition-all cursor-pointer shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Terminal</span>
              </button>
            )}

            <button
              type="button"
              onClick={onGoogleLogin}
              disabled={isSigningIn}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-black text-xs tracking-tight shadow-xl shadow-white/10 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 border-2 border-white"
            >
              {/* Google Brand Colored SVG Icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSigningIn ? 'Connecting...' : 'Sign In'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION (High-Contrast, Crisp Typography & 3D Terminal Render) */}
      <section id="terminal" className="relative pt-12 sm:pt-16 pb-20 px-4 sm:px-8">
        <div className="max-w-[1360px] mx-auto relative z-10">
          {/* Telemetry Tag */}
          <div className="flex justify-center mb-6">
            <div className="px-4 py-1.5 rounded-full bg-[#131F3B] border border-blue-500/40 inline-flex items-center gap-2.5 text-xs font-mono text-slate-200 shadow-md">
              <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
              <span className="font-bold text-[#00E5FF] tracking-wider uppercase">
                TRADINGGUIDER v4.2
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-white font-medium">90 DAYS CONTINUOUS BAR REPLAY · BTC & GOLD</span>
            </div>
          </div>

          {/* High-Impact Main Heading */}
          <div className="max-w-4xl mx-auto text-center mb-10">
            <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-black tracking-tight leading-[1.05] mb-6 font-display">
              <span className="text-white block">STOP GUESSING.</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] via-[#00E676] to-[#FFD700] block mt-1">
                MASTER REAL PRICE ACTION
              </span>
              <span className="text-slate-200 block mt-1 text-2xl sm:text-4xl lg:text-5xl font-light">
                BEFORE TRADING REAL MONEY.
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-200 max-w-3xl mx-auto leading-relaxed mb-8 font-normal">
              Why do 94% of retail traders blow their accounts? Because they test untested strategies live.
              With <strong className="text-white font-bold">Tradingguider</strong>, rewind 90 days of original{' '}
              <strong className="text-[#00E5FF]">BTC/USD</strong> and <strong className="text-[#FFD700]">XAU/USD Gold</strong> spot candles,
              drag real Exness SL/TP brackets, and let institutional AI auto-mark{' '}
              <strong className="text-white">Fair Value Gaps (FVG), BOS & confirmation candles</strong> on your chart.
            </p>

            {authError && (
              <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-rose-950/80 border border-rose-500 text-xs text-rose-200">
                {authError}
              </div>
            )}

            {/* Dual CTAs in Hero */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
              <button
                type="button"
                onClick={onGoogleLogin}
                disabled={isSigningIn}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3.5 px-7 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black text-sm sm:text-base shadow-2xl shadow-white/20 transition-all cursor-pointer transform hover:-translate-y-1 active:translate-y-0 border-2 border-white"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isSigningIn ? 'Connecting...' : 'Sign In with Google (24H Free)'}</span>
              </button>

              {onEnterDemoSandbox && (
                <button
                  type="button"
                  onClick={onEnterDemoSandbox}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-[#132247] hover:bg-[#1C3166] text-white font-extrabold text-sm sm:text-base border-2 border-blue-500/60 shadow-xl transition-all cursor-pointer hover:border-[#00E5FF] transform hover:-translate-y-1 active:translate-y-0"
                >
                  <Play className="w-4 h-4 text-[#00E676] fill-current" />
                  <span>Launch Replay Terminal</span>
                </button>
              )}
            </div>

            {/* Micro Guarantees */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
                24 Hours Full Access Free
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
                Zero API Key Required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
                1-Click Instant Launch
              </span>
            </div>
          </div>

          {/* 3D Glass Hero Showcase Terminal (High-Contrast Frame) */}
          <div className="relative max-w-5xl mx-auto rounded-3xl p-2 sm:p-3 bg-[#111C38] border-2 border-slate-600/80 shadow-2xl overflow-hidden">
            {/* Top Interactive Controls Bar */}
            <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-700 bg-[#142244] rounded-2xl mb-2">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <div className="h-4 w-[1px] bg-slate-600 mx-1" />
                <button
                  type="button"
                  onClick={() => setPreviewSymbol('BTC/USD')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                    !isGold
                      ? 'bg-[#2962FF] text-white shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  BTC/USD ({liveBtcTick?.price ? `$${liveBtcTick.price.toFixed(2)}` : '$85,950'})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSymbol('XAU/USD')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                    isGold
                      ? 'bg-[#FFD700] text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  XAU/USD GOLD ({liveGoldTick?.price ? `$${liveGoldTick.price.toFixed(2)}` : '$4,145.50'})
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 font-mono text-xs bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                  <span className="w-2 h-2 rounded-full bg-[#00E676] animate-ping" />
                  <span className="text-white font-bold">{currentPreviewPrice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewAiMarked((v) => !v)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewAiMarked
                      ? 'bg-emerald-500/20 text-[#00E676] border border-emerald-500/50'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#00E676]" />
                  <span>{previewAiMarked ? 'AI SMC: ON' : 'Raw Candles: ON'}</span>
                </button>
              </div>
            </div>

            {/* Hero 3D Picture Render with Floating Data Overlays */}
            <div className="relative w-full h-[320px] sm:h-[460px] lg:h-[520px] overflow-hidden rounded-2xl bg-[#091024]">
              <img
                src={hero3dImg}
                alt="3D Frosted White Glass Trading Terminal"
                className="w-full h-full object-cover object-center filter brightness-100 contrast-105"
              />

              {/* Contrast Bottom Shade */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1022] via-transparent to-transparent opacity-80" />

              {/* Floating AI SMC Overlays */}
              {previewAiMarked && (
                <>
                  <div className="absolute top-10 left-6 sm:left-12 bg-[#0E1A38]/90 backdrop-blur-md p-4 rounded-2xl max-w-xs border-2 border-blue-500/60 shadow-2xl">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#00E5FF] flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5" />
                        AI CONFIRMATION ARROW
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#00E676] font-bold border border-emerald-500/40">
                        1:3.4 R:R
                      </span>
                    </div>
                    <div className="text-xs text-white font-bold">
                      Bullish FVG Retest + Liquidity Grab
                    </div>
                    <div className="text-[11px] font-mono text-slate-300 mt-1">
                      Execution Entry: {isGold ? '$4,142.20' : '$85,820.00'} • Stop: -12 Pips
                    </div>
                  </div>

                  <div className="absolute bottom-14 right-6 sm:right-12 bg-[#0E1A38]/90 backdrop-blur-md p-4 rounded-2xl max-w-xs border-2 border-amber-500/60 shadow-2xl hidden sm:block">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#FFD700] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        ORDER BLOCK LIQUIDITY
                      </span>
                      <span className="text-[10px] font-mono text-slate-300">
                        VOL: 14.2K
                      </span>
                    </div>
                    <div className="text-xs text-white font-bold">
                      Institutional Imbalance Filled
                    </div>
                    <div className="text-[11px] font-mono text-slate-300 mt-1">
                      London / NY Cross Alignment Confirmed
                    </div>
                  </div>
                </>
              )}

              {/* Bottom HUD */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#0E1A38]/95 px-5 py-2.5 rounded-2xl flex items-center gap-4 text-xs font-mono border border-slate-700 shadow-xl">
                <span className="flex items-center gap-1.5 text-[#00E676] font-bold">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  REPLAY ACTIVE
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-200">BAR 1,380 / 1,500</span>
                <span className="text-slate-600">|</span>
                <span className="text-[#00E5FF] font-bold">1x REALTIME SPEED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ORIGINAL PAIRS SHOWCASE (High-Contrast, Visible Cards with 3D Bullion Render) */}
      <section id="pairs" className="py-20 px-4 sm:px-8 border-t border-slate-800 bg-[#0C142A]">
        <div className="max-w-[1300px] mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left: 3D Bullion Render */}
            <div className="w-full lg:w-1/2">
              <div className="rounded-3xl p-3 bg-[#111D3B] border-2 border-slate-700 shadow-2xl overflow-hidden group">
                <img
                  src={bullionImg}
                  alt="3D Frosted White Glass Bitcoin & Gold Bullion"
                  className="w-full h-auto rounded-2xl object-cover filter brightness-105 contrast-105 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="mt-3 p-4 rounded-xl bg-[#142347] border border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#00E5FF] uppercase tracking-wider block font-bold">
                      VERIFIED MARKET ORACLE
                    </span>
                    <span className="text-sm font-bold text-white">
                      BTC/USD & XAU/USD Physical Gold Feeds
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-[#00E676] border border-emerald-500/40">
                    REAL SPOT
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Technical Explanation */}
            <div className="w-full lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#131F3B] border border-blue-500/40 text-xs font-mono text-[#00E5FF] mb-4 font-bold">
                <Radio className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>// ORIGINAL MARKET ASSET SPECIFICATIONS</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.08] mb-6 font-display">
                ORIGINAL PAIRS ONLY.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#00E676]">
                  ZERO SYNTHETIC FAKES.
                </span>
              </h2>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed mb-8">
                Most backtest simulators use synthetic random-walk mathematics that do not reflect true institutional order flow.
                <strong className="text-white font-bold"> Tradingguider</strong> feeds genuine global market data.
                Even when deployed on Vercel or cloud static hosting, our browser multi-source engine streams live ticks without requiring any API keys.
              </p>

              {/* Pair Spec Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="p-5 rounded-2xl bg-[#131F3C] border-2 border-slate-700 hover:border-blue-500 transition-all shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-mono font-bold text-white">BTC/USD</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-[#00E5FF] font-bold">
                      GLOBAL SPOT
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00E676] shrink-0" />
                      <span>Sub-second tick WebSocket streaming</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00E676] shrink-0" />
                      <span>90 days of 1m, 5m, 15m, 1H bars</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00E676] shrink-0" />
                      <span>Real weekend price action</span>
                    </li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-[#131F3C] border-2 border-slate-700 hover:border-amber-500 transition-all shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-mono font-bold text-[#FFD700]">XAU/USD GOLD</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-[#FFD700] font-bold">
                      COMEX / LONDON
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#FFD700] shrink-0" />
                      <span>1:1 Physically backed spot calibration</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#FFD700] shrink-0" />
                      <span>London & NY session liquidity sweeps</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#FFD700] shrink-0" />
                      <span>Exness pip and contract formulas</span>
                    </li>
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={onGoogleLogin}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#2962FF] to-[#00E5FF] hover:opacity-95 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
              >
                <span>OPEN REPLAY TERMINAL NOW</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. AI SMC NEURAL PRISM SECTION (High-Contrast) */}
      <section id="smc" className="py-20 px-4 sm:px-8 border-t border-slate-800 bg-[#0A1124]">
        <div className="max-w-[1300px] mx-auto">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-16">
            {/* Right: 3D SMC Prism Render */}
            <div className="w-full lg:w-1/2">
              <div className="rounded-3xl p-3 bg-[#111D3B] border-2 border-slate-700 shadow-2xl overflow-hidden group">
                <img
                  src={smcPrismImg}
                  alt="3D Frosted White Glass SMC Neural Matrix Prism"
                  className="w-full h-auto rounded-2xl object-cover filter brightness-105 contrast-105 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="mt-3 p-4 rounded-xl bg-[#142347] border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#00E676]" />
                    <span className="text-xs font-mono font-bold text-white uppercase">
                      AI AUTONOMOUS SMC RADAR v4.2
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-300">
                    BENGALI & ENGLISH
                  </span>
                </div>
              </div>
            </div>

            {/* Left: SMC Feature Depth */}
            <div className="w-full lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#131F3B] border border-emerald-500/40 text-xs font-mono text-[#00E676] mb-4 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#00E676]" />
                <span>// SMART MONEY CONCEPTS AUTO-DETECTION</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.08] mb-6 font-display">
                AUTO-MARK FVGs, BOS,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#00E676]">
                  & CONFIRMATION CANDLES.
                </span>
              </h2>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed mb-6 font-normal">
                Stop drawing manual boxes and guessing whether an imbalance is valid. Our algorithm scans every historical
                candle across the 3-month dataset to flag high-liquidity order blocks, break of structure (BOS), and
                equilibrium Fibonacci retracements automatically.
              </p>

              <div className="space-y-4 mb-8">
                <div className="p-4 rounded-2xl bg-[#131F3C] border border-slate-700 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0 text-[#00E5FF]">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                      Instant Confirmation Arrows (বাংলা ও English)
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                      AI highlights the exact entry trigger candle so you know why the trade setup materialized.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#131F3C] border border-slate-700 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-[#00E676]">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                      Post-Trade Psychological Autopsy
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                      After every simulated trade, the AI breaks down whether you followed your trading plan or acted out of FOMO.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onGoogleLogin}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1E2E52] hover:bg-[#253966] border border-slate-600 text-xs font-bold text-white transition-all cursor-pointer"
              >
                <span>TEST AI AUTO-MARKING IN REPLAY</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PLANS & PRICING SECTION (High-Contrast, Visible Cards) */}
      <section id="pricing" className="py-20 px-4 sm:px-8 border-t border-slate-800 bg-[#0C152E]">
        <div className="max-w-[1300px] mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#131F3B] border border-blue-500/40 text-xs font-mono text-[#00E5FF] mb-4 font-bold">
              <Tag className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>// TRANSPARENT MASTERY VALUE · 24H FREE TRIAL FIRST</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 font-display">
              Invest in Strategy Mastery, Not Broker Losses
            </h2>
            <p className="text-sm sm:text-base text-slate-200">
              One blown 0.1 lot trade on Gold costs $150+ in real broker accounts.
              These passes unlock unlimited 90-day bar replay, draggable SL/TP execution, and AI mentorship for a fraction of that cost.
            </p>
          </div>

          {/* Interactive Promo Code Discount Tester */}
          <div className="max-w-md mx-auto mb-12 p-5 rounded-2xl bg-[#131F3C] border-2 border-slate-700 shadow-lg">
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span>Have an Influencer Partner Promo Code?</span>
              <span className="text-[#00E676] font-mono text-[11px] font-bold">Instant Discount Applied</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. JAHID10, ALPHA5"
                value={calculatorPromoCode}
                onChange={(e) => setCalculatorPromoCode(e.target.value.toUpperCase())}
                className="flex-1 bg-[#0A1022] border border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF]"
              />
              <button
                type="button"
                onClick={handleTestPromo}
                className="px-5 py-2.5 rounded-xl bg-[#2962FF] hover:bg-[#1E53E5] text-xs font-bold text-white transition-all cursor-pointer shadow-md"
              >
                Apply
              </button>
            </div>
            {calcAppliedPromo && (
              <p className="text-xs text-[#00E676] mt-2.5 font-mono font-semibold">
                ✓ Coupon Code {calcAppliedPromo} verified! Discounts applied to packages below:
              </p>
            )}
          </div>

          {/* High-Contrast Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* 1 MONTH PLAN ($8) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#131F3C] border-2 border-slate-700 flex flex-col justify-between hover:border-slate-500 transition-all shadow-xl">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  1 MONTH PRO PASS
                </span>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-black font-mono text-white">
                    ${calcAppliedPromo ? 7 : 8}
                  </span>
                  {calcAppliedPromo && (
                    <span className="text-sm font-mono text-slate-400 line-through">$8</span>
                  )}
                  <span className="text-xs text-slate-400">/ 30 Days</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-6 font-normal">
                  Perfect for rapid setup testing, weekend backtesting sessions, and verifying your strategy before trading.
                </p>

                <ul className="space-y-3 text-xs text-slate-200 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676] shrink-0" />
                    <span>90 Days Bar Replay (BTC & Gold)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676] shrink-0" />
                    <span>Real Exness Drag SL/TP Bracket</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676] shrink-0" />
                    <span>AI Confirmation Candle Arrows</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676] shrink-0" />
                    <span>Instant Admin Binance Verification</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onGoogleLogin}
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-600"
              >
                <span>Start with Google Sign In</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 6 MONTHS PLAN ($40 - POPULAR) */}
            <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#18264A] to-[#121E3B] border-2 border-[#00E5FF] flex flex-col justify-between shadow-2xl shadow-[#00E5FF]/20">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#00E5FF] to-[#00E676] text-slate-950 shadow-md">
                MOST POPULAR • BEST MASTERY VALUE
              </span>

              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#00E5FF] block mb-2 mt-2">
                  6 MONTHS PRO MASTERY
                </span>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-black font-mono text-white">
                    ${calcAppliedPromo ? 35 : 40}
                  </span>
                  {calcAppliedPromo && (
                    <span className="text-sm font-mono text-slate-400 line-through">$40</span>
                  )}
                  <span className="text-xs text-slate-400">/ 180 Days</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-6 font-normal">
                  Build unbreakable trade discipline. 180 days of continuous practice until setup execution is second nature.
                </p>

                <ul className="space-y-3 text-xs text-slate-200 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676] shrink-0" />
                    <span>Everything in 1 Month Pass</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676] shrink-0" />
                    <span>AI Autonomous Setup Radar Alert</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676] shrink-0" />
                    <span>AI Backtest Mentor Lessons (Why Win/Loss)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676] shrink-0" />
                    <span>Sub-Second Live Tick WebSocket Feed</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onGoogleLogin}
                className="w-full py-4 rounded-xl bg-white hover:bg-slate-100 text-xs font-black text-slate-950 shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-white"
              >
                <span>Unlock 6 Months with Google</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 12 MONTHS PLAN ($70 - ELITE) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#131F3C] border-2 border-slate-700 flex flex-col justify-between hover:border-slate-500 transition-all shadow-xl">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FFD700] block mb-2">
                  12 MONTHS ELITE TRADER
                </span>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-black font-mono text-white">
                    ${calcAppliedPromo ? 62 : 70}
                  </span>
                  {calcAppliedPromo && (
                    <span className="text-sm font-mono text-slate-400 line-through">$70</span>
                  )}
                  <span className="text-xs text-slate-400">/ 365 Days</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-6 font-normal">
                  Full 1-Year unrestricted access for serious traders and funded challenge takers. Less than $6/month!
                </p>

                <ul className="space-y-3 text-xs text-slate-200 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676] shrink-0" />
                    <span>All Pro Features for 365 Days</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676] shrink-0" />
                    <span>Save up to $8 with promo code</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676] shrink-0" />
                    <span>Priority Admin Instant Activation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676] shrink-0" />
                    <span>VIP Strategy Updates & Telegram Pass</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onGoogleLogin}
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-600"
              >
                <span>Get 1 Year with Google</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Binance Pay Banner */}
          <div className="mt-12 max-w-3xl mx-auto p-5 rounded-2xl bg-[#142347] border-2 border-[#F0B90B]/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-lg">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#F0B90B] text-black font-extrabold flex items-center justify-center shrink-0 text-base shadow-md">
                B
              </div>
              <div>
                <span className="text-white font-bold block text-sm">Verified Binance Pay Gateway</span>
                <span className="text-slate-300">
                  Official Pay ID: <strong className="font-mono text-white font-bold">{BINANCE_PAYMENT_CONFIG.payId}</strong> • Instant Admin Verification
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onGoogleLogin}
              className="px-5 py-2.5 rounded-xl bg-[#F0B90B] hover:bg-[#E0A800] text-black font-black text-xs cursor-pointer shadow-md"
            >
              Sign In to Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* 7. USER PROFILE & DISCIPLINE SUITE SHOWCASE */}
      <section className="py-20 px-4 sm:px-8 border-t border-slate-800 bg-[#0B1328]">
        <div className="max-w-[1300px] mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#131F3B] border border-blue-500/40 text-xs font-mono text-[#00E5FF] mb-4 font-bold">
              <Shield className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>// USER PROFILE & ACCOUNT CONTROL</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 font-display">
              Trader Profile, Risk Rules & 1-Click Logout
            </h2>
            <p className="text-sm sm:text-base text-slate-200">
              Your trading credentials, discipline rating, virtual $10,000 equity, and session status are always at your fingertips. Log out cleanly anytime with full Firebase encryption.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Feature 1: User Profile & Quick Logout */}
            <div className="p-6 rounded-3xl bg-[#131E38] border-2 border-slate-700 hover:border-blue-500/80 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-[#00E5FF] flex items-center justify-center mb-5 border border-blue-500/30">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 font-display">
                Trader Profile & Instant Logout
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                View your Google-verified profile, copy your encrypted User ID with one click, manage simulation preferences, and log out of your account cleanly from both the header and profile modal.
              </p>
              <div className="p-3 rounded-xl bg-[#0C152B] border border-slate-700/80 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                <span>Account Status:</span>
                <span className="text-[#00E676] font-bold">Encrypted Session</span>
              </div>
            </div>

            {/* Feature 2: Simulated Virtual Equity */}
            <div className="p-6 rounded-3xl bg-[#131E38] border-2 border-slate-700 hover:border-emerald-500/80 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-[#00E676] flex items-center justify-center mb-5 border border-emerald-500/30">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 font-display">
                $10,000 Virtual Practice Equity
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Execute simulated lots with Exness contract sizing. Test conservative 0.5%, institutional 1.0%, or aggressive 2.0% risk models without risking real capital.
              </p>
              <div className="p-3 rounded-xl bg-[#0C152B] border border-slate-700/80 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                <span>Default Balance:</span>
                <span className="text-white font-bold">$10,000.00 USD</span>
              </div>
            </div>

            {/* Feature 3: Discipline Adherence Score */}
            <div className="p-6 rounded-3xl bg-[#131E38] border-2 border-slate-700 hover:border-amber-500/80 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-[#FFD700] flex items-center justify-center mb-5 border border-amber-500/30">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 font-display">
                Discipline Rating (0-100)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Tradingguider computes your behavioural consistency. Moving stop losses away or revenge trading lowers your score, holding you accountable like a prop firm risk manager.
              </p>
              <div className="p-3 rounded-xl bg-[#0C152B] border border-slate-700/80 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                <span>Target Score:</span>
                <span className="text-[#00E5FF] font-bold">90+ / 100 Pro Tier</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. INFLUENCER PARTNER CALLOUT */}
      <section className="py-16 px-4 sm:px-8 border-t border-slate-800 bg-[#0E1730]">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-[#FFD700] border border-amber-500/40 text-xs font-mono mb-3 font-bold">
              <Users className="w-3.5 h-3.5" />
              <span>CREATOR & TRADING CHANNEL PARTNER PROGRAM</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 font-display">
              Are you a Trading Educator, YouTuber, or Signal Provider?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Join as an Official Partner. Get your own unique Coupon Code, give your followers $1 to $8 discounts,
              and earn <strong className="text-[#00E676] font-bold">$1 to $10 commission per referral</strong> paid directly to your Binance ID! (Min withdrawal $20).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowInfluencerModal(true)}
              className="px-6 py-3.5 rounded-2xl bg-[#FFB300] hover:bg-[#FFA000] text-slate-950 font-black text-xs shadow-xl transition-all cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>Join as Partner & Download Card</span>
            </button>
          </div>
        </div>
      </section>

      {/* 8. FOOTER WITH DISCREET HIDDEN ADMIN ENTRANCE */}
      <footer className="mt-auto border-t border-slate-800 bg-[#080E1E] py-8 px-4 sm:px-8 text-xs text-slate-400">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-mono">{BRAND_CONFIG.name}</span>
            <span>— 3-Month Bar Replay & AI Chart Mentor for BTC/USD & XAU/USD Gold.</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-slate-400">Simulated environment for trader skill mastery.</span>

            {/* Secret Round Admin Panel Entrance (Discreet button, access code: Jahid5359) */}
            <button
              type="button"
              onClick={() => setShowAdminModal(true)}
              title="System Node Status"
              className="w-4 h-4 rounded-full bg-slate-800 hover:bg-[#2962FF] border border-slate-700 hover:border-[#2962FF] transition-all cursor-pointer flex items-center justify-center opacity-50 hover:opacity-100 group"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] group-hover:bg-white" />
            </button>
          </div>
        </div>
      </footer>

      {/* Influencer Partner Portal Modal */}
      <InfluencerPortalModal
        isOpen={showInfluencerModal}
        onClose={() => setShowInfluencerModal(false)}
      />

      {/* Secret Admin Panel Modal */}
      <AdminPanelModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />
    </div>
  );
};
