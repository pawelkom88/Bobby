// Dynamic imports for route-specific dependencies
import { lazy } from 'react';

// Stripe - Only load on checkout/payment pages
export const loadStripe = () => import('@stripe/stripe-js').then(mod => mod.default);

// Deepgram - Only load in conversation
export const loadDeepgram = () => import('@deepgram/sdk').then(mod => mod.Deepgram);

// Mailersend - Only server-side, no client import needed

// Firebase modular imports (tree-shakable)
export { 
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

export {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

export {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

// Firebase app initialization
export { initializeApp } from 'firebase/app';
