import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
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
  }
}

export let isFirestoreQuotaExceeded = false;
const quotaListeners: ((status: boolean) => void)[] = [];

export function onFirestoreQuotaStateChange(listener: (status: boolean) => void) {
  quotaListeners.push(listener);
  return () => {
    const index = quotaListeners.indexOf(listener);
    if (index > -1) quotaListeners.splice(index, 1);
  };
}

function notifyQuotaStatus(status: boolean) {
  isFirestoreQuotaExceeded = status;
  quotaListeners.forEach(listener => listener(status));
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMsg = (error as any)?.message || "";
  const errorCode = (error as any)?.code || "";
  
  const isQuotaError = 
    errorMsg.includes("Quota exceeded") || 
    errorCode === 'resource-exhausted' ||
    errorMsg.includes("quota limit") ||
    errorMsg.includes("backoff delay");
  
  if (isQuotaError) {
    if (!isFirestoreQuotaExceeded) {
      notifyQuotaStatus(true);
    }
    const quotaMsg = "Daily free database quota exceeded. Progress will be saved locally but won't sync to the cloud until tomorrow.";
    console.error(quotaMsg);
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
