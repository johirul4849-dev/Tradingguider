import React, { useState } from 'react';
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
} from 'lucide-react';
import { BRAND_CONFIG } from '../config/brand';
import {
  SUBSCRIPTION_PACKAGES,
  BINANCE_PAYMENT_CONFIG,
  subscriptionService,
} from '../services/subscriptionService';
import { InfluencerPortalModal } from './InfluencerPortalModal';
import { AdminPanelModal } from './AdminPanelModal';

interface LandingPageProps {
  onGoogleLogin: () => Promise<void>;
  isSigningIn: boolean;
  authError: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoogleLogin,
  isSigningIn,
  authError,
}) => {
  // Preview Chart State
  const [previewSymbol, setPreviewSymbol] = useState<'BTC/USD' | 'XAU/USD'>('BTC/USD');
  const [previewAiMarked, setPreviewAiMarked] = useState<boolean>(true);

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

  return (
    <div className="min-h-screen bg-[#07090E] text-[#D1D4DC] flex flex-col selection:bg-[#2962FF] selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Top High-Stakes Psychology Ticker */}
      <div className="bg-gradient-to-r from-[#0F131D] via-[#161D2E] to-[#0F131D] border-b border-[#1E2333] px-4 py-2.5 text-center text-xs font-medium text-[#94A3B8]">
        <div className="max-w-[1400px] mx-auto flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[#00E676] font-mono font-bold uppercase tracking-wider text-[11px] bg-[#00E676]/15 px-2.5 py-0.5 rounded-full border border-[#00E676]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-ping" />
            24H Free Access Active
          </span>
          <span>
            Sign in with Google now to get <strong>24 Hours of Unrestricted Bar Replay & AI SMC Auto-Marking</strong> for free!
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#07090E]/90 backdrop-blur-xl border-b border-[#1A1F2C]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 h-18 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2962FF] via-[#00B0FF] to-[#00E676] p-[1.5px] shadow-lg shadow-[#2962FF]/20">
              <div className="w-full h-full bg-[#07090E] rounded-[10px] flex items-center justify-center font-black text-white text-base">
                TP
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white font-mono">
                  {BRAND_CONFIG.name}
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md bg-[#131826] text-[#00E676] border border-[#232B40]">
                  PRO REPLAY ENGINE
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold text-[#94A3B8] tracking-wide">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Plans & Pricing
            </a>
            <a href="#preview" className="hover:text-white transition-colors">
              Interactive Preview
            </a>
            <button
              type="button"
              onClick={() => setShowInfluencerModal(true)}
              className="text-[#FFB300] hover:text-[#FFD54F] transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Creator Partner Program
            </button>
          </nav>

          {/* Google Login Primary CTA */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onGoogleLogin}
              disabled={isSigningIn}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white hover:bg-[#F1F3F4] text-black font-extrabold text-xs tracking-tight shadow-xl shadow-white/10 transition-all cursor-pointer disabled:opacity-50"
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
              <span>{isSigningIn ? 'Connecting...' : 'Sign In with Google'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-4 sm:px-8 overflow-hidden">
        {/* Glow Spheres in background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[360px] bg-gradient-to-tr from-[#2962FF]/20 via-[#00E676]/15 to-transparent blur-[140px] pointer-events-none" />

        <div className="max-w-[1300px] mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-12">
            {/* Free Trial Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111726] border border-[#252E47] text-xs font-mono text-[#00E676] mb-6 shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-[#FFB300]" />
              <span>BTC/USD & GOLD (XAU/USD) • 3 MONTHS LIVE BAR REPLAY</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-[70px] font-black text-white tracking-tight leading-[1.04] mb-6">
              STOP GUESSING.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2962FF] via-[#00B0FF] to-[#00E676]">
                MASTER PRICE ACTION
              </span>{' '}
              BEFORE TRADING REAL MONEY.
            </h1>

            <p className="text-base sm:text-xl text-[#94A3B8] max-w-3xl mx-auto leading-relaxed mb-8">
              Why do 94% of retail traders blow their accounts? Because they test setups live with real funds.
              Rewind 90 days of BTC & Gold candles, execute with real Exness mechanics, and let institutional
              AI auto-mark <strong className="text-white">FVGs, BOS, and exact confirmation candles</strong> on your chart.
            </p>

            {authError && (
              <div className="max-w-md mx-auto mb-6 p-3.5 rounded-xl bg-[#F23645]/15 border border-[#F23645]/40 text-xs text-[#F23645]">
                {authError}
              </div>
            )}

            {/* Google Sign-in Mega Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <button
                type="button"
                onClick={onGoogleLogin}
                disabled={isSigningIn}
                className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-white hover:bg-[#F8F9FA] text-black font-black text-base shadow-2xl shadow-white/20 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
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
                <span>{isSigningIn ? 'Connecting...' : 'Sign In with Google (24H Free Trial)'}</span>
              </button>
            </div>

            {/* Micro guarantees */}
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-[#94A3B8]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" />
                24 Hours Free Full Access
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" />
                No Credit Card Required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" />
                1-Click Instant Setup
              </span>
            </div>
          </div>

          {/* Interactive Chart Preview Mockup */}
          <div id="preview" className="rounded-2xl border border-[#242C42] bg-[#0E131F]/90 p-4 sm:p-6 shadow-2xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#1E2538]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewSymbol('BTC/USD')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                    !isGold
                      ? 'bg-[#2962FF] text-white shadow-md'
                      : 'bg-[#181F30] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  BTC/USD ($83,640)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSymbol('XAU/USD')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                    isGold
                      ? 'bg-[#FFB300] text-black shadow-md'
                      : 'bg-[#181F30] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  XAU/USD Gold ($2,948.50)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#94A3B8]">AI Detection Mode:</span>
                <button
                  type="button"
                  onClick={() => setPreviewAiMarked((v) => !v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    previewAiMarked
                      ? 'bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/40'
                      : 'bg-[#181F30] text-[#64748B]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {previewAiMarked ? 'AI High-Mark Active' : 'Raw Candles'}
                </button>
              </div>
            </div>

            {/* Stylized Visual Chart Mockup */}
            <div className="relative h-64 sm:h-80 w-full rounded-xl bg-[#090D16] border border-[#1A2030] overflow-hidden flex flex-col justify-end p-4">
              {/* Background TradingView Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#141A29_1px,transparent_1px),linear-gradient(to_bottom,#141A29_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

              {/* SMC High-Mark Mockup Overlays */}
              {previewAiMarked && (
                <div className="absolute top-12 left-1/4 z-10 bg-[#00E676]/10 border border-[#00E676]/50 rounded-lg p-2.5 text-xs text-[#00E676] font-mono shadow-xl backdrop-blur-sm animate-pulse-slow">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>⬆ AI BUY CONFIRMATION</span>
                    <span className="text-[10px] bg-[#00E676]/30 px-1.5 rounded text-white">1:3.2 R:R</span>
                  </div>
                  <div className="text-[11px] text-[#94A3B8] mt-0.5">
                    • Liquidity Sweep below wick • Bullish FVG Retest • Entry: {isGold ? '$2,946.00' : '$83,400.00'}
                  </div>
                </div>
              )}

              {/* Fibonacci Overlay Highlight */}
              <div className="absolute top-24 right-1/4 z-10 border-r-2 border-dashed border-[#FFB300] pr-3 text-right">
                <span className="text-[11px] font-mono text-[#00E676] font-bold block">
                  0.618 Golden Ratio ({isGold ? '$2,942.20' : '$83,120.00'})
                </span>
                <span className="text-[10px] font-mono text-[#FF9100] block">
                  0.500 Equilibrium ({isGold ? '$2,938.00' : '$82,900.00'})
                </span>
              </div>

              {/* Simulated Candlestick Silhouette */}
              <div className="relative z-10 flex items-end justify-between gap-2 h-44 px-4 opacity-85">
                {[60, 75, 45, 90, 80, 110, 95, 130, 120, 150, 135, 160, 175, 155, 190, 210, 180, 220].map(
                  (h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-0.5 ${i % 2 === 0 ? 'bg-[#089981]' : 'bg-[#F23645]'}`}
                        style={{ height: `${h + 16}px` }}
                      />
                      <div
                        className={`w-full max-w-[12px] rounded-sm ${
                          i % 2 === 0 ? 'bg-[#089981]' : 'bg-[#F23645]'
                        }`}
                        style={{ height: `${h}px` }}
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans & Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-8 border-t border-[#1A1F2C] bg-[#0A0D15]/80">
        <div className="max-w-[1300px] mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2962FF]/15 border border-[#2962FF]/30 text-xs font-mono text-[#38BDF8] mb-3">
              <Tag className="w-3.5 h-3.5" />
              <span>TRANSPARENT VALUE • 24H FREE TRIAL FIRST</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Invest in Strategy Mastery, Not Broker Donations
            </h2>
            <p className="text-sm sm:text-base text-[#94A3B8]">
              One blown 0.1 lot trade on Gold costs $150+. These passes give you 1 to 12 months of limitless
              simulation and AI confirmation training for a fraction of that.
            </p>
          </div>

          {/* Interactive Promo Code Discount Tester */}
          <div className="max-w-md mx-auto mb-10 p-4 rounded-xl bg-[#111624] border border-[#242C40]">
            <label className="block text-xs font-semibold text-[#94A3B8] mb-2 flex items-center justify-between">
              <span>Have an Influencer Partner Promo Code?</span>
              <span className="text-[#00E676] font-mono">Instant Discount</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. JAHID10, ALPHA5"
                value={calculatorPromoCode}
                onChange={(e) => setCalculatorPromoCode(e.target.value.toUpperCase())}
                className="flex-1 bg-[#090D16] border border-[#22293D] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-[#64748B] focus:outline-none focus:border-[#2962FF]"
              />
              <button
                type="button"
                onClick={handleTestPromo}
                className="px-4 py-2 rounded-lg bg-[#2962FF] hover:bg-[#1E53E5] text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>
            {calcAppliedPromo && (
              <p className="text-xs text-[#00E676] mt-2 font-mono font-semibold">
                ✓ Code {calcAppliedPromo} verified! Discounts applied to packages below:
              </p>
            )}
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* 1 MONTH PLAN ($8) */}
            <div className="relative p-6 sm:p-8 rounded-2xl bg-[#111624] border border-[#222A3E] flex flex-col justify-between hover:border-[#384360] transition-all shadow-xl">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#94A3B8] block mb-2">
                  1 MONTH PRO PASS
                </span>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-black font-mono text-white">
                    ${calcAppliedPromo ? 7 : 8}
                  </span>
                  {calcAppliedPromo && (
                    <span className="text-sm font-mono text-[#64748B] line-through">$8</span>
                  )}
                  <span className="text-xs text-[#94A3B8]">/ 30 Days</span>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed mb-6">
                  Perfect for rapid testing, weekend strategy verification, and backtesting your next 100 setups.
                </p>

                <ul className="space-y-3 text-xs text-[#D1D4DC] mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
                    <span>90 Days Bar Replay (BTC & Gold)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
                    <span>Real Exness Drag SL/TP Bracket</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
                    <span>AI Confirmation Candle Arrows</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
                    <span>Instant Admin Binance Verification</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onGoogleLogin}
                className="w-full py-3 rounded-xl bg-[#1E2538] hover:bg-[#28324C] text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Start with Google Sign In</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 6 MONTHS PLAN ($40 - POPULAR) */}
            <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#182238] to-[#111726] border-2 border-[#2962FF] flex flex-col justify-between shadow-2xl shadow-[#2962FF]/15">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#2962FF] to-[#00E676] text-white shadow-md">
                MOST POPULAR • BEST MASTERY VALUE
              </span>

              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#38BDF8] block mb-2 mt-2">
                  6 MONTHS PRO MASTERY
                </span>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-black font-mono text-white">
                    ${calcAppliedPromo ? 35 : 40}
                  </span>
                  {calcAppliedPromo && (
                    <span className="text-sm font-mono text-[#64748B] line-through">$40</span>
                  )}
                  <span className="text-xs text-[#94A3B8]">/ 180 Days</span>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed mb-6">
                  Build unbreakable trade discipline. 180 days of continuous practice until your setup execution is second nature.
                </p>

                <ul className="space-y-3 text-xs text-[#D1D4DC] mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
                    <span>Everything in 1 Month Pass</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
                    <span>AI Autonomous Setup Radar Alert</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
                    <span>AI Backtest Mentor Lessons (Why Win/Loss)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
                    <span>Sub-Second Live Tick WebSocket Feed</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onGoogleLogin}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#2962FF] to-[#00E676] hover:opacity-90 text-xs font-black text-white shadow-lg shadow-[#2962FF]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Unlock 6 Months with Google</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 12 MONTHS PLAN ($70 - ELITE) */}
            <div className="relative p-6 sm:p-8 rounded-2xl bg-[#111624] border border-[#222A3E] flex flex-col justify-between hover:border-[#384360] transition-all shadow-xl">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FFB300] block mb-2">
                  12 MONTHS ELITE TRADER
                </span>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-black font-mono text-white">
                    ${calcAppliedPromo ? 62 : 70}
                  </span>
                  {calcAppliedPromo && (
                    <span className="text-sm font-mono text-[#64748B] line-through">$70</span>
                  )}
                  <span className="text-xs text-[#94A3B8]">/ 365 Days</span>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed mb-6">
                  Full 1-Year unrestricted access for serious traders and funded challenge takers. Less than $6/month!
                </p>

                <ul className="space-y-3 text-xs text-[#D1D4DC] mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
                    <span>All Pro Features for 365 Days</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
                    <span>Max Savings: Customer saves $8 with promo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
                    <span>Priority Admin Instant Activation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
                    <span>VIP Discord & Strategy Updates</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onGoogleLogin}
                className="w-full py-3 rounded-xl bg-[#1E2538] hover:bg-[#28324C] text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Get 1 Year with Google</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Binance Pay Banner */}
          <div className="mt-12 max-w-3xl mx-auto p-4 rounded-xl bg-[#141824] border border-[#F0B90B]/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F0B90B] text-black font-extrabold flex items-center justify-center">
                B
              </div>
              <div>
                <span className="text-white font-bold block">Verified Binance Pay Gateway</span>
                <span className="text-[#94A3B8]">
                  Official Pay ID: <strong className="font-mono text-white">{BINANCE_PAYMENT_CONFIG.payId}</strong> • Instant Admin Verification
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onGoogleLogin}
              className="px-4 py-2 rounded-lg bg-[#F0B90B] hover:bg-[#E0A800] text-black font-bold text-xs cursor-pointer"
            >
              Sign In to Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* Influencer / Creator Partner Callout */}
      <section className="py-16 px-4 sm:px-8 border-t border-[#1A1F2C] bg-gradient-to-r from-[#0C101A] via-[#13192B] to-[#0C101A]">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFB300]/10 border border-[#FFB300]/30 text-xs font-mono text-[#FFB300] mb-3">
              <Users className="w-3.5 h-3.5" />
              <span>CREATOR & TRADING CHANNEL PARTNER PROGRAM</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              Are you a Trading Educator, YouTuber, or Signal Provider?
            </h3>
            <p className="text-xs sm:text-sm text-[#94A3B8] max-w-2xl leading-relaxed">
              Join as an Official Partner. Get your own unique Coupon Code, give your followers $1 to $8 discounts,
              and earn <strong className="text-[#00E676]">$1 to $10 commission per referral</strong> paid directly to your Binance ID! (Min withdrawal $20).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowInfluencerModal(true)}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF9100] hover:opacity-90 text-black font-black text-xs shadow-lg shadow-[#FFB300]/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>Join as Partner & Download JPG Card</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer with Discreet Hidden Admin Entrance */}
      <footer className="mt-auto border-t border-[#141A28] bg-[#07090E] py-8 px-4 sm:px-8 text-xs text-[#64748B]">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-mono">{BRAND_CONFIG.name}</span>
            <span>— 3-Month Bar Replay & AI Chart Mentor for BTC/USD & XAU/USD Gold.</span>
          </div>

          <div className="flex items-center gap-4">
            <span>Simulated environment for trader skill mastery.</span>

            {/* Secret Round Admin Panel Entrance (Discreet, matches prompt "public page a akdom niche round kono shape a admin panel login function build koro, mane hide system a public jeno na boje, admin access code holo Jahid5359") */}
            <button
              type="button"
              onClick={() => setShowAdminModal(true)}
              title="System Node Status"
              className="w-3.5 h-3.5 rounded-full bg-[#181F30] hover:bg-[#2962FF] border border-[#252E44] hover:border-[#2962FF] transition-all cursor-pointer flex items-center justify-center opacity-60 hover:opacity-100 group"
            >
              <span className="w-1 h-1 rounded-full bg-[#38BDF8] group-hover:bg-white" />
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
