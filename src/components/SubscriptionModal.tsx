import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Tag,
  ShieldCheck,
  CreditCard,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  SUBSCRIPTION_PACKAGES,
  BINANCE_PAYMENT_CONFIG,
  subscriptionService,
  UserSubscriptionRecord,
} from '../services/subscriptionService';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSubscription: UserSubscriptionRecord | null;
  userEmail: string;
  userUid: string;
  onPaymentSubmitted?: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  userSubscription,
  userUid,
  onPaymentSubmitted,
}) => {
  const [selectedPkgId, setSelectedPkgId] = useState<'MONTH_1' | 'MONTH_6' | 'MONTH_12'>('MONTH_6');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [binanceTxInput, setBinanceTxInput] = useState('');
  const [copiedBinanceId, setCopiedBinanceId] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPkg = SUBSCRIPTION_PACKAGES[selectedPkgId];
  const regularPrice = currentPkg.regularPrice;
  const finalPrice = appliedPromo ? Math.max(1, regularPrice - currentPkg.discountWithPromo) : regularPrice;

  const handleApplyPromo = () => {
    if (!promoCodeInput.trim()) return;
    const res = subscriptionService.validatePromoCode(promoCodeInput);
    if (res.valid && res.code) {
      setAppliedPromo(res.code);
      setPromoDiscount(currentPkg.discountWithPromo);
      setPromoMessage(`✓ Promo code ${res.code} applied! Saved $${currentPkg.discountWithPromo} off`);
    } else {
      setAppliedPromo(null);
      setPromoDiscount(0);
      setPromoMessage('✗ Invalid promo code. Check with your influencer or creator.');
    }
  };

  const handleCopyBinanceId = () => {
    navigator.clipboard.writeText(BINANCE_PAYMENT_CONFIG.payId);
    setCopiedBinanceId(true);
    setTimeout(() => setCopiedBinanceId(false), 2500);
  };

  const handleSubmitPayment = () => {
    if (!binanceTxInput.trim()) {
      setSubmitError('Please enter your Binance Transaction ID / TxHash or Order Number.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const res = subscriptionService.submitPayment(
      userUid,
      selectedPkgId,
      binanceTxInput,
      appliedPromo || undefined
    );

    setIsSubmitting(false);

    if (res.success) {
      setSubmitSuccess(res.message);
      if (onPaymentSubmitted) onPaymentSubmitted();
    } else {
      setSubmitError(res.message);
    }
  };

  const isPendingApproval = userSubscription?.status === 'PENDING_APPROVAL';
  const isActiveSubscribed = userSubscription?.status === 'ACTIVE_SUBSCRIBED';

  // Calculate remaining free trial hours/mins
  const now = Date.now();
  const trialRemainingMs = Math.max(0, (userSubscription?.freeTrialExpiresAt || 0) - now);
  const trialHours = Math.floor(trialRemainingMs / (1000 * 60 * 60));
  const trialMins = Math.floor((trialRemainingMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#131722] border border-[#2A2E39] rounded-2xl shadow-2xl p-6 sm:p-8 text-[#D1D4DC]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#94A3B8] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2962FF] to-[#00E676] flex items-center justify-center text-white font-extrabold shadow-lg shadow-[#2962FF]/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              TradePilot Pro Subscription
            </h2>
            <p className="text-xs text-[#94A3B8]">
              Unrestricted 90-Day Backtest History, Sub-Second Live Feed & AI SMC Markings
            </p>
          </div>
        </div>

        {/* 24-Hour Free Trial Status Banner */}
        {userSubscription?.status === 'TRIAL_ACTIVE' && (
          <div className="my-4 p-3.5 rounded-xl bg-[#00E676]/10 border border-[#00E676]/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#00E676] font-semibold">
              <Clock className="w-4 h-4 animate-spin-slow" />
              <span>24-Hour Free Trial Active</span>
            </div>
            <div className="font-mono text-white bg-[#00E676]/20 px-2.5 py-1 rounded-md font-bold">
              {trialHours}h {trialMins}m remaining
            </div>
          </div>
        )}

        {/* Pending Approval Notice */}
        {isPendingApproval && (
          <div className="my-4 p-4 rounded-xl bg-[#FFB300]/10 border border-[#FFB300]/40 text-xs">
            <div className="flex items-center gap-2 text-[#FFB300] font-bold mb-1">
              <Clock className="w-4 h-4" />
              <span>Payment Verification Pending Admin Approval</span>
            </div>
            <p className="text-[#94A3B8]">
              Your Binance transaction{' '}
              <span className="font-mono text-white">
                ({userSubscription?.lastPaymentSubmission?.binanceTxId})
              </span>{' '}
              has been submitted. Admin verifies and unlocks your account shortly.
            </p>
          </div>
        )}

        {/* Active Subscription Banner */}
        {isActiveSubscribed && (
          <div className="my-4 p-4 rounded-xl bg-[#00E676]/10 border border-[#00E676]/40 text-xs">
            <div className="flex items-center gap-2 text-[#00E676] font-bold mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Pro Subscription Active</span>
            </div>
            <p className="text-[#94A3B8]">
              Active Package:{' '}
              <strong className="text-white">
                {userSubscription?.activePackageId
                  ? SUBSCRIPTION_PACKAGES[userSubscription.activePackageId]?.name
                  : 'Pro Pass'}
              </strong>{' '}
              • Expires:{' '}
              {userSubscription?.subscriptionExpiresAt
                ? new Date(userSubscription.subscriptionExpiresAt).toLocaleDateString()
                : 'Active'}
            </p>
          </div>
        )}

        {/* Package Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
          {(Object.keys(SUBSCRIPTION_PACKAGES) as Array<'MONTH_1' | 'MONTH_6' | 'MONTH_12'>).map((pkgKey) => {
            const pkg = SUBSCRIPTION_PACKAGES[pkgKey];
            const isSelected = selectedPkgId === pkgKey;
            const hasPromo = Boolean(appliedPromo);
            const discounted = hasPromo ? Math.max(1, pkg.regularPrice - pkg.discountWithPromo) : pkg.regularPrice;

            return (
              <div
                key={pkgKey}
                onClick={() => setSelectedPkgId(pkgKey)}
                className={`relative p-4 rounded-xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#1E233A] border-[#2962FF] ring-2 ring-[#2962FF]/40 shadow-lg'
                    : 'bg-[#181C27] border-[#2A2E39] hover:border-[#3E4556]'
                }`}
              >
                {pkgKey === 'MONTH_6' && (
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FF9100] text-black shadow-md">
                    POPULAR
                  </span>
                )}
                <div className="text-xs font-semibold text-[#94A3B8] mb-1">{pkg.name}</div>
                <div className="flex items-baseline gap-1.5 my-2">
                  <span className="text-2xl font-black text-white font-mono">${discounted}</span>
                  {hasPromo && (
                    <span className="text-xs text-[#94A3B8] line-through font-mono">
                      ${pkg.regularPrice}
                    </span>
                  )}
                  <span className="text-[11px] text-[#64748B]">/ {pkg.durationDays}d</span>
                </div>
                <div className="text-[11px] text-[#94A3B8] leading-tight">{pkg.tagline}</div>
              </div>
            );
          })}
        </div>

        {/* Promo Code Input */}
        <div className="p-3.5 rounded-xl bg-[#181C27] border border-[#2A2E39] mb-6">
          <label className="text-xs font-semibold text-[#94A3B8] flex items-center gap-1.5 mb-2">
            <Tag className="w-3.5 h-3.5 text-[#00E676]" />
            <span>Have an Influencer Promo Code?</span>
            <span className="text-[10px] text-[#64748B]">(Save $1 to $8 instantly)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. JAHID10, ALPHA5"
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
              className="flex-1 bg-[#131722] border border-[#2A2E39] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-[#64748B] focus:outline-none focus:border-[#2962FF]"
            />
            <button
              type="button"
              onClick={handleApplyPromo}
              className="px-4 py-2 rounded-lg bg-[#2962FF] hover:bg-[#1E53E5] text-xs font-semibold text-white transition-colors"
            >
              Apply Code
            </button>
          </div>
          {promoMessage && (
            <p
              className={`text-xs mt-2 font-medium ${
                appliedPromo ? 'text-[#00E676]' : 'text-[#F23645]'
              }`}
            >
              {promoMessage}
            </p>
          )}
        </div>

        {/* Binance Payment Instruction Box */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#1E222D] to-[#141822] border border-[#F0B90B]/30 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F0B90B] animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#F0B90B]">
                Binance Pay / USDT Payment
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-white">
              Amount to Pay:{' '}
              <span className="text-[#00E676] text-sm">${finalPrice} USDT</span>
            </span>
          </div>

          <p className="text-xs text-[#94A3B8] mb-3 leading-relaxed">
            Send exactly <strong className="text-white">${finalPrice} USDT</strong> to the Binance Pay ID
            below via Binance App or Binance Pay:
          </p>

          <div className="flex items-center justify-between p-3 rounded-lg bg-[#0B0E14] border border-[#2A2E39] mb-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#64748B] block">
                Official Binance Pay ID
              </span>
              <span className="text-base font-extrabold font-mono text-white">
                {BINANCE_PAYMENT_CONFIG.payId}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyBinanceId}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1E222D] hover:bg-[#2A2E39] border border-[#3E4556] text-xs font-mono text-white transition-colors"
            >
              {copiedBinanceId ? <Check className="w-3.5 h-3.5 text-[#00E676]" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedBinanceId ? 'Copied!' : 'Copy Pay ID'}
            </button>
          </div>

          {/* Transaction ID input */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
              Enter your Binance Transaction ID / TxHash or Pay Order ID:
            </label>
            <input
              type="text"
              placeholder="e.g. 24891083921 or 0x7a8b... (from your Binance transfer history)"
              value={binanceTxInput}
              onChange={(e) => setBinanceTxInput(e.target.value)}
              className="w-full bg-[#0B0E14] border border-[#2A2E39] rounded-lg px-3 py-2.5 text-xs font-mono text-white placeholder-[#64748B] focus:outline-none focus:border-[#00E676]"
            />
          </div>

          {submitError && (
            <p className="text-xs text-[#F23645] mt-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {submitError}
            </p>
          )}

          {submitSuccess && (
            <p className="text-xs text-[#00E676] mt-2 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {submitSuccess}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#2A2E39]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmitPayment}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2962FF] to-[#00E676] hover:from-[#1E53E5] hover:to-[#00C853] text-xs font-bold text-white shadow-lg shadow-[#2962FF]/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            {isSubmitting ? 'Submitting...' : `Submit Payment ($${finalPrice}) for Approval`}
          </button>
        </div>
      </div>
    </div>
  );
};
