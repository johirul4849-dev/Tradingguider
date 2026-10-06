import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Shield,
  Key,
  Copy,
  Check,
  LogOut,
  Sparkles,
  Award,
  DollarSign,
  TrendingUp,
  Sliders,
  Globe,
  Clock,
  CheckCircle2,
  X,
  CreditCard,
  Zap,
  Hourglass,
} from 'lucide-react';
import { UserProfileData } from '../lib/firebase';
import {
  UserSubscriptionRecord,
  SUBSCRIPTION_PACKAGES,
  calculateRemainingCountdown,
} from '../services/subscriptionService';
import { BRAND_CONFIG, SupportedSymbol, SupportedTimeframe } from '../config/brand';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfileData;
  userSubscription?: UserSubscriptionRecord | null;
  onSignOut: () => Promise<void> | void;
  onOpenSubscriptionModal?: () => void;
  onUpdatePreferences?: (updates: Partial<UserProfileData>) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  userSubscription,
  onSignOut,
  onOpenSubscriptionModal,
  onUpdatePreferences,
}) => {
  const [copiedUid, setCopiedUid] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [preferredPair, setPreferredPair] = useState<SupportedSymbol>(
    (profile.preferredMarket as SupportedSymbol) || 'BTC/USD'
  );
  const [riskPref, setRiskPref] = useState<number>(profile.riskPreference || 1.0);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Live countdown ticker every 1 second
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyUid = () => {
    navigator.clipboard.writeText(profile.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onSignOut();
      onClose();
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Compute membership label
  const isSubscribed = userSubscription?.status === 'ACTIVE_SUBSCRIBED';
  const isPending = userSubscription?.status === 'PENDING_APPROVAL';
  const isTrial = userSubscription?.status === 'TRIAL_ACTIVE';
  const isExpired = userSubscription?.status === 'TRIAL_EXPIRED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0F172A] border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-[#131E36] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2962FF] to-[#00E5FF] p-0.5 shadow-md">
              <div className="w-full h-full bg-[#0F172A] rounded-[10px] flex items-center justify-center text-white">
                <User className="w-4 h-4 text-[#00E5FF]" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Trader Profile & Settings</span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#00E676] border border-emerald-500/30">
                  Active Session
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Manage your Tradingguider credentials, subscription & risk preferences
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-200">
          {/* User Identity Card */}
          <div className="p-4 rounded-xl bg-[#131D33] border border-slate-700/80 shadow-inner flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-[#2962FF] via-[#00E5FF] to-[#00E676] p-[2px] shadow-lg">
                <div className="w-full h-full rounded-full bg-[#0F172A] flex items-center justify-center text-white font-black text-base font-mono">
                  {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : 'T'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#00E676] border-2 border-[#0F172A]" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">{profile.displayName || 'Pro Trader'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">
                    Google Verified
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{profile.email || 'No email associated'}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions: UID Copy + Instant Logout */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyUid}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Copy User ID"
              >
                {copiedUid ? <Check className="w-3.5 h-3.5 text-[#00E676]" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedUid ? 'Copied UID!' : 'Copy UID'}</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                title="Log Out of Account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isLoggingOut ? 'Signing out...' : 'Log Out Account'}</span>
              </button>
            </div>
          </div>

          {/* Subscription & Pass Card */}
          {(() => {
            const expiresAt = isSubscribed
              ? userSubscription?.subscriptionExpiresAt
              : isTrial
              ? userSubscription?.freeTrialExpiresAt
              : isPending && userSubscription?.freeTrialExpiresAt
              ? userSubscription?.freeTrialExpiresAt
              : userSubscription?.freeTrialExpiresAt || 0;
            const startedAt = isSubscribed
              ? userSubscription?.lastPaymentSubmission?.submittedAt || userSubscription?.firstLoginAt
              : userSubscription?.firstLoginAt;
            const countdown = calculateRemainingCountdown(expiresAt, startedAt, currentTime);

            return (
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#141D35] via-[#16223F] to-[#141D35] border border-blue-500/30 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FFD700]" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                      Membership & Pass Tier
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      isSubscribed
                        ? 'bg-emerald-500/20 text-[#00E676] border-emerald-500/40'
                        : isTrial
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : isPending
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {isSubscribed
                      ? 'PRO SUBSCRIBED'
                      : isTrial
                      ? '24H FREE TRIAL'
                      : isPending
                      ? 'PENDING VERIFICATION'
                      : 'TRIAL EXPIRED'}
                  </span>
                </div>

                {/* Live Auto Countdown Display Box */}
                <div className="mb-3 p-3 rounded-lg bg-[#0C1428] border border-slate-700/80">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400 font-mono flex items-center gap-1.5">
                      <Hourglass className={`w-3.5 h-3.5 ${countdown.isExpired ? 'text-rose-400' : 'text-[#00E5FF] animate-pulse'}`} />
                      <span>Remaining Access Time:</span>
                    </span>
                    <span className={`font-mono text-xs font-bold ${countdown.isExpired ? 'text-rose-400' : 'text-[#00E676]'}`}>
                      {countdown.isExpired ? 'TIME EXPIRED' : countdown.compactClock}
                    </span>
                  </div>

                  <div className={`text-xs font-mono font-bold ${countdown.isExpired ? 'text-rose-400' : 'text-[#00E5FF]'}`}>
                    {countdown.formattedString}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        countdown.isExpired
                          ? 'bg-rose-500 w-0'
                          : countdown.progressPercent > 50
                          ? 'bg-[#00E676]'
                          : countdown.progressPercent > 20
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                      }`}
                      style={{ width: `${countdown.isExpired ? 0 : countdown.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="text-slate-200 font-medium">
                      {isSubscribed
                        ? 'Full 90-Day Bar Replay, SMC Auto-Mark & AI Mentorship Unlocked'
                        : isTrial
                        ? 'Your 24-hour complimentary trial is currently active.'
                        : 'Your trial or package has expired. Upgrade to continue practicing.'}
                    </p>
                  </div>

                  {onOpenSubscriptionModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSubscriptionModal();
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2962FF] to-[#00E5FF] hover:opacity-95 text-white font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
                    >
                      {isSubscribed ? 'Manage Plan' : 'Purchase Package ($8)'}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Account Balance & Discipline Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#131D33] border border-slate-700/80">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Virtual Balance
              </span>
              <div className="flex items-baseline gap-1 text-2xl font-black font-mono text-white">
                <span className="text-[#00E676]">$</span>
                <span>{(profile.virtualBalance || 10000).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Simulated trading equity</span>
            </div>

            <div className="p-4 rounded-xl bg-[#131D33] border border-slate-700/80">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Discipline Rating
              </span>
              <div className="flex items-baseline gap-1 text-2xl font-black font-mono text-[#00E5FF]">
                <span>{profile.disciplineScore || 92}</span>
                <span className="text-xs text-slate-400 font-normal">/ 100</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Rule adherence score</span>
            </div>
          </div>

          {/* Trader Preferences */}
          <div className="p-4 rounded-xl bg-[#131D33] border border-slate-700/80 space-y-3.5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Trader Simulation Preferences</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1.5">Default Market Symbol</label>
                <select
                  value={preferredPair}
                  onChange={(e) => {
                    const val = e.target.value as SupportedSymbol;
                    setPreferredPair(val);
                    if (onUpdatePreferences) onUpdatePreferences({ preferredMarket: val });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="BTC/USD">BTC/USD (Bitcoin Spot)</option>
                  <option value="XAU/USD">XAU/USD (Gold COMEX Spot)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5">Default Risk Per Trade (%)</label>
                <select
                  value={riskPref}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setRiskPref(val);
                    if (onUpdatePreferences) onUpdatePreferences({ riskPreference: val });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value={0.5}>0.5% (Conservative)</option>
                  <option value={1.0}>1.0% (Standard Institutional)</option>
                  <option value={2.0}>2.0% (Aggressive)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Clear, High-Visibility Logout Button */}
        <div className="p-5 border-t border-slate-800 bg-[#111A2E] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Encrypted cloud session via Firebase Authentication</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-colors cursor-pointer"
            >
              Close
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/50 hover:border-rose-600 text-rose-300 hover:text-white font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLoggingOut ? 'Signing Out...' : 'Log Out of Account'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
