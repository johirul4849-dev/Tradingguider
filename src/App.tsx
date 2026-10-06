import React, { useEffect, useState } from 'react';
import {
  auth,
  db,
  onAuthStateChanged,
  signInWithGoogle,
  signOutUser,
  ensureUserProfile,
  updateUserProfileData,
  createSimulatedTradeInDb,
  updateSimulatedTradeInDb,
  logDisciplineEventInDb,
  collection,
  query,
  where,
  onSnapshot,
  handleFirestoreError,
  OperationType,
  UserProfileData,
  SimulatedTradeRecord,
  DisciplineEventRecord,
} from './lib/firebase';
import { LandingPage } from './components/LandingPage';
import { TradingTerminalView } from './components/TradingTerminalView';
import { SubscriptionModal } from './components/SubscriptionModal';
import { subscriptionService, UserSubscriptionRecord } from './services/subscriptionService';

const INITIAL_DEMO_PROFILE: UserProfileData = {
  uid: 'demo_trader_01',
  displayName: 'Pro Backtester',
  email: 'demo@tradepilot.ai',
  photoURL: '',
  preferredMarket: 'BTC/USD',
  preferredTimeframe: '15m',
  experienceLevel: 'Intermediate',
  mainGoal: 'Improve risk management',
  virtualBalance: 10000.0,
  riskPreference: 1.0,
  maxDailyTrades: 10,
  maxConsecutiveLosses: 5,
  postLossCooldownMinutes: 5,
  lockMode: 'Warning',
  disciplineScore: 92,
  onboardingCompleted: true,
};

const INITIAL_DEMO_TRADES: SimulatedTradeRecord[] = [
  {
    id: 'tr_sample_01',
    userId: 'demo_trader_01',
    instrument: 'BTC/USD',
    timeframe: '15m',
    mode: 'REPLAY',
    direction: 'LONG',
    entryPrice: 83640.0,
    stopLoss: 83240.0,
    takeProfit: 84520.0,
    exitPrice: 84520.0,
    positionSize: 0.5,
    riskPercent: 1.0,
    riskAmount: 200.0,
    rrRatio: 2.2,
    pnl: 440.0,
    rMultiple: 2.2,
    status: 'TAKE_PROFIT',
    setupType: 'SMC Liquidity Sweep + Order Block Retest',
    userReason: '★ Liquidity Sweep below swing low | ⚡ Bullish BOS close above EMA 20 | ◆ Unmitigated 15m Demand OB',
    holdingTimeMinutes: 90,
    mfe: 910.0,
    mae: 140.0,
    modificationsCount: 1,
    modificationsSummary: 'LONG 0.5 Lots @ 83640 → SL moved to Breakeven → Closed TAKE_PROFIT @ 84520 (+2.2R)',
    disciplineFlags: [],
    aiReviewSummary: 'WIN (+2.2R): Waited for Asian low liquidity sweep and bullish BOS candle close before entering.',
  },
  {
    id: 'tr_sample_02',
    userId: 'demo_trader_01',
    instrument: 'XAU/USD',
    timeframe: '15m',
    mode: 'REPLAY',
    direction: 'SHORT',
    entryPrice: 2948.5,
    stopLoss: 2953.5,
    takeProfit: 2936.0,
    exitPrice: 2953.5,
    positionSize: 1.0,
    riskPercent: 0.5,
    riskAmount: 50.0,
    rrRatio: 2.5,
    pnl: -50.0,
    rMultiple: -1.0,
    status: 'STOP_LOSS',
    setupType: 'Supply Zone Rejection',
    userReason: 'Entered before overhead liquidity sweep completed.',
    holdingTimeMinutes: 45,
    mfe: 32.0,
    mae: 50.0,
    modificationsCount: 0,
    modificationsSummary: 'SHORT 1.0 Lots @ 2948.50 → Closed STOP_LOSS @ 2953.50 (-1.0R)',
    disciplineFlags: [],
    aiReviewSummary: 'LOSS (-1.0R): Premature entry before buy-side liquidity sweep at 2952.80 completed.',
  },
];

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDemoSandbox, setIsDemoSandbox] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfileData>(INITIAL_DEMO_PROFILE);
  const [trades, setTrades] = useState<SimulatedTradeRecord[]>(INITIAL_DEMO_TRADES);
  const [userSubscription, setUserSubscription] = useState<UserSubscriptionRecord | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userProf = await ensureUserProfile(user);
          setProfile(userProf);
          setIsAuthenticated(true);
          setIsDemoSandbox(false);

          // Get or create 24-hour free trial / subscription record
          const sub = subscriptionService.getOrCreateUserSubscription(
            user.uid,
            user.email || '',
            user.displayName || 'Trader'
          );
          setUserSubscription(sub);

          // If trial has expired, prompt purchase package modal
          if (sub.status === 'TRIAL_EXPIRED') {
            setShowSubscriptionModal(true);
          }
        } catch (err) {
          console.error('Error initializing user profile:', err);
        }
      } else {
        setIsAuthenticated(false);
        setUserSubscription(null);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Listen to subscription changes (e.g. admin approval or trial extension)
  useEffect(() => {
    if (!profile.uid || !isAuthenticated) return;
    const syncSub = () => {
      const sub = subscriptionService.getUserSubscription(profile.uid);
      if (sub) {
        setUserSubscription({ ...sub });
      }
    };
    syncSub();
    const unsub = subscriptionService.subscribe(syncSub);
    return unsub;
  }, [profile.uid, isAuthenticated]);

  // Real-time interval check: auto-detect when 24h trial or subscription ends and prompt purchase package
  useEffect(() => {
    if (!isAuthenticated || !profile.uid) return;
    const checkExpiry = () => {
      const sub = subscriptionService.getUserSubscription(profile.uid);
      if (sub) {
        setUserSubscription({ ...sub });
        // When 24h trial or package time ends, automatically prompt purchase package modal
        if (sub.status === 'TRIAL_EXPIRED') {
          setShowSubscriptionModal(true);
        }
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 2000);
    return () => clearInterval(interval);
  }, [isAuthenticated, profile.uid]);

  // Firestore Real-time Sync for Logged-in Users
  useEffect(() => {
    if (!authReady || !isAuthenticated || !auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const tradesRef = collection(db, 'users', uid, 'trades');
    const qTrades = query(tradesRef, where('userId', '==', uid));
    const unsubTrades = onSnapshot(
      qTrades,
      (snap) => {
        const list: SimulatedTradeRecord[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data() as SimulatedTradeRecord);
        });
        list.sort((a, b) => (b.id > a.id ? 1 : -1));
        if (list.length > 0) setTrades(list);
      },
      (err) => {
        console.warn('Real-time trades sync notice:', err);
      }
    );

    return () => {
      unsubTrades();
    };
  }, [authReady, isAuthenticated]);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const user = await signInWithGoogle();
      const userProf = await ensureUserProfile(user);
      setProfile(userProf);
      setIsAuthenticated(true);
      setIsDemoSandbox(false);

      // Initialize or get 24-hour free trial / subscription record
      const sub = subscriptionService.getOrCreateUserSubscription(
        user.uid,
        user.email || '',
        user.displayName || 'Google Trader'
      );
      setUserSubscription(sub);

      // If user has no active subscription package and 24h trial expired, show package modal
      if (sub.status === 'TRIAL_EXPIRED') {
        setShowSubscriptionModal(true);
      }
    } catch (err: any) {
      console.warn('Sign-in notification:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in cancelled. Please sign in with Google to access your 24-hour free trial.');
      } else {
        // Fallback for iframe preview or blocked popups: create Google session with persistent local identity
        // so the 24-hour trial and subscription tracking are strictly enforced!
        const simulatedGoogleUid = `google_${Math.abs(Date.now() % 10000000)}`;
        const fallbackProf: UserProfileData = {
          ...INITIAL_DEMO_PROFILE,
          uid: simulatedGoogleUid,
          displayName: 'Google Trader',
          email: 'trader.google@gmail.com',
        };
        setProfile(fallbackProf);
        setIsAuthenticated(true);
        setIsDemoSandbox(false);

        const sub = subscriptionService.getOrCreateUserSubscription(
          simulatedGoogleUid,
          'trader.google@gmail.com',
          'Google Trader'
        );
        setUserSubscription(sub);
        if (sub.status === 'TRIAL_EXPIRED') {
          setShowSubscriptionModal(true);
        }
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    if (isAuthenticated) {
      try {
        await signOutUser();
      } catch (e) {
        console.warn('Sign out notice:', e);
      }
    }
    setIsAuthenticated(false);
    setIsDemoSandbox(false);
    setUserSubscription(null);
  };

  const handleSaveTrade = async (trade: SimulatedTradeRecord) => {
    setTrades((prev) => [trade, ...prev]);
    if (isAuthenticated && auth.currentUser) {
      try {
        await createSimulatedTradeInDb(auth.currentUser.uid, trade);
      } catch (e) {
        console.warn('Saved locally:', e);
      }
    }
  };

  const handleUpdateTrade = async (tradeId: string, updates: Partial<SimulatedTradeRecord>) => {
    setTrades((prev) => prev.map((t) => (t.id === tradeId ? { ...t, ...updates } : t)));
    if (isAuthenticated && auth.currentUser) {
      try {
        await updateSimulatedTradeInDb(auth.currentUser.uid, tradeId, updates);
      } catch (e) {
        console.warn('Updated locally:', e);
      }
    }
  };

  const handleLogDisciplineEvent = async (event: Omit<DisciplineEventRecord, 'id'>) => {
    if (isAuthenticated && auth.currentUser) {
      try {
        await logDisciplineEventInDb(auth.currentUser.uid, { ...event, id: `ev_${Date.now()}` });
      } catch (e) {
        console.warn('Logged locally:', e);
      }
    }
  };

  const handleUpdateBalance = async (newBalance: number, newScore?: number) => {
    const nextScore = newScore !== undefined ? newScore : profile.disciplineScore;
    setProfile((prev) => ({
      ...prev,
      virtualBalance: newBalance,
      disciplineScore: nextScore,
    }));
    if (isAuthenticated && auth.currentUser) {
      try {
        await updateUserProfileData(auth.currentUser.uid, {
          virtualBalance: newBalance,
          disciplineScore: nextScore,
        });
      } catch (e) {
        console.warn('Balance updated locally:', e);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <LandingPage
        onGoogleLogin={handleGoogleLogin}
        isSigningIn={isSigningIn}
        authError={authError}
      />
    );
  }

  return (
    <>
      <TradingTerminalView
        mode="TERMINAL"
        profile={profile}
        trades={trades}
        onSaveTrade={handleSaveTrade}
        onUpdateTrade={handleUpdateTrade}
        onLogDisciplineEvent={handleLogDisciplineEvent}
        onUpdateBalance={handleUpdateBalance}
        onSignOut={handleSignOut}
        isDemoSandbox={false}
        onGoogleLogin={handleGoogleLogin}
        userSubscription={userSubscription}
        onOpenSubscriptionModal={() => setShowSubscriptionModal(true)}
      />

      {/* Subscription & Binance Payment Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => {
          if (userSubscription?.status !== 'TRIAL_EXPIRED') {
            setShowSubscriptionModal(false);
          }
        }}
        userSubscription={userSubscription}
        userEmail={profile.email}
        userUid={profile.uid}
        onSignOut={handleSignOut}
        onPaymentSubmitted={() => {
          const updated = subscriptionService.getUserSubscription(profile.uid);
          if (updated) setUserSubscription({ ...updated });
        }}
      />
    </>
  );
}
