// Subscription, Influencer, and Admin Management Service
// Supports 24-hour Free Backtest Trial, Binance Payments (ID: 794380283),
// Influencer Affiliate Program with commissions and JPG export, and Smart Admin controls.

export interface SubscriptionPackage {
  id: 'MONTH_1' | 'MONTH_6' | 'MONTH_12';
  name: string;
  durationDays: number;
  regularPrice: number;
  discountWithPromo: number;
  influencerCommission: number;
  tagline: string;
}

export const SUBSCRIPTION_PACKAGES: Record<string, SubscriptionPackage> = {
  MONTH_1: {
    id: 'MONTH_1',
    name: '1 Month Pro Pass',
    durationDays: 30,
    regularPrice: 8,
    discountWithPromo: 1, // Customer pays $7
    influencerCommission: 1, // Influencer earns $1
    tagline: 'Ideal for rapid testing & strategy verification',
  },
  MONTH_6: {
    id: 'MONTH_6',
    name: '6 Months Pro Mastery',
    durationDays: 180,
    regularPrice: 40,
    discountWithPromo: 5, // Customer pays $35
    influencerCommission: 5, // Influencer earns $5
    tagline: 'Most Popular: Master 180 days of price action',
  },
  MONTH_12: {
    id: 'MONTH_12',
    name: '12 Months Elite Trader',
    durationDays: 365,
    regularPrice: 70,
    discountWithPromo: 8, // Customer pays $62
    influencerCommission: 10, // Influencer earns $10
    tagline: 'Full Year Unrestricted Terminal & AI Setup Access',
  },
};

export const BINANCE_PAYMENT_CONFIG = {
  payId: '794380283',
  recipientName: 'Tradingguider Pro',
  acceptedCurrencies: 'USDT (TRC20 / BEP20) or Binance Pay ID',
  adminPasscode: 'Jahid5359',
  minWithdrawal: 20, // USD
};

export interface UserSubscriptionRecord {
  uid: string;
  email: string;
  displayName: string;
  firstLoginAt: number;
  freeTrialExpiresAt: number; // firstLoginAt + 24 * 3600 * 1000
  status: 'TRIAL_ACTIVE' | 'TRIAL_EXPIRED' | 'PENDING_APPROVAL' | 'ACTIVE_SUBSCRIBED';
  activePackageId?: 'MONTH_1' | 'MONTH_6' | 'MONTH_12';
  subscriptionExpiresAt?: number;
  lastPaymentSubmission?: {
    packageId: 'MONTH_1' | 'MONTH_6' | 'MONTH_12';
    amountPaid: number;
    binanceTxId: string;
    promoCodeUsed?: string;
    submittedAt: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
  };
}

export interface InfluencerRecord {
  id: string; // e.g. INF-10293
  userId: string;
  password: string; // auto-generated
  name: string;
  email: string;
  binanceId: string; // can be updated
  couponCode: string; // uppercase unique code
  createdAt: number;
  totalReferrals: number;
  totalEarnings: number;
  availableBalance: number;
}

export interface InfluencerWithdrawalRequest {
  id: string;
  influencerId: string;
  influencerName: string;
  binanceId: string;
  amount: number;
  requestedAt: number;
  status: 'PENDING' | 'PAID' | 'REJECTED';
  adminNotes?: string;
}

export interface CountdownDetails {
  totalSeconds: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formattedString: string;
  shortString: string;
  compactClock: string;
  progressPercent: number;
}

export function calculateRemainingCountdown(
  expiresAt: number | undefined,
  startedAt: number | undefined,
  now: number = Date.now()
): CountdownDetails {
  if (!expiresAt) {
    return {
      totalSeconds: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      formattedString: 'Expired (0d 0h left)',
      shortString: 'Expired',
      compactClock: '00m : 00d : 00h : 00m : 00s',
      progressPercent: 0,
    };
  }

  const diffMs = expiresAt - now;
  if (diffMs <= 0) {
    return {
      totalSeconds: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      formattedString: 'Expired (0d 0h left)',
      shortString: 'Expired',
      compactClock: '00m : 00d : 00h : 00m : 00s',
      progressPercent: 0,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const totalDays = Math.floor(totalSeconds / 86400);

  const months = Math.floor(totalDays / 30);
  const days = totalDays % 30;
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let formattedString = '';
  if (months > 0) {
    formattedString = `${months} Month${months > 1 ? 's' : ''}, ${days} Day${days > 1 ? 's' : ''}, ${hours}h ${minutes}m ${seconds}s`;
  } else if (days > 0) {
    formattedString = `${days} Day${days > 1 ? 's' : ''}, ${hours}h ${minutes}m ${seconds}s`;
  } else {
    formattedString = `${hours}h ${minutes}m ${seconds}s`;
  }

  const shortString =
    months > 0
      ? `${months}mo ${days}d`
      : days > 0
      ? `${days}d ${hours}h`
      : `${hours}h ${minutes}m`;

  const pad = (n: number) => String(n).padStart(2, '0');
  const compactClock = `${pad(months)}m : ${pad(days)}d : ${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;

  let progressPercent = 100;
  if (startedAt && startedAt < expiresAt) {
    const totalDuration = expiresAt - startedAt;
    progressPercent = Math.max(0, Math.min(100, Math.round((diffMs / totalDuration) * 100)));
  }

  return {
    totalSeconds,
    months,
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    formattedString,
    shortString,
    compactClock,
    progressPercent,
  };
}

const STORAGE_KEYS = {
  SUBSCRIPTIONS: 'tp_subscriptions_v1',
  INFLUENCERS: 'tp_influencers_v1',
  WITHDRAWALS: 'tp_influencer_withdrawals_v1',
  CURRENT_INFLUENCER: 'tp_current_influencer_session',
};

// Seed default users for instant admin visibility with real countdowns
const INITIAL_DEMO_USERS: Record<string, UserSubscriptionRecord> = {
  usr_tareq_trial: {
    uid: 'usr_tareq_trial',
    email: 'tareq.fx@gmail.com',
    displayName: 'Tareq Rahman',
    firstLoginAt: Date.now() - 4 * 3600 * 1000 - 18 * 60 * 1000,
    freeTrialExpiresAt: Date.now() + 19 * 3600 * 1000 + 42 * 60 * 1000,
    status: 'TRIAL_ACTIVE',
  },
  usr_farhan_1mo: {
    uid: 'usr_farhan_1mo',
    email: 'farhan.trader@yahoo.com',
    displayName: 'Farhan Hossain',
    firstLoginAt: Date.now() - 7 * 86400 * 1000,
    freeTrialExpiresAt: Date.now() - 6 * 86400 * 1000,
    status: 'ACTIVE_SUBSCRIBED',
    activePackageId: 'MONTH_1',
    subscriptionExpiresAt: Date.now() + 23 * 86400 * 1000 + 8 * 3600 * 1000 + 35 * 60 * 1000,
    lastPaymentSubmission: {
      packageId: 'MONTH_1',
      amountPaid: 7,
      binanceTxId: 'BNB748910284',
      promoCodeUsed: 'JAHID10',
      submittedAt: Date.now() - 7 * 86400 * 1000,
      status: 'APPROVED',
    },
  },
  usr_nazmul_6mo: {
    uid: 'usr_nazmul_6mo',
    email: 'nazmul.smc@gmail.com',
    displayName: 'Nazmul Islam',
    firstLoginAt: Date.now() - 38 * 86400 * 1000,
    freeTrialExpiresAt: Date.now() - 37 * 86400 * 1000,
    status: 'ACTIVE_SUBSCRIBED',
    activePackageId: 'MONTH_6',
    subscriptionExpiresAt: Date.now() + 142 * 86400 * 1000 + 14 * 3600 * 1000,
    lastPaymentSubmission: {
      packageId: 'MONTH_6',
      amountPaid: 35,
      binanceTxId: 'BNB882019482',
      promoCodeUsed: 'ALPHA5',
      submittedAt: Date.now() - 38 * 86400 * 1000,
      status: 'APPROVED',
    },
  },
  usr_shakil_pending: {
    uid: 'usr_shakil_pending',
    email: 'shakil.crypto@outlook.com',
    displayName: 'Shakil Ahmed',
    firstLoginAt: Date.now() - 26 * 3600 * 1000,
    freeTrialExpiresAt: Date.now() - 2 * 3600 * 1000,
    status: 'PENDING_APPROVAL',
    lastPaymentSubmission: {
      packageId: 'MONTH_1',
      amountPaid: 7,
      binanceTxId: 'BNB992817461',
      promoCodeUsed: 'JAHID10',
      submittedAt: Date.now() - 15 * 60 * 1000,
      status: 'PENDING',
    },
  },
  usr_tanvir_expired: {
    uid: 'usr_tanvir_expired',
    email: 'tanvir.invest@gmail.com',
    displayName: 'Tanvir Hasan',
    firstLoginAt: Date.now() - 48 * 3600 * 1000,
    freeTrialExpiresAt: Date.now() - 24 * 3600 * 1000,
    status: 'TRIAL_EXPIRED',
  },
};

// Seed default influencers for testing/immediate use
const INITIAL_INFLUENCERS: InfluencerRecord[] = [
  {
    id: 'INF-78401',
    userId: 'partner_jahid',
    password: 'Pass9482@',
    name: 'Jahid Official',
    email: 'jahid.partner@tradepilot.ai',
    binanceId: '794380283',
    couponCode: 'JAHID10',
    createdAt: Date.now() - 86400000 * 5,
    totalReferrals: 14,
    totalEarnings: 85,
    availableBalance: 45,
  },
  {
    id: 'INF-55192',
    userId: 'trader_pro',
    password: 'Alpha2026#',
    name: 'Crypto & Gold Alpha',
    email: 'alpha@trades.io',
    binanceId: '684910284',
    couponCode: 'ALPHA5',
    createdAt: Date.now() - 86400000 * 12,
    totalReferrals: 8,
    totalEarnings: 40,
    availableBalance: 25,
  },
];

class SubscriptionService {
  private subscriptions: Record<string, UserSubscriptionRecord> = {};
  private influencers: InfluencerRecord[] = [];
  private withdrawals: InfluencerWithdrawalRequest[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const subsRaw = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
      if (subsRaw) {
        this.subscriptions = JSON.parse(subsRaw);
        // Ensure initial demo users exist so admin table is always populated
        Object.keys(INITIAL_DEMO_USERS).forEach((uid) => {
          if (!this.subscriptions[uid]) {
            this.subscriptions[uid] = INITIAL_DEMO_USERS[uid];
          }
        });
      } else {
        this.subscriptions = { ...INITIAL_DEMO_USERS };
        this.saveSubscriptions();
      }

      const infsRaw = localStorage.getItem(STORAGE_KEYS.INFLUENCERS);
      if (infsRaw) {
        this.influencers = JSON.parse(infsRaw);
      } else {
        this.influencers = INITIAL_INFLUENCERS;
        this.saveInfluencers();
      }

      const withRaw = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
      if (withRaw) {
        this.withdrawals = JSON.parse(withRaw);
      }
    } catch (e) {
      console.error('Failed to load subscription store from localStorage', e);
    }
  }

  private saveSubscriptions() {
    try {
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(this.subscriptions));
      this.notify();
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }

  private saveInfluencers() {
    try {
      localStorage.setItem(STORAGE_KEYS.INFLUENCERS, JSON.stringify(this.influencers));
      this.notify();
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }

  private saveWithdrawals() {
    try {
      localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(this.withdrawals));
      this.notify();
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }

  public subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error(err);
      }
    });
  }

  // --- USER SUBSCRIPTION & 24H TRIAL LOGIC ---

  public getOrCreateUserSubscription(uid: string, email: string, displayName: string): UserSubscriptionRecord {
    const existing = this.subscriptions[uid];
    const now = Date.now();

    if (existing) {
      // Check if active subscription expired
      if (existing.status === 'ACTIVE_SUBSCRIBED' && existing.subscriptionExpiresAt && existing.subscriptionExpiresAt < now) {
        existing.status = 'TRIAL_EXPIRED';
        this.saveSubscriptions();
      } else if (existing.status === 'TRIAL_ACTIVE' && existing.freeTrialExpiresAt < now) {
        existing.status = 'TRIAL_EXPIRED';
        this.saveSubscriptions();
      }
      return existing;
    }

    // New user: grant 24 hours free backtest access
    const trialStartedAt = now;
    const freeTrialExpiresAt = trialStartedAt + 24 * 60 * 60 * 1000;

    const newSub: UserSubscriptionRecord = {
      uid,
      email: email || 'trader@tradepilot.ai',
      displayName: displayName || 'Trader',
      firstLoginAt: trialStartedAt,
      freeTrialExpiresAt,
      status: 'TRIAL_ACTIVE',
    };

    this.subscriptions[uid] = newSub;
    this.saveSubscriptions();
    return newSub;
  }

  public getUserSubscription(uid: string): UserSubscriptionRecord | null {
    const sub = this.subscriptions[uid];
    if (!sub) return null;
    const now = Date.now();
    if (sub.status === 'ACTIVE_SUBSCRIBED' && sub.subscriptionExpiresAt && sub.subscriptionExpiresAt < now) {
      sub.status = 'TRIAL_EXPIRED';
      this.saveSubscriptions();
    } else if (sub.status === 'TRIAL_ACTIVE' && sub.freeTrialExpiresAt < now) {
      sub.status = 'TRIAL_EXPIRED';
      this.saveSubscriptions();
    }
    return sub;
  }

  // Submit payment for Admin Approval
  public submitPayment(
    uid: string,
    packageId: 'MONTH_1' | 'MONTH_6' | 'MONTH_12',
    binanceTxId: string,
    promoCode?: string
  ): { success: boolean; message: string; record?: UserSubscriptionRecord } {
    const user = this.subscriptions[uid];
    if (!user) {
      return { success: false, message: 'User record not found.' };
    }

    const pkg = SUBSCRIPTION_PACKAGES[packageId];
    if (!pkg) {
      return { success: false, message: 'Invalid package selected.' };
    }

    let finalPrice = pkg.regularPrice;
    let validPromo: string | undefined = undefined;

    if (promoCode) {
      const cleanCode = promoCode.trim().toUpperCase();
      const inf = this.influencers.find((i) => i.couponCode.toUpperCase() === cleanCode);
      if (inf) {
        finalPrice = Math.max(1, pkg.regularPrice - pkg.discountWithPromo);
        validPromo = cleanCode;
      }
    }

    user.status = 'PENDING_APPROVAL';
    user.lastPaymentSubmission = {
      packageId,
      amountPaid: finalPrice,
      binanceTxId: binanceTxId.trim(),
      promoCodeUsed: validPromo,
      submittedAt: Date.now(),
      status: 'PENDING',
    };

    this.saveSubscriptions();
    return {
      success: true,
      message: 'Payment submitted successfully! Waiting for Admin verification.',
      record: user,
    };
  }

  // Admin approves payment and grants subscription
  public approvePayment(uid: string): boolean {
    const user = this.subscriptions[uid];
    if (!user || !user.lastPaymentSubmission || user.lastPaymentSubmission.status !== 'PENDING') {
      return false;
    }

    const submission = user.lastPaymentSubmission;
    submission.status = 'APPROVED';

    const pkg = SUBSCRIPTION_PACKAGES[submission.packageId];
    const durationDays = pkg ? pkg.durationDays : 30;
    const now = Date.now();

    user.status = 'ACTIVE_SUBSCRIBED';
    user.activePackageId = submission.packageId;
    user.subscriptionExpiresAt = now + durationDays * 24 * 60 * 60 * 1000;

    // Credit Influencer commission if promo code was used
    if (submission.promoCodeUsed) {
      const inf = this.influencers.find(
        (i) => i.couponCode.toUpperCase() === submission.promoCodeUsed?.toUpperCase()
      );
      if (inf && pkg) {
        inf.totalReferrals += 1;
        inf.totalEarnings += pkg.influencerCommission;
        inf.availableBalance += pkg.influencerCommission;
        this.saveInfluencers();
      }
    }

    this.saveSubscriptions();
    return true;
  }

  // Admin rejects payment
  public rejectPayment(uid: string, reason: string): boolean {
    const user = this.subscriptions[uid];
    if (!user || !user.lastPaymentSubmission) return false;

    user.lastPaymentSubmission.status = 'REJECTED';
    user.lastPaymentSubmission.rejectionReason = reason || 'Transaction could not be verified on Binance.';
    user.status = 'TRIAL_EXPIRED';
    this.saveSubscriptions();
    return true;
  }

  // Admin grants extension or manual subscription
  public grantManualAccess(uid: string, days: number, packageId: 'MONTH_1' | 'MONTH_6' | 'MONTH_12' = 'MONTH_1') {
    const user = this.subscriptions[uid];
    if (!user) return false;

    const now = Date.now();
    user.status = 'ACTIVE_SUBSCRIBED';
    user.activePackageId = packageId;
    user.subscriptionExpiresAt = now + days * 24 * 60 * 60 * 1000;
    this.saveSubscriptions();
    return true;
  }

  public grantExtraTrialHours(uid: string, hours: number = 24) {
    const user = this.subscriptions[uid];
    if (!user) return false;

    user.status = 'TRIAL_ACTIVE';
    user.freeTrialExpiresAt = Math.max(Date.now(), user.freeTrialExpiresAt) + hours * 60 * 60 * 1000;
    this.saveSubscriptions();
    return true;
  }

  // Admin grants specific package duration (1 Month, 6 Months, or 12 Months)
  public grantPackage(uid: string, packageId: 'MONTH_1' | 'MONTH_6' | 'MONTH_12') {
    const user = this.subscriptions[uid];
    if (!user) return false;

    const pkg = SUBSCRIPTION_PACKAGES[packageId];
    const durationDays = pkg ? pkg.durationDays : 30;
    const now = Date.now();

    user.status = 'ACTIVE_SUBSCRIBED';
    user.activePackageId = packageId;
    user.subscriptionExpiresAt = now + durationDays * 24 * 60 * 60 * 1000;
    this.saveSubscriptions();
    return true;
  }

  // Admin immediately expires/locks a user
  public expireUserNow(uid: string) {
    const user = this.subscriptions[uid];
    if (!user) return false;

    user.status = 'TRIAL_EXPIRED';
    user.subscriptionExpiresAt = Date.now() - 1000;
    user.freeTrialExpiresAt = Date.now() - 1000;
    this.saveSubscriptions();
    return true;
  }

  // --- INFLUENCER PROGRAM LOGIC ---

  public registerInfluencer(params: {
    name: string;
    email: string;
    binanceId?: string;
  }): {
    success: boolean;
    influencer?: InfluencerRecord;
    message: string;
  } {
    const cleanEmail = params.email.trim().toLowerCase();
    const existing = this.influencers.find((i) => i.email.toLowerCase() === cleanEmail);
    if (existing) {
      return {
        success: false,
        message: 'An influencer account with this email already exists. Please log in to your portal.',
      };
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const id = `INF-${randomSuffix}`;
    const cleanName = params.name.trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'PRO';
    const couponCode = `${cleanName}${randomSuffix % 100}`;
    const autoPass = `TP${randomSuffix}!${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newInfluencer: InfluencerRecord = {
      id,
      userId: `inf_${cleanName.toLowerCase()}_${randomSuffix}`,
      password: autoPass,
      name: params.name.trim(),
      email: cleanEmail,
      binanceId: (params.binanceId || '').trim(),
      couponCode,
      createdAt: Date.now(),
      totalReferrals: 0,
      totalEarnings: 0,
      availableBalance: 0,
    };

    this.influencers.push(newInfluencer);
    this.saveInfluencers();

    return {
      success: true,
      influencer: newInfluencer,
      message: 'Influencer registered successfully!',
    };
  }

  public influencerLogin(userIdOrEmail: string, pass: string): InfluencerRecord | null {
    const target = userIdOrEmail.trim().toLowerCase();
    const cleanPass = pass.trim();

    const inf = this.influencers.find(
      (i) =>
        (i.userId.toLowerCase() === target || i.email.toLowerCase() === target || i.couponCode.toLowerCase() === target) &&
        i.password === cleanPass
    );

    return inf || null;
  }

  public updateInfluencerBinanceId(influencerId: string, binanceId: string): boolean {
    const inf = this.influencers.find((i) => i.id === influencerId);
    if (!inf) return false;
    inf.binanceId = binanceId.trim();
    this.saveInfluencers();
    return true;
  }

  public requestInfluencerWithdrawal(influencerId: string, amount: number): { success: boolean; message: string } {
    const inf = this.influencers.find((i) => i.id === influencerId);
    if (!inf) return { success: false, message: 'Influencer not found' };

    if (!inf.binanceId) {
      return { success: false, message: 'Please add your Binance ID before requesting withdrawal.' };
    }

    if (amount < BINANCE_PAYMENT_CONFIG.minWithdrawal) {
      return {
        success: false,
        message: `Minimum withdrawal amount is $${BINANCE_PAYMENT_CONFIG.minWithdrawal}.`,
      };
    }

    if (inf.availableBalance < amount) {
      return {
        success: false,
        message: `Insufficient available balance ($${inf.availableBalance.toFixed(2)}).`,
      };
    }

    // Deduct available balance
    inf.availableBalance -= amount;
    this.saveInfluencers();

    const req: InfluencerWithdrawalRequest = {
      id: `wth_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      influencerId: inf.id,
      influencerName: inf.name,
      binanceId: inf.binanceId,
      amount,
      requestedAt: Date.now(),
      status: 'PENDING',
    };

    this.withdrawals.unshift(req);
    this.saveWithdrawals();

    return {
      success: true,
      message: `Withdrawal request for $${amount} submitted! Admin will transfer to Binance ID ${inf.binanceId}.`,
    };
  }

  // Admin approves/marks withdrawal paid
  public approveWithdrawal(withdrawalId: string): boolean {
    const req = this.withdrawals.find((w) => w.id === withdrawalId);
    if (!req || req.status !== 'PENDING') return false;

    req.status = 'PAID';
    this.saveWithdrawals();
    return true;
  }

  public rejectWithdrawal(withdrawalId: string, reason: string): boolean {
    const req = this.withdrawals.find((w) => w.id === withdrawalId);
    if (!req || req.status !== 'PENDING') return false;

    req.status = 'REJECTED';
    req.adminNotes = reason;

    // Refund influencer balance
    const inf = this.influencers.find((i) => i.id === req.influencerId);
    if (inf) {
      inf.availableBalance += req.amount;
      this.saveInfluencers();
    }

    this.saveWithdrawals();
    return true;
  }

  // --- QUERY & STATS HELPERS ---

  public validatePromoCode(code: string): {
    valid: boolean;
    influencerName?: string;
    code?: string;
  } {
    const clean = code.trim().toUpperCase();
    const inf = this.influencers.find((i) => i.couponCode.toUpperCase() === clean);
    if (inf) {
      return { valid: true, influencerName: inf.name, code: inf.couponCode };
    }
    return { valid: false };
  }

  public getAllSubscriptions(): UserSubscriptionRecord[] {
    return Object.values(this.subscriptions);
  }

  public getPendingPayments(): UserSubscriptionRecord[] {
    return Object.values(this.subscriptions).filter(
      (u) => u.lastPaymentSubmission && u.lastPaymentSubmission.status === 'PENDING'
    );
  }

  public getAllInfluencers(): InfluencerRecord[] {
    return [...this.influencers];
  }

  public getAllWithdrawals(): InfluencerWithdrawalRequest[] {
    return [...this.withdrawals];
  }

  public getFinancialSummary() {
    const subs = Object.values(this.subscriptions);
    let totalGrossRevenue = 0;
    let pendingRevenue = 0;
    let activeSubscribers = 0;

    subs.forEach((s) => {
      if (s.status === 'ACTIVE_SUBSCRIBED' && s.lastPaymentSubmission?.status === 'APPROVED') {
        totalGrossRevenue += s.lastPaymentSubmission.amountPaid;
        activeSubscribers += 1;
      } else if (s.status === 'ACTIVE_SUBSCRIBED') {
        activeSubscribers += 1;
      }

      if (s.lastPaymentSubmission?.status === 'PENDING') {
        pendingRevenue += s.lastPaymentSubmission.amountPaid;
      }
    });

    const totalCommissionsEarned = this.influencers.reduce((acc, inf) => acc + inf.totalEarnings, 0);
    const pendingWithdrawalAmount = this.withdrawals
      .filter((w) => w.status === 'PENDING')
      .reduce((acc, w) => acc + w.amount, 0);
    const paidWithdrawalAmount = this.withdrawals
      .filter((w) => w.status === 'PAID')
      .reduce((acc, w) => acc + w.amount, 0);

    return {
      totalGrossRevenue,
      pendingRevenue,
      activeSubscribers,
      totalCommissionsEarned,
      pendingWithdrawalAmount,
      paidWithdrawalAmount,
      netPlatformProfit: Math.max(0, totalGrossRevenue - totalCommissionsEarned),
    };
  }
}

export const subscriptionService = new SubscriptionService();
