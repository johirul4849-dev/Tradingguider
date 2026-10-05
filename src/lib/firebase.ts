import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Validate connection to Firestore on boot as required by skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface UserProfileData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  preferredMarket: 'BTC/USD' | 'XAU/USD' | 'BOTH';
  preferredTimeframe: '1m' | '5m' | '15m' | '30m' | '1H' | '4H' | '1D';
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  mainGoal: string;
  virtualBalance: number;
  riskPreference: number;
  maxDailyTrades: number;
  maxConsecutiveLosses: number;
  postLossCooldownMinutes: number;
  lockMode: 'Warning' | 'Soft Lock' | 'Training Lock';
  disciplineScore: number;
  onboardingCompleted: boolean;
  createdAt?: any;
  lastLogin?: any;
  updatedAt?: any;
}

export interface SimulatedTradeRecord {
  id: string;
  userId: string;
  instrument: 'BTC/USD' | 'XAU/USD';
  timeframe: string;
  mode: 'REPLAY' | 'TERMINAL' | 'LIVE';
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  exitPrice: number;
  positionSize: number;
  riskPercent: number;
  riskAmount: number;
  rrRatio: number;
  pnl: number;
  rMultiple: number;
  status: 'OPEN' | 'TAKE_PROFIT' | 'STOP_LOSS' | 'BREAKEVEN' | 'MANUALLY_CLOSED';
  setupType: string;
  userReason: string;
  holdingTimeMinutes: number;
  mfe: number;
  mae: number;
  modificationsCount: number;
  modificationsSummary: string;
  disciplineFlags: string[];
  aiReviewSummary: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface DisciplineEventRecord {
  id: string;
  userId: string;
  eventType: string;
  severity: 'INFO' | 'WARNING' | 'VIOLATION';
  description: string;
  scoreImpact: number;
  createdAt?: any;
}

export interface StrategyRecord {
  id: string;
  userId: string;
  name: string;
  instrument: string;
  timeframe: string;
  rulesSummary: string;
  minRR: number;
  winRate: number;
  avgR: number;
  totalTrades: number;
  maxDrawdown: number;
  createdAt?: any;
}

export interface TrainingProgressRecord {
  id: string;
  userId: string;
  moduleId: string;
  category: string;
  completed: boolean;
  quizScore: number;
  updatedAt?: any;
}

// Helper for blueprint-compliant string truncation
function safeStr(val: string | undefined | null, maxLen: number, fallback = ''): string {
  const s = (val ?? fallback).toString();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function ensureUserProfile(user: User): Promise<UserProfileData> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as UserProfileData;
      // Update lastLogin
      try {
        await updateDoc(ref, {
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        // Ignore transient update error on login
      }
      return data;
    } else {
      const initialProfile = {
        uid: user.uid,
        displayName: safeStr(user.displayName, 120, 'Trader'),
        email: safeStr(user.email, 254, 'trader@example.com'),
        photoURL: safeStr(user.photoURL, 1024, ''),
        preferredMarket: 'BTC/USD' as const,
        preferredTimeframe: '15m' as const,
        experienceLevel: 'Beginner' as const,
        mainGoal: 'Improve risk management',
        virtualBalance: 25000,
        riskPreference: 1.0,
        maxDailyTrades: 3,
        maxConsecutiveLosses: 3,
        postLossCooldownMinutes: 15,
        lockMode: 'Soft Lock' as const,
        disciplineScore: 85,
        onboardingCompleted: false,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      try {
        await setDoc(ref, initialProfile);
      } catch (setErr) {
        console.warn('Initial profile save to Firestore encountered issue, using local profile:', setErr);
      }
      return initialProfile;
    }
  } catch (err) {
    console.warn('ensureUserProfile fallback returning local profile:', err);
    return {
      uid: user.uid,
      displayName: safeStr(user.displayName, 120, 'Trader'),
      email: safeStr(user.email, 254, 'trader@example.com'),
      photoURL: safeStr(user.photoURL, 1024, ''),
      preferredMarket: 'BTC/USD' as const,
      preferredTimeframe: '15m' as const,
      experienceLevel: 'Beginner' as const,
      mainGoal: 'Improve risk management',
      virtualBalance: 25000,
      riskPreference: 1.0,
      maxDailyTrades: 3,
      maxConsecutiveLosses: 3,
      postLossCooldownMinutes: 15,
      lockMode: 'Soft Lock' as const,
      disciplineScore: 85,
      onboardingCompleted: false,
    };
  }
}

export async function updateUserProfileData(
  uid: string,
  updates: Partial<Omit<UserProfileData, 'uid' | 'email' | 'createdAt'>>
): Promise<void> {
  const path = `users/${uid}`;
  const ref = doc(db, 'users', uid);
  try {
    const payload: Record<string, any> = {
      ...updates,
      updatedAt: serverTimestamp(),
    };
    if (payload.displayName !== undefined) payload.displayName = safeStr(payload.displayName, 120);
    if (payload.mainGoal !== undefined) payload.mainGoal = safeStr(payload.mainGoal, 100);
    await updateDoc(ref, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function createSimulatedTradeInDb(uid: string, trade: SimulatedTradeRecord): Promise<void> {
  const path = `users/${uid}/trades/${trade.id}`;
  const ref = doc(db, 'users', uid, 'trades', trade.id);
  try {
    const cleanFlags = (trade.disciplineFlags || []).slice(0, 10).map((f) => safeStr(f, 100));
    await setDoc(ref, {
      id: safeStr(trade.id, 128),
      userId: uid,
      instrument: trade.instrument,
      timeframe: safeStr(trade.timeframe, 10),
      mode: trade.mode,
      direction: trade.direction,
      entryPrice: Number(trade.entryPrice),
      stopLoss: Number(trade.stopLoss),
      takeProfit: Number(trade.takeProfit),
      exitPrice: Number(trade.exitPrice || 0),
      positionSize: Number(trade.positionSize),
      riskPercent: Number(trade.riskPercent),
      riskAmount: Number(trade.riskAmount),
      rrRatio: Number(trade.rrRatio),
      pnl: Number(trade.pnl || 0),
      rMultiple: Number(trade.rMultiple || 0),
      status: trade.status,
      setupType: safeStr(trade.setupType, 80, 'Structure Setup'),
      userReason: safeStr(trade.userReason, 1000, ''),
      holdingTimeMinutes: Number(trade.holdingTimeMinutes || 0),
      mfe: Number(trade.mfe || 0),
      mae: Number(trade.mae || 0),
      modificationsCount: Number(trade.modificationsCount || 0),
      modificationsSummary: safeStr(trade.modificationsSummary, 2000, ''),
      disciplineFlags: cleanFlags,
      aiReviewSummary: safeStr(trade.aiReviewSummary, 4000, ''),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateSimulatedTradeInDb(
  uid: string,
  tradeId: string,
  updates: Partial<SimulatedTradeRecord>
): Promise<void> {
  const path = `users/${uid}/trades/${tradeId}`;
  const ref = doc(db, 'users', uid, 'trades', tradeId);
  try {
    const payload: Record<string, any> = {
      ...updates,
      updatedAt: serverTimestamp(),
    };
    if (payload.modificationsSummary !== undefined) {
      payload.modificationsSummary = safeStr(payload.modificationsSummary, 2000);
    }
    if (payload.aiReviewSummary !== undefined) {
      payload.aiReviewSummary = safeStr(payload.aiReviewSummary, 4000);
    }
    if (payload.userReason !== undefined) {
      payload.userReason = safeStr(payload.userReason, 1000);
    }
    if (payload.disciplineFlags !== undefined) {
      payload.disciplineFlags = (payload.disciplineFlags as string[]).slice(0, 10).map((f) => safeStr(f, 100));
    }
    await updateDoc(ref, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function logDisciplineEventInDb(uid: string, event: DisciplineEventRecord): Promise<void> {
  const path = `users/${uid}/disciplineEvents/${event.id}`;
  const ref = doc(db, 'users', uid, 'disciplineEvents', event.id);
  try {
    await setDoc(ref, {
      id: safeStr(event.id, 128),
      userId: uid,
      eventType: safeStr(event.eventType, 60),
      severity: event.severity,
      description: safeStr(event.description, 500),
      scoreImpact: Math.max(-100, Math.min(100, Number(event.scoreImpact))),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function saveStrategyInDb(uid: string, strategy: StrategyRecord): Promise<void> {
  const path = `users/${uid}/strategies/${strategy.id}`;
  const ref = doc(db, 'users', uid, 'strategies', strategy.id);
  try {
    await setDoc(ref, {
      id: safeStr(strategy.id, 128),
      userId: uid,
      name: safeStr(strategy.name, 100),
      instrument: safeStr(strategy.instrument, 20),
      timeframe: safeStr(strategy.timeframe, 10),
      rulesSummary: safeStr(strategy.rulesSummary, 1000),
      minRR: Number(strategy.minRR),
      winRate: Number(strategy.winRate),
      avgR: Number(strategy.avgR),
      totalTrades: Number(strategy.totalTrades),
      maxDrawdown: Number(strategy.maxDrawdown),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function saveTrainingProgressInDb(uid: string, progress: TrainingProgressRecord): Promise<void> {
  const path = `users/${uid}/trainingProgress/${progress.id}`;
  const ref = doc(db, 'users', uid, 'trainingProgress', progress.id);
  try {
    await setDoc(ref, {
      id: safeStr(progress.id, 128),
      userId: uid,
      moduleId: safeStr(progress.moduleId, 100),
      category: safeStr(progress.category, 60),
      completed: Boolean(progress.completed),
      quizScore: Math.max(0, Math.min(100, Number(progress.quizScore))),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export { onAuthStateChanged, collection, query, where, onSnapshot, doc, Timestamp, deleteDoc };
