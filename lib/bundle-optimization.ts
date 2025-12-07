// Bundle optimization utilities

// Dynamic imports for route-specific dependencies
export const dynamicImports = {
  // Stripe - Only load on checkout/payment pages
  stripe: () => import('@stripe/stripe-js'),
  
  // Deepgram - Only load in conversation pages
  deepgram: () => import('@deepgram/sdk'),
  
  // Mailersend - Server-side only, never import on client
  mailersend: () => import('mailersend'),
};

// Firebase modular imports (tree-shakable)
// Use these instead of importing the entire firebase package
export const firebaseImports = {
  auth: {
    getAuth: () => import('firebase/auth').then(mod => mod.getAuth),
    signInWithEmailAndPassword: () => import('firebase/auth').then(mod => mod.signInWithEmailAndPassword),
    createUserWithEmailAndPassword: () => import('firebase/auth').then(mod => mod.createUserWithEmailAndPassword),
    sendPasswordResetEmail: () => import('firebase/auth').then(mod => mod.sendPasswordResetEmail),
    signOut: () => import('firebase/auth').then(mod => mod.signOut),
    onAuthStateChanged: () => import('firebase/auth').then(mod => mod.onAuthStateChanged),
    GoogleAuthProvider: () => import('firebase/auth').then(mod => mod.GoogleAuthProvider),
    signInWithPopup: () => import('firebase/auth').then(mod => mod.signInWithPopup),
  },
  firestore: {
    getFirestore: () => import('firebase/firestore').then(mod => mod.getFirestore),
    doc: () => import('firebase/firestore').then(mod => mod.doc),
    getDoc: () => import('firebase/firestore').then(mod => mod.getDoc),
    setDoc: () => import('firebase/firestore').then(mod => mod.setDoc),
    updateDoc: () => import('firebase/firestore').then(mod => mod.updateDoc),
    deleteDoc: () => import('firebase/firestore').then(mod => mod.deleteDoc),
    collection: () => import('firebase/firestore').then(mod => mod.collection),
    query: () => import('firebase/firestore').then(mod => mod.query),
    where: () => import('firebase/firestore').then(mod => mod.where),
    orderBy: () => import('firebase/firestore').then(mod => mod.orderBy),
    limit: () => import('firebase/firestore').then(mod => mod.limit),
    onSnapshot: () => import('firebase/firestore').then(mod => mod.onSnapshot),
    serverTimestamp: () => import('firebase/firestore').then(mod => mod.serverTimestamp),
    arrayUnion: () => import('firebase/firestore').then(mod => mod.arrayUnion),
    arrayRemove: () => import('firebase/firestore').then(mod => mod.arrayRemove),
  },
  storage: {
    getStorage: () => import('firebase/storage').then(mod => mod.getStorage),
    ref: () => import('firebase/storage').then(mod => mod.ref),
    uploadBytes: () => import('firebase/storage').then(mod => mod.uploadBytes),
    getDownloadURL: () => import('firebase/storage').then(mod => mod.getDownloadURL),
    deleteObject: () => import('firebase/storage').then(mod => mod.deleteObject),
  },
  app: {
    initializeApp: () => import('firebase/app').then(mod => mod.initializeApp),
  },
};

// Webpack chunk names for better debugging
export const chunkNames = {
  stripe: 'stripe-chunk',
  deepgram: 'deepgram-chunk',
  conversation: 'conversation-chunk',
  checkout: 'checkout-chunk',
  auth: 'auth-chunk',
};
