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
} from 'lucide-react';
import {
  subscriptionService,
  BINANCE_PAYMENT_CONFIG,
  UserSubscriptionRecord,
  InfluencerRecord,
  InfluencerWithdrawalRequest,
  SUBSCRIPTION_PACKAGES,
} from '../services/subscriptionService';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  // Tabs: 'REQUESTS' | 'FINANCE' | 'INFLUENCERS' | 'WITHDRAWALS' | 'MANUAL_GRANT'
  const [activeTab, setActiveTab] = useState<
    'REQUESTS' | 'FINANCE' | 'INFLUENCERS' | 'WITHDRAWALS' | 'MANUAL_GRANT'
  >('REQUESTS');

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
            <h3 className="text-xl font-bold text-white mb-2">TradePilot Smart Admin Console</h3>
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
                  onClick={() => setActiveTab('REQUESTS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'FINANCE'
                      ? 'bg-[#2962FF] text-white'
                      : 'bg-[#181C27] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  Smart Finance
                </button>

                <button
                  onClick={() => setActiveTab('INFLUENCERS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'INFLUENCERS'
                      ? 'bg-[#2962FF] text-white'
                      : 'bg-[#181C27] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  Influencer List ({influencers.length})
                </button>

                <button
                  onClick={() => setActiveTab('WITHDRAWALS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
