import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Download,
  Copy,
  Check,
  DollarSign,
  Users,
  ArrowUpRight,
  ShieldCheck,
  Lock,
  User,
  Mail,
  CreditCard,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  subscriptionService,
  InfluencerRecord,
  BINANCE_PAYMENT_CONFIG,
} from '../services/subscriptionService';
import { generateAndDownloadInfluencerJpg } from '../utils/influencerCardGenerator';

interface InfluencerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfluencerPortalModal: React.FC<InfluencerPortalModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Modes: 'APPLY' | 'CREDENTIALS_POPUP' | 'LOGIN' | 'DASHBOARD'
  const [mode, setMode] = useState<'APPLY' | 'CREDENTIALS_POPUP' | 'LOGIN' | 'DASHBOARD'>('APPLY');

  // Apply Form State
  const [applyName, setApplyName] = useState('');
  const [applyEmail, setApplyEmail] = useState('');
  const [applyBinanceId, setApplyBinanceId] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);

  // Registered credentials for popup
  const [registeredInfluencer, setRegisteredInfluencer] = useState<InfluencerRecord | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  // Login Form State
  const [loginUserOrEmail, setLoginUserOrEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Logged-in Influencer Dashboard
  const [activeInfluencer, setActiveInfluencer] = useState<InfluencerRecord | null>(null);
  const [editBinanceId, setEditBinanceId] = useState('');
  const [binanceSaveSuccess, setBinanceSaveSuccess] = useState(false);

  // Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState<number>(BINANCE_PAYMENT_CONFIG.minWithdrawal);
  const [withdrawMsg, setWithdrawMsg] = useState<{ tone: 'green' | 'red'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyName.trim() || !applyEmail.trim()) {
      setApplyError('Please enter your full name and valid email address.');
      return;
    }

    const res = subscriptionService.registerInfluencer({
      name: applyName,
      email: applyEmail,
      binanceId: applyBinanceId,
    });

    if (res.success && res.influencer) {
      setRegisteredInfluencer(res.influencer);
      setActiveInfluencer(res.influencer);
      setEditBinanceId(res.influencer.binanceId);
      setMode('CREDENTIALS_POPUP');
      setApplyError(null);
    } else {
      setApplyError(res.message);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUserOrEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please enter your User ID/Email and Password.');
      return;
    }

    const inf = subscriptionService.influencerLogin(loginUserOrEmail, loginPassword);
    if (inf) {
      setActiveInfluencer(inf);
      setEditBinanceId(inf.binanceId);
      setMode('DASHBOARD');
      setLoginError(null);
    } else {
      setLoginError('Invalid User ID or Password. Try again or check your saved credentials.');
    }
  };

  const handleDownloadJpg = (inf: InfluencerRecord) => {
    generateAndDownloadInfluencerJpg(inf);
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2200);
  };

  const handleSaveBinanceId = () => {
    if (!activeInfluencer) return;
    const ok = subscriptionService.updateInfluencerBinanceId(activeInfluencer.id, editBinanceId);
    if (ok) {
      activeInfluencer.binanceId = editBinanceId.trim();
      setBinanceSaveSuccess(true);
      setTimeout(() => setBinanceSaveSuccess(false), 2500);
    }
  };

  const handleRequestWithdraw = () => {
    if (!activeInfluencer) return;
    const res = subscriptionService.requestInfluencerWithdrawal(activeInfluencer.id, Number(withdrawAmount));
    if (res.success) {
      setWithdrawMsg({ tone: 'green', text: res.message });
      // refresh influencer
      const updated = subscriptionService.getAllInfluencers().find((i) => i.id === activeInfluencer.id);
      if (updated) setActiveInfluencer({ ...updated });
    } else {
      setWithdrawMsg({ tone: 'red', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#131722] border border-[#2A2E39] rounded-2xl shadow-2xl p-6 sm:p-8 text-[#D1D4DC]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#94A3B8] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Switcher Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-[#2A2E39] pb-3">
          <button
            onClick={() => setMode('APPLY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'APPLY' || mode === 'CREDENTIALS_POPUP'
                ? 'bg-[#2962FF] text-white shadow-md'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Join as Partner
          </button>
          <button
            onClick={() => setMode('LOGIN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'LOGIN'
                ? 'bg-[#2962FF] text-white shadow-md'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Influencer Login
          </button>
          {activeInfluencer && (
            <button
              onClick={() => setMode('DASHBOARD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'DASHBOARD'
                  ? 'bg-[#00E676] text-black shadow-md'
                  : 'text-[#00E676] hover:underline'
              }`}
            >
              My Dashboard ({activeInfluencer.couponCode})
            </button>
          )}
        </div>

        {/* MODE: APPLY / REGISTRATION */}
        {mode === 'APPLY' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFB300] to-[#FF9100] flex items-center justify-center text-black font-extrabold shadow-lg">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Join Creator & Influencer Partner Program</h3>
                <p className="text-xs text-[#94A3B8]">
                  Share your exclusive promo code, give discounts to followers & earn USDT payouts!
                </p>
              </div>
            </div>

            {/* Commission Breakdown Highlight */}
            <div className="grid grid-cols-3 gap-2.5 my-4 p-3.5 rounded-xl bg-[#0B0E14] border border-[#2A2E39]">
              <div className="text-center p-2 rounded-lg bg-[#181C27]">
                <span className="text-[10px] text-[#94A3B8] block">1 Month ($8)</span>
                <span className="text-xs text-[#38BDF8] block">User saves $1</span>
                <span className="text-sm font-bold text-[#00E676]">You Earn $1</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-[#181C27] border border-[#00E676]/30">
                <span className="text-[10px] text-[#94A3B8] block">6 Months ($40)</span>
                <span className="text-xs text-[#38BDF8] block">User saves $5</span>
                <span className="text-sm font-bold text-[#00E676]">You Earn $5</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-[#181C27] border border-[#FFB300]/30">
                <span className="text-[10px] text-[#94A3B8] block">12 Months ($70)</span>
                <span className="text-xs text-[#38BDF8] block">User saves $8</span>
                <span className="text-sm font-bold text-[#00E676]">You Earn $10</span>
              </div>
            </div>

            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  Full Name / Channel / Handle *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-[#64748B]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jahid Trading Academy"
                    value={applyName}
                    onChange={(e) => setApplyName(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-[#2A2E39] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#2962FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-[#64748B]" />
                  <input
                    type="email"
                    required
                    placeholder="partner@yourchannel.com"
                    value={applyEmail}
                    onChange={(e) => setApplyEmail(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-[#2A2E39] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#2962FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  Received Binance Pay ID Number{' '}
                  <span className="text-[#64748B] font-normal">(Optional - can edit/add later)</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3 top-3 text-[#64748B]" />
                  <input
                    type="text"
                    placeholder="e.g. 794380283 or your Binance Pay ID"
                    value={applyBinanceId}
                    onChange={(e) => setApplyBinanceId(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-[#2A2E39] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#2962FF]"
                  />
                </div>
              </div>

              {applyError && (
                <div className="p-3 rounded-lg bg-[#F23645]/10 border border-[#F23645]/30 text-xs text-[#F23645]">
                  {applyError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FFB300] via-[#FF9100] to-[#00E676] hover:opacity-90 font-bold text-xs text-black shadow-lg shadow-[#FFB300]/20 transition-all cursor-pointer"
              >
                Register & Generate Partner ID & Coupon Code
              </button>
            </form>
          </div>
        )}

        {/* MODE: CREDENTIALS POPUP AFTER REGISTRATION */}
        {mode === 'CREDENTIALS_POPUP' && registeredInfluencer && (
          <div className="text-center py-2">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#00E676]/20 border border-[#00E676] flex items-center justify-center text-[#00E676]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-white mb-1">
              Welcome to the Partner Program!
            </h3>
            <p className="text-xs text-[#94A3B8] max-w-md mx-auto mb-6">
              Your partner credentials and exclusive coupon code are generated below. Save or download
              them in JPG format!
            </p>

            {/* Credentials Card Display */}
            <div className="max-w-md mx-auto p-5 rounded-2xl bg-[#0B0E14] border-2 border-[#00E676]/40 text-left shadow-2xl mb-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#2A2E39] mb-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#64748B] block">
                    Your Exclusive Coupon Code
                  </span>
                  <span className="text-2xl font-black font-mono text-[#00E676]">
                    {registeredInfluencer.couponCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCoupon(registeredInfluencer.couponCode)}
                  className="px-3 py-1.5 rounded-lg bg-[#1E222D] hover:bg-[#2A2E39] border border-[#2A2E39] text-xs font-mono text-white flex items-center gap-1.5 transition-colors"
                >
                  {copiedCoupon ? <Check className="w-3.5 h-3.5 text-[#00E676]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCoupon ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#1E222D]">
                  <span className="text-[#94A3B8]">Portal User ID:</span>
                  <span className="font-mono text-white font-bold">{registeredInfluencer.userId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1E222D]">
                  <span className="text-[#94A3B8]">Password:</span>
                  <span className="font-mono text-[#FF9100] font-bold">{registeredInfluencer.password}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#94A3B8]">Binance ID:</span>
                  <span className="font-mono text-white">
                    {registeredInfluencer.binanceId || 'Not set (Add in portal)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <button
                type="button"
                onClick={() => handleDownloadJpg(registeredInfluencer)}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#2962FF] to-[#00E676] hover:opacity-90 font-bold text-xs text-white shadow-lg transition-all"
              >
                <Download className="w-4 h-4" />
                Download Partner Card (JPG)
              </button>
              <button
                type="button"
                onClick={() => setMode('DASHBOARD')}
                className="inline-flex items-center justify-center py-3 px-5 rounded-xl bg-[#1E222D] hover:bg-[#2A2E39] border border-[#2A2E39] text-xs font-semibold text-white transition-colors"
              >
                Go to Portal Dashboard
              </button>
            </div>
          </div>
        )}

        {/* MODE: LOGIN */}
        {mode === 'LOGIN' && (
          <div className="max-w-md mx-auto py-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#2962FF]/20 border border-[#2962FF] flex items-center justify-center text-[#2962FF]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Influencer Portal Login</h3>
                <p className="text-xs text-[#94A3B8]">
                  Log in with your User ID / Coupon Code and Password
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  Portal User ID, Email, or Coupon Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. inf_jahid_123 or JAHID10"
                  value={loginUserOrEmail}
                  onChange={(e) => setLoginUserOrEmail(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-[#2A2E39] rounded-lg px-3 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#2962FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter your partner password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-[#2A2E39] rounded-lg px-3 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#2962FF]"
                />
              </div>

              {loginError && (
                <div className="p-3 rounded-lg bg-[#F23645]/10 border border-[#F23645]/30 text-xs text-[#F23645]">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#2962FF] hover:bg-[#1E53E5] font-bold text-xs text-white shadow-lg shadow-[#2962FF]/20 transition-all cursor-pointer"
              >
                Log In to Influencer Portal
              </button>
            </form>
          </div>
        )}

        {/* MODE: DASHBOARD */}
        {mode === 'DASHBOARD' && activeInfluencer && (
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#2A2E39] mb-4">
              <div>
                <span className="text-[10px] text-[#64748B] uppercase tracking-wider block">
                  Influencer Portal
                </span>
                <h3 className="text-lg font-extrabold text-white">
                  {activeInfluencer.name} ({activeInfluencer.couponCode})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleDownloadJpg(activeInfluencer)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E222D] hover:bg-[#2A2E39] border border-[#2A2E39] text-xs font-semibold text-[#38BDF8] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download JPG Card
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#2A2E39]">
                <span className="text-[10px] text-[#94A3B8] block mb-1">Total Referrals</span>
                <span className="text-2xl font-bold font-mono text-white">
                  {activeInfluencer.totalReferrals}
                </span>
                <span className="text-[10px] text-[#64748B] block mt-0.5">Purchases using your code</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#2A2E39]">
                <span className="text-[10px] text-[#94A3B8] block mb-1">Total Earned</span>
                <span className="text-2xl font-bold font-mono text-[#00E676]">
                  ${activeInfluencer.totalEarnings.toFixed(2)}
                </span>
                <span className="text-[10px] text-[#64748B] block mt-0.5">Lifetime affiliate commissions</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#00E676]/40">
                <span className="text-[10px] text-[#00E676] block mb-1 font-semibold">Available for Withdrawal</span>
                <span className="text-2xl font-bold font-mono text-white">
                  ${activeInfluencer.availableBalance.toFixed(2)}
                </span>
                <span className="text-[10px] text-[#64748B] block mt-0.5">Min withdrawal: $20</span>
              </div>
            </div>

            {/* Binance ID Management */}
            <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#2A2E39] mb-6">
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                Received Binance Pay ID / USDT Address (Required for payouts)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter your Binance Pay ID (e.g. 794380283)"
                  value={editBinanceId}
                  onChange={(e) => setEditBinanceId(e.target.value)}
                  className="flex-1 bg-[#131722] border border-[#2A2E39] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-[#64748B] focus:outline-none focus:border-[#00E676]"
                />
                <button
                  type="button"
                  onClick={handleSaveBinanceId}
                  className="px-4 py-2 rounded-lg bg-[#1E222D] hover:bg-[#2A2E39] border border-[#2A2E39] text-xs font-semibold text-white transition-colors"
                >
                  {binanceSaveSuccess ? 'Saved ✓' : 'Update ID'}
                </button>
              </div>
            </div>

            {/* Withdrawal Section */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#1E222D] to-[#141822] border border-[#2A2E39]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#00E676]" />
                  <span className="text-xs font-bold text-white">Request Commission Payout</span>
                </div>
                <span className="text-xs text-[#94A3B8]">
                  Min: <strong className="text-white">${BINANCE_PAYMENT_CONFIG.minWithdrawal}</strong>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="w-full sm:w-48">
                  <input
                    type="number"
                    min={BINANCE_PAYMENT_CONFIG.minWithdrawal}
                    max={activeInfluencer.availableBalance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full bg-[#0B0E14] border border-[#2A2E39] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#00E676]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRequestWithdraw}
                  disabled={activeInfluencer.availableBalance < BINANCE_PAYMENT_CONFIG.minWithdrawal}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-lg bg-[#00E676] hover:bg-[#00C853] text-black font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Submit Withdrawal to Binance ID
                </button>
              </div>

              {withdrawMsg && (
                <p
                  className={`text-xs mt-3 font-semibold ${
                    withdrawMsg.tone === 'green' ? 'text-[#00E676]' : 'text-[#F23645]'
                  }`}
                >
                  {withdrawMsg.text}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
