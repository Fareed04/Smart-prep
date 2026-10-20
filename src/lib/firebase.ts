import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence, disableNetwork, enableNetwork } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const FIRESTORE_DATABASE_UPGRADE_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data?openUpgradeDialog=true`;
export const FIRESTORE_PRICING_URL = 'https://firebase.google.com/pricing#cloud-firestore';

const QUOTA_STORAGE_KEY = 'smartprep_firestore_quota_exceeded';

function getInitialQuotaStatus(): boolean {
  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const markedAt = parsed?.timestamp || 0;
      // Quotas on free tier database reset daily (24 hour rolling window)
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (Date.now() - markedAt < twentyFourHours) {
        return true;
      }
      localStorage.removeItem(QUOTA_STORAGE_KEY);
    }
  } catch {}
  // Default to true for this active session to protect the exhausted free tier database
  return true;
}

export let isFirestoreQuotaExceeded = getInitialQuotaStatus();
const quotaListeners: ((status: boolean) => void)[] = [];

export function onFirestoreQuotaStateChange(listener: (status: boolean) => void) {
  quotaListeners.push(listener);
  listener(isFirestoreQuotaExceeded);
  return () => {
    const index = quotaListeners.indexOf(listener);
    if (index > -1) quotaListeners.splice(index, 1);
  };
}

export function markFirestoreQuotaExceeded() {
  if (!isFirestoreQuotaExceeded) {
    isFirestoreQuotaExceeded = true;
    try {
      localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify({ timestamp: Date.now() }));
    } catch {}
    // Disconnect Firestore network connection to immediately stop background retry spam
    disableNetwork(db).catch(() => {});
    quotaListeners.forEach(listener => listener(true));
  }
}

export async function resetFirestoreQuotaStatus(): Promise<void> {
  isFirestoreQuotaExceeded = false;
  try {
    localStorage.removeItem(QUOTA_STORAGE_KEY);
  } catch {}
  try {
    await enableNetwork(db);
  } catch {}
  quotaListeners.forEach(listener => listener(false));
}

export function canWriteToFirestore(): boolean {
  return !isFirestoreQuotaExceeded && navigator.onLine;
}

// Disconnect network immediately if quota is known to be exceeded to stop backoff retry loops
if (isFirestoreQuotaExceeded) {
  disableNetwork(db).catch(() => {});
} else {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Offline persistence active in another tab.");
    } else if (err.code === 'unimplemented') {
      console.warn("Offline persistence is not supported in this browser.");
    }
  });
}

// Intercept Firestore SDK background logger to catch internal worker quota errors
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = function (...args: any[]) {
    const fullMsg = args.map(a => (typeof a === 'object' ? (a?.message || JSON.stringify(a)) : String(a))).join(' ');
    if (
      fullMsg.includes("resource-exhausted") || 
      fullMsg.includes("Quota limit exceeded") || 
      fullMsg.includes("Free daily write units") ||
      fullMsg.includes("Free daily read units") ||
      fullMsg.includes("Using maximum backoff delay")
    ) {
      markFirestoreQuotaExceeded();
      disableNetwork(db).catch(() => {});
      console.warn("[SmartPrep Quota Protection] Cloud write quota reached. Switched to offline mode with local storage.");
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
      console.log("Sign-in popup was closed by the user.");
      return;
    }
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMsg = (error as any)?.message || "";
  const errorCode = (error as any)?.code || "";
  const errorStr = String(error);
  
  const isQuotaError = 
    errorCode === 'resource-exhausted' ||
    errorMsg.includes("Quota exceeded") || 
    errorMsg.includes("quota limit") ||
    errorMsg.includes("Quota limit exceeded") ||
    errorMsg.includes("Free daily write units") ||
    errorMsg.includes("Free daily read units") ||
    errorMsg.includes("backoff delay") ||
    errorStr.includes("resource-exhausted") ||
    errorStr.includes("Quota limit exceeded");
  
  if (isQuotaError) {
    markFirestoreQuotaExceeded();
    const quotaMsg = "Daily free database write quota exceeded. Progress is preserved in local storage and will sync to the cloud once quota resets tomorrow.";
    console.warn("[Firestore Quota Alert]", quotaMsg);
    throw new Error(quotaMsg);
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  
  const errorMessage = JSON.stringify(errInfo);
  console.error('Firestore Error: ', errorMessage);
  throw new Error(errorMessage);
}
