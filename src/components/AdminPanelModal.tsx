import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Lock,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  CreditCard,
  Search,
  Check,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Calendar,
  Hourglass,
  Sliders,
  Zap,
} from 'lucide-react';
import {
  subscriptionService,
  BINANCE_PAYMENT_CONFIG,
  UserSubscriptionRecord,
  InfluencerRecord,
  InfluencerWithdrawalRequest,
  SUBSCRIPTION_PACKAGES,
  calculateRemainingCountdown,
} from '../services/subscriptionService';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  // Tabs: 'USER_COUNTDOWNS' | 'REQUESTS' | 'FINANCE' | 'INFLUENCERS' | 'WITHDRAWALS' | 'MANUAL_GRANT'
  const [activeTab, setActiveTab] = useState<
    'USER_COUNTDOWNS' | 'REQUESTS' | 'FINANCE' | 'INFLUENCERS' | 'WITHDRAWALS' | 'MANUAL_GRANT'
  >('USER_COUNTDOWNS');

  // Real-time ticking clock for auto countdown
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Filter & Search for user countdowns
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<
    'ALL' | 'TRIAL' | 'SUBSCRIBED' | 'PENDING' | 'EXPIRED'
  >('ALL');

  // Live data states
  const [subscriptions, setSubscriptions] = useState<UserSubscriptionRecord[]>([]);
  const [influencers, setInfluencers] = useState<InfluencerRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<InfluencerWithdrawalRequest[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Manual Grant State
  const [manualUid, setManualUid] = useState('');
  const [manualDays, setManualDays] = useState(30);

  const refreshData = () => {
    setSubscriptions(subscriptionService.getAllSubscriptions());
    setInfluencers(subscriptionService.getAllInfluencers());
    setWithdrawals(subscriptionService.getAllWithdrawals());
  };

  // Live tick every second for real-time month & time countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      refreshData();
      const unsub = subscriptionService.subscribe(refreshData);
      return unsub;
    }
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput.trim() === BINANCE_PAYMENT_CONFIG.adminPasscode) {
      setIsAuthenticated(true);
      setPasscodeError(null);
      refreshData();
    } else {
      setPasscodeError('Invalid admin passcode. Access denied.');
    }
  };

  const handleApproveSub = (uid: string) => {
    const ok = subscriptionService.approvePayment(uid);
    if (ok) {
      setActionNotice('✓ Subscription payment approved & activated! Influencer commission credited.');
      refreshData();
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  const handleRejectSub = (uid: string) => {
    const ok = subscriptionService.rejectPayment(uid, 'Binance transaction verification failed.');
    if (ok) {
      setActionNotice('Subscription payment rejected.');
      refreshData();
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  const handleGrantTrial = (uid: string) => {
    const ok = subscriptionService.grantExtraTrialHours(uid, 24);
    if (ok) {
      setActionNotice('Granted +24h free backtest trial to user.');
      refreshData();
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  const handleGrantPackage = (uid: string, packageId: 'MONTH_1' | 'MONTH_6' | 'MONTH_12') => {
    const ok = subscriptionService.grantPackage(uid, packageId);
    if (ok) {
      setActionNotice(`Granted ${SUBSCRIPTION_PACKAGES[packageId].name} to user! Countdown started.`);
      refreshData();
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  const handleExpireUser = (uid: string) => {
    const ok = subscriptionService.expireUserNow(uid);
    if (ok) {
      setActionNotice('User access expired and locked. User will be prompted to purchase package.');
      refreshData();
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  const handleApproveWithdrawal = (id: string) => {
    const ok = subscriptionService.approveWithdrawal(id);
    if (ok) {
      setActionNotice('Withdrawal marked as PAID (transferred via Binance).');
      refreshData();
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  const handleRejectWithdrawal = (id: string) => {
    const ok = subscriptionService.rejectWithdrawal(id, 'Invalid Binance ID or transaction error.');
    if (ok) {
      setActionNotice('Withdrawal rejected and balance refunded to influencer.');
      refreshData();
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  const handleManualGrantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUid.trim()) return;
    subscriptionService.grantManualAccess(manualUid.trim(), manualDays);
    setActionNotice(`Granted ${manualDays} days subscription to ${manualUid}!`);
    refreshData();
    setTimeout(() => setActionNotice(null), 3500);
  };

  const fin = subscriptionService.getFinancialSummary();
  const pendingSubs = subscriptions.filter(
    (s) => s.lastPaymentSubmission && s.lastPaymentSubmission.status === 'PENDING'
  );
  const pendingWiths = withdrawals.filter((w) => w.status === 'PENDING');

  // Filtered users for countdown tab
  const filteredUsers = subscriptions.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.uid.toLowerCase().includes(userSearchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (userStatusFilter === 'TRIAL') return u.status === 'TRIAL_ACTIVE';
    if (userStatusFilter === 'SUBSCRIBED') return u.status === 'ACTIVE_SUBSCRIBED';
    if (userStatusFilter === 'PENDING') return u.status === 'PENDING_APPROVAL';
    if (userStatusFilter === 'EXPIRED') return u.status === 'TRIAL_EXPIRED';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#131722] border border-[#2A2E39] rounded-2xl shadow-2xl p-6 sm:p-8 text-[#D1D4DC]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#94A3B8] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* PASSCODE MODAL GATE */}
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto py-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#F0B90B]/10 border border-[#F0B90B]/40 flex items-center justify-center text-[#F0B90B] shadow-lg">
              <Shield className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Tradingguider Smart Admin Console</h3>
            <p className="text-xs text-[#94A3B8] mb-6">
              Enter the authorized access code to manage subscriptions, Binance finance, and influencer
              payouts.
            </p>

            <form onSubmit={handleVerifyPasscode} className="space-y-4">
              <input
                type="password"
                autoFocus
                placeholder="Enter Admin Access Code"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#2A2E39] rounded-xl px-4 py-3 text-center text-sm font-mono text-white tracking-widest placeholder-[#64748B] focus:outline-none focus:border-[#F0B90B]"
              />

              {passcodeError && (
                <p className="text-xs text-[#F23645] font-semibold">{passcodeError}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F0B90B] to-[#FF9100] text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#F0B90B]/20 transition-all cursor-pointer"
              >
                Verify & Unlock Dashboard
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN DASHBOARD */
          <div>
            {/* Top Admin Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2E39] pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#F0B90B] text-black font-black flex items-center justify-center shadow-md">
                  TP
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>Smart Admin Panel</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/40">
                      LIVE
                    </span>
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    Official Binance Pay ID: <strong className="text-white font-mono">{BINANCE_PAYMENT_CONFIG.payId}</strong>
                  </p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setActiveTab('USER_COUNTDOWNS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'USER_COUNTDOWNS'
                      ? 'bg-gradient-to-r from-[#2962FF] to-[#00E5FF] text-white shadow-md'
                      : 'bg-[#181C27] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <Hourglass className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>User Countdowns ({subscriptions.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('REQUESTS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative cursor-pointer ${
                    activeTab === 'REQUESTS'
                      ? 'bg-[#2962FF] text-white'
                      : 'bg-[#181C27] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  Payment Requests
                  {pendingSubs.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-[#F23645] text-white">
                      {pendingSubs.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('FINANCE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'FINANCE'
                      ? 'bg-[#2962FF] text-white'
                      : 'bg-[#181C27] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  Smart Finance
                </button>

                <button
                  onClick={() => setActiveTab('INFLUENCERS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'INFLUENCERS'
                      ? 'bg-[#2962FF] text-white'
                      : 'bg-[#181C27] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  Influencer List ({influencers.length})
                </button>

                <button
                  onClick={() => setActiveTab('WITHDRAWALS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative cursor-pointer ${
                    activeTab === 'WITHDRAWALS'
                      ? 'bg-[#2962FF] text-white'
                      : 'bg-[#181C27] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  Payouts
                  {pendingWiths.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-[#FF9100] text-black font-extrabold">
                      {pendingWiths.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('MANUAL_GRANT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'MANUAL_GRANT'
                      ? 'bg-[#2962FF] text-white'
                      : 'bg-[#181C27] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  Direct Override
                </button>
              </div>
            </div>

            {/* Notification Banner */}
            {actionNotice && (
              <div className="mb-4 p-3 rounded-lg bg-[#00E676]/15 border border-[#00E676]/40 text-xs font-semibold text-[#00E676] flex items-center gap-2">
                <Check className="w-4 h-4" />
                {actionNotice}
              </div>
            )}

            {/* TAB 0: LIVE USER COUNTDOWNS & SUBSCRIPTION MANAGEMENT */}
            {activeTab === 'USER_COUNTDOWNS' && (
              <div className="space-y-4">
                {/* Header with Search and Filter */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0B0E14] p-4 rounded-xl border border-[#2A2E39]">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Hourglass className="w-4 h-4 text-[#00E5FF] animate-pulse" />
                      <span>Live User Access & Month Countdowns</span>
                      <span className="text-[11px] font-mono font-normal text-[#00E676] bg-[#00E676]/15 px-2 py-0.5 rounded-full border border-[#00E676]/30">
                        Auto-Updating Live
                      </span>
                    </h4>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      Real-time live month, day, hour, minute and second countdown for every registered user.
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full md:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                    <input
                      type="text"
                      placeholder="Search Name, Email, UID..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full bg-[#181C27] border border-[#2A2E39] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#2962FF]"
                    />
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-[#64748B] text-[11px] font-mono mr-1">Filter by status:</span>
                  {(
                    [
                      { id: 'ALL', label: `All Users (${subscriptions.length})` },
                      {
                        id: 'TRIAL',
                        label: `24h Trial Active (${subscriptions.filter((s) => s.status === 'TRIAL_ACTIVE').length})`,
                      },
                      {
                        id: 'SUBSCRIBED',
                        label: `Pro Subscribed (${subscriptions.filter((s) => s.status === 'ACTIVE_SUBSCRIBED').length})`,
                      },
                      {
                        id: 'PENDING',
                        label: `Pending Review (${subscriptions.filter((s) => s.status === 'PENDING_APPROVAL').length})`,
                      },
                      {
                        id: 'EXPIRED',
                        label: `Expired (${subscriptions.filter((s) => s.status === 'TRIAL_EXPIRED').length})`,
                      },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setUserStatusFilter(f.id)}
                      className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                        userStatusFilter === f.id
                          ? 'bg-[#2962FF] text-white shadow-sm'
                          : 'bg-[#181C27] text-[#94A3B8] hover:text-white border border-[#2A2E39]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* User Cards List with Live Auto Countdowns */}
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center bg-[#0B0E14] border border-[#2A2E39] rounded-xl text-xs text-[#64748B]">
                    No users match your search or filter.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.map((user) => {
                      const isSubscribed = user.status === 'ACTIVE_SUBSCRIBED';
                      const isTrial = user.status === 'TRIAL_ACTIVE';
                      const isPending = user.status === 'PENDING_APPROVAL';
                      const isExpired = user.status === 'TRIAL_EXPIRED';

                      const expiresAt = isSubscribed
                        ? user.subscriptionExpiresAt
                        : isTrial
                        ? user.freeTrialExpiresAt
                        : isPending && user.freeTrialExpiresAt
                        ? user.freeTrialExpiresAt
                        : user.freeTrialExpiresAt || 0;

                      const startedAt = isSubscribed
                        ? user.lastPaymentSubmission?.submittedAt || user.firstLoginAt
                        : user.firstLoginAt;

                      const countdown = calculateRemainingCountdown(expiresAt, startedAt, currentTime);

                      const pkgName = user.activePackageId
                        ? SUBSCRIPTION_PACKAGES[user.activePackageId]?.name
                        : isTrial
                        ? '24-Hour Free Backtest Trial'
                        : isSubscribed
                        ? 'Pro Pass'
                        : 'No Active Package';

                      return (
                        <div
                          key={user.uid}
                          className={`p-4 rounded-xl bg-[#0B0E14] border transition-all ${
                            isExpired
                              ? 'border-rose-900/60 bg-rose-950/10'
                              : isPending
                              ? 'border-amber-700/60 bg-amber-950/10'
                              : isSubscribed
                              ? 'border-blue-700/60 bg-blue-950/10'
                              : 'border-emerald-700/60 bg-emerald-950/10'
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* User Info Column */}
                            <div className="flex items-start gap-3.5 min-w-[240px]">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 ${
                                  isExpired
                                    ? 'bg-rose-900 text-rose-200'
                                    : isSubscribed
                                    ? 'bg-gradient-to-tr from-[#2962FF] to-[#00E5FF]'
                                    : isTrial
                                    ? 'bg-emerald-600'
                                    : 'bg-amber-600'
                                }`}
                              >
                                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                              </div>

                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-white text-sm">{user.displayName}</span>
                                  {/* Status Badges */}
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${
                                      isSubscribed
                                        ? 'bg-blue-500/20 text-[#38BDF8] border-blue-500/40'
                                        : isTrial
                                        ? 'bg-emerald-500/20 text-[#00E676] border-emerald-500/40'
                                        : isPending
                                        ? 'bg-amber-500/20 text-[#F59E0B] border-amber-500/40'
                                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                    }`}
                                  >
                                    {isSubscribed
                                      ? 'PRO SUBSCRIBED'
                                      : isTrial
                                      ? '24H TRIAL ACTIVE'
                                      : isPending
                                      ? 'PAYMENT PENDING'
                                      : 'EXPIRED / LOCKED'}
                                  </span>
                                </div>

                                <div className="text-xs text-[#94A3B8] font-mono flex items-center gap-2">
                                  <span>{user.email}</span>
                                  <span className="text-[#64748B]">·</span>
                                  <span className="text-[10px] text-[#64748B]">UID: {user.uid}</span>
                                </div>

                                <div className="text-[11px] text-[#64748B] flex items-center gap-2 pt-0.5">
                                  <span>Package: <strong className="text-white">{pkgName}</strong></span>
                                  <span>·</span>
                                  <span>First joined: {new Date(user.firstLoginAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>

                            {/* Center Column: LIVE REAL-TIME COUNTDOWN TIMER (Months, Days, Hours, Mins, Secs) */}
                            <div className="flex-1 max-w-md bg-[#131722] p-3 rounded-xl border border-[#2A2E39]">
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="text-[#94A3B8] font-mono flex items-center gap-1.5">
                                  <Clock className={`w-3.5 h-3.5 ${countdown.isExpired ? 'text-rose-400' : 'text-[#00E5FF] animate-spin-slow'}`} />
                                  <span>Auto Countdown Timer</span>
                                </span>
                                <span
                                  className={`font-mono text-xs font-bold ${
                                    countdown.isExpired ? 'text-rose-400' : 'text-[#00E676]'
                                  }`}
                                >
                                  {countdown.isExpired ? 'TIME EXPIRED' : `${countdown.progressPercent}% Time Left`}
                                </span>
                              </div>

                              {/* Ticking Digital Monospace Clock */}
                              <div
                                className={`text-base sm:text-lg font-black font-mono tracking-wider py-1 px-2.5 rounded-lg border text-center ${
                                  countdown.isExpired
                                    ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                                    : 'bg-[#0B0E14] border-slate-700 text-white shadow-inner'
                                }`}
                              >
                                {countdown.compactClock}
                              </div>

                              {/* Verbal readable format */}
                              <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
                                <span className={countdown.isExpired ? 'text-rose-400 font-bold' : 'text-[#00E5FF]'}>
                                  {countdown.formattedString}
                                </span>
                                {Boolean(expiresAt && expiresAt > 0) && (
                                  <span className="text-[#64748B]">
                                    Ends: {new Date(expiresAt || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>

                              {/* Visual Progress Bar */}
                              <div className="w-full bg-[#1F2430] h-1.5 rounded-full mt-2 overflow-hidden">
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

                            {/* Right Column: One-Click Instant Admin Controls */}
                            <div className="flex flex-col sm:flex-row lg:flex-col gap-1.5 shrink-0 justify-center">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleGrantTrial(user.uid)}
                                  className="px-2.5 py-1 rounded-md bg-[#181C27] hover:bg-[#2A2E39] text-[11px] font-semibold text-[#00E5FF] border border-[#00E5FF]/30 transition-all cursor-pointer whitespace-nowrap"
                                  title="Add +24h Free Trial Access"
                                >
                                  +24h Trial
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleGrantPackage(user.uid, 'MONTH_1')}
                                  className="px-2.5 py-1 rounded-md bg-[#2962FF]/20 hover:bg-[#2962FF]/40 text-[11px] font-semibold text-white border border-[#2962FF]/40 transition-all cursor-pointer whitespace-nowrap"
                                  title="Activate 1 Month Pro Pass (30 Days)"
                                >
                                  +1 Mo (30d)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleGrantPackage(user.uid, 'MONTH_6')}
                                  className="px-2.5 py-1 rounded-md bg-purple-500/20 hover:bg-purple-500/40 text-[11px] font-semibold text-purple-300 border border-purple-500/40 transition-all cursor-pointer whitespace-nowrap"
                                  title="Activate 6 Months Mastery (180 Days)"
                                >
                                  +6 Mo (180d)
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleGrantPackage(user.uid, 'MONTH_12')}
                                  className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/40 text-[11px] font-semibold text-amber-300 border border-amber-500/40 transition-all cursor-pointer whitespace-nowrap"
                                  title="Activate 12 Months Elite Pass (365 Days)"
                                >
                                  +1 Year (365d)
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleExpireUser(user.uid)}
                                  className="px-2.5 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/40 text-[11px] font-semibold text-rose-300 border border-rose-500/40 transition-all cursor-pointer whitespace-nowrap"
                                  title="Expire Access Immediately (Prompt to purchase package)"
                                >
                                  Expire Now
                                </button>

                                {isPending && (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveSub(user.uid)}
                                    className="px-3 py-1 rounded-md bg-[#00E676] hover:bg-[#00C853] text-[11px] font-black text-black shadow-md cursor-pointer whitespace-nowrap"
                                  >
                                    Approve
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: SUBSCRIPTION PAYMENT REQUESTS */}
            {activeTab === 'REQUESTS' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Pending Binance Submissions</span>
                    <span className="text-xs text-[#94A3B8]">({pendingSubs.length} awaiting review)</span>
                  </h4>
                  <button
                    onClick={refreshData}
                    className="p-1.5 rounded-md bg-[#181C27] hover:bg-[#2A2E39] text-[#94A3B8] hover:text-white"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {pendingSubs.length === 0 ? (
                  <div className="p-8 text-center bg-[#0B0E14] border border-[#2A2E39] rounded-xl text-xs text-[#64748B]">
                    No pending subscription payments right now. All requests approved!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingSubs.map((sub) => {
                      const p = sub.lastPaymentSubmission!;
                      return (
                        <div
                          key={sub.uid}
                          className="p-4 rounded-xl bg-[#0B0E14] border border-[#2A2E39] flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{sub.displayName}</span>
                              <span className="text-xs text-[#94A3B8] font-mono">({sub.email})</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#FF9100]/20 text-[#FF9100]">
                                {p.packageId}
                              </span>
                            </div>
                            <div className="text-xs text-[#94A3B8] flex items-center gap-3">
                              <span>
                                Amount:{' '}
                                <strong className="text-[#00E676] font-mono text-sm">
                                  ${p.amountPaid} USDT
                                </strong>
                              </span>
                              <span>
                                Binance TxID:{' '}
                                <strong className="font-mono text-white bg-[#1E222D] px-2 py-0.5 rounded">
                                  {p.binanceTxId}
                                </strong>
                              </span>
                              {p.promoCodeUsed && (
                                <span className="text-[#38BDF8]">
                                  Promo Code:{' '}
                                  <strong className="font-mono">{p.promoCodeUsed}</strong>
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#64748B]">
                              Submitted:{' '}
                              {new Date(p.submittedAt).toLocaleString()}
                            </div>
                          </div>

                          {/* Approval Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleGrantTrial(sub.uid)}
                              className="px-3 py-2 rounded-lg bg-[#1E222D] hover:bg-[#2A2E39] text-[11px] font-semibold text-[#94A3B8] hover:text-white"
                            >
                              +24h Trial
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectSub(sub.uid)}
                              className="px-3 py-2 rounded-lg bg-[#F23645]/20 hover:bg-[#F23645]/30 text-[#F23645] text-[11px] font-bold"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveSub(sub.uid)}
                              className="px-4 py-2 rounded-lg bg-[#00E676] hover:bg-[#00C853] text-black text-[11px] font-extrabold shadow-md flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve & Activate
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SMART FINANCE */}
            {activeTab === 'FINANCE' && (
              <div>
                <h4 className="text-sm font-bold text-white mb-4">Smart Financial Overview</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#2A2E39]">
                    <span className="text-[10px] text-[#94A3B8] block mb-1">Gross Revenue</span>
                    <span className="text-2xl font-black font-mono text-[#00E676]">
                      ${fin.totalGrossRevenue.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#64748B] block mt-1">Confirmed USDT Inflows</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#2A2E39]">
                    <span className="text-[10px] text-[#94A3B8] block mb-1">Active Subscribers</span>
                    <span className="text-2xl font-black font-mono text-white">
                      {fin.activeSubscribers}
                    </span>
                    <span className="text-[10px] text-[#64748B] block mt-1">Unlocked user terminals</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#2A2E39]">
                    <span className="text-[10px] text-[#94A3B8] block mb-1">Affiliate Commissions</span>
                    <span className="text-2xl font-black font-mono text-[#FF9100]">
                      ${fin.totalCommissionsEarned.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#64748B] block mt-1">Total Creator rewards</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#00E676]/40">
                    <span className="text-[10px] text-[#00E676] block mb-1 font-bold">Platform Net Profit</span>
                    <span className="text-2xl font-black font-mono text-white">
                      ${fin.netPlatformProfit.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#64748B] block mt-1">After affiliate payouts</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#2A2E39] text-xs space-y-2">
                  <div className="flex justify-between py-1 border-b border-[#1E222D]">
                    <span className="text-[#94A3B8]">Pending Submissions Inflow:</span>
                    <span className="font-mono text-[#38BDF8] font-bold">${fin.pendingRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#1E222D]">
                    <span className="text-[#94A3B8]">Pending Influencer Withdrawals:</span>
                    <span className="font-mono text-[#FF9100] font-bold">${fin.pendingWithdrawalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#94A3B8]">Paid Influencer Withdrawals:</span>
                    <span className="font-mono text-[#00E676] font-bold">${fin.paidWithdrawalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: INFLUENCER LIST */}
            {activeTab === 'INFLUENCERS' && (
              <div>
                <h4 className="text-sm font-bold text-white mb-3">
                  Registered Creators & Influencer Partners ({influencers.length})
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#2A2E39] text-[#64748B]">
                        <th className="pb-2">Name & Email</th>
                        <th className="pb-2">User ID / Pass</th>
                        <th className="pb-2">Coupon Code</th>
                        <th className="pb-2">Binance ID</th>
                        <th className="pb-2">Referrals</th>
                        <th className="pb-2">Total Earned</th>
                        <th className="pb-2">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E222D]">
                      {influencers.map((inf) => (
                        <tr key={inf.id} className="hover:bg-[#181C27]/50">
                          <td className="py-2.5">
                            <span className="font-bold text-white block">{inf.name}</span>
                            <span className="text-[#64748B] text-[10px]">{inf.email}</span>
                          </td>
                          <td className="py-2.5 font-mono">
                            <div className="text-white">{inf.userId}</div>
                            <div className="text-[#FF9100] text-[10px]">{inf.password}</div>
                          </td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded font-mono font-bold bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30">
                              {inf.couponCode}
                            </span>
                          </td>
                          <td className="py-2.5 font-mono text-white">
                            {inf.binanceId || <span className="text-[#64748B]">None</span>}
                          </td>
                          <td className="py-2.5 font-mono font-bold text-white">{inf.totalReferrals}</td>
                          <td className="py-2.5 font-mono text-[#00E676] font-bold">
                            ${inf.totalEarnings.toFixed(2)}
                          </td>
                          <td className="py-2.5 font-mono text-white font-bold">
                            ${inf.availableBalance.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: INFLUENCER WITHDRAWALS */}
            {activeTab === 'WITHDRAWALS' && (
              <div>
                <h4 className="text-sm font-bold text-white mb-3">
                  Influencer Withdrawal Requests ({withdrawals.length})
                </h4>

                {withdrawals.length === 0 ? (
                  <div className="p-8 text-center bg-[#0B0E14] border border-[#2A2E39] rounded-xl text-xs text-[#64748B]">
                    No withdrawal requests submitted yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {withdrawals.map((w) => (
                      <div
                        key={w.id}
                        className="p-4 rounded-xl bg-[#0B0E14] border border-[#2A2E39] flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{w.influencerName}</span>
                            <span className="text-sm font-mono font-bold text-[#00E676]">
                              ${w.amount.toFixed(2)} USDT
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                w.status === 'PAID'
                                  ? 'bg-[#00E676]/20 text-[#00E676]'
                                  : w.status === 'REJECTED'
                                  ? 'bg-[#F23645]/20 text-[#F23645]'
                                  : 'bg-[#FF9100]/20 text-[#FF9100]'
                              }`}
                            >
                              {w.status}
                            </span>
                          </div>
                          <div className="text-xs text-[#94A3B8] mt-1 font-mono">
                            Target Binance Pay ID: <strong className="text-white">{w.binanceId}</strong> •
                            Requested: {new Date(w.requestedAt).toLocaleString()}
                          </div>
                        </div>

                        {w.status === 'PENDING' && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRejectWithdrawal(w.id)}
                              className="px-3 py-1.5 rounded-lg bg-[#F23645]/20 text-[#F23645] hover:bg-[#F23645]/30 text-xs font-bold"
                            >
                              Reject & Refund
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveWithdrawal(w.id)}
                              className="px-4 py-1.5 rounded-lg bg-[#00E676] hover:bg-[#00C853] text-black text-xs font-extrabold shadow-md flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Mark Transferred (Paid)
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: DIRECT USER OVERRIDE */}
            {activeTab === 'MANUAL_GRANT' && (
              <div className="max-w-lg mx-auto py-4">
                <h4 className="text-sm font-bold text-white mb-2">Direct User Package Override</h4>
                <p className="text-xs text-[#94A3B8] mb-5">
                  Manually activate access for any user account or test account without payment.
                </p>

                <form onSubmit={handleManualGrantSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                      User UID or Email
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. demo_trader_01 or user's email"
                      value={manualUid}
                      onChange={(e) => setManualUid(e.target.value)}
                      className="w-full bg-[#0B0E14] border border-[#2A2E39] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2962FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                      Duration to Grant
                    </label>
                    <select
                      value={manualDays}
                      onChange={(e) => setManualDays(Number(e.target.value))}
                      className="w-full bg-[#0B0E14] border border-[#2A2E39] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2962FF]"
                    >
                      <option value={1}>1 Day (24 Hours Test)</option>
                      <option value={30}>30 Days (1 Month Pro)</option>
                      <option value={180}>180 Days (6 Months Pro)</option>
                      <option value={365}>365 Days (1 Year Elite)</option>
                      <option value={3650}>Lifetime (10 Years)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#2962FF] hover:bg-[#1E53E5] text-xs font-bold text-white shadow-md cursor-pointer"
                  >
                    Apply Manual Subscription Access
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
