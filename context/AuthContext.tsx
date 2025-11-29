'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { logger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authStateUpdateResolversRef = useRef<Array<(user: User | null) => void>>([]);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      // Resolve any pending auth state update promises
      const resolvers = authStateUpdateResolversRef.current;
      authStateUpdateResolversRef.current = [];
      resolvers.forEach((resolve) => resolve(user));

      if (user) {
        logger.info('User authenticated:', { userId: user.uid });
        // Sync user data to Firestore on auth state change
        await syncUserToFirestore(user);

        // Set auth indicator cookie for server-side route protection
        // This is a non-sensitive indicator that the user is authenticated
        // Actual auth verification happens via Firebase ID token in API routes
        document.cookie = `bobby_auth=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict${
          process.env.NODE_ENV === 'production' ? '; Secure' : ''
        }`;
      } else {
        logger.info('User signed out');
        // Clear auth indicator cookie
        document.cookie = 'bobby_auth=; path=/; max-age=0; SameSite=Strict';
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  /**
   * Sync user data to Firestore
   * Creates or updates the user document in the "users" collection
   */
  const syncUserToFirestore = async (user: User) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userData = {
        email: user.email,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Use merge: true to update existing fields or create new document
      await setDoc(userDocRef, userData, { merge: true });
      logger.info('User data synced to Firestore:', user.uid);
    } catch (error) {
      logger.error('Error syncing user to Firestore:', error);
      // Don't throw - we don't want to block auth if Firestore fails
    }
  };

  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      logger.info('User signed in successfully:', userCredential.user.uid);

      // Wait for the auth state to be updated in the context
      // This ensures that by the time signIn() returns, the user state is synchronized
      await new Promise<User | null>((resolve) => {
        authStateUpdateResolversRef.current.push(resolve);
      });

      return userCredential;
    } catch (error) {
      logger.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string): Promise<UserCredential> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      logger.info('User signed up successfully:', userCredential.user.uid);

      // Create initial user document in Firestore
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        email: userCredential.user.email,
        displayName: null,
        photoURL: null,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      logger.info('User document created in Firestore:', userCredential.user.uid);

      return userCredential;
    } catch (error) {
      logger.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      logger.info('User signed out successfully');
    } catch (error) {
      logger.error('Sign out error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
      logger.info('Password reset email sent to:', email);
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

