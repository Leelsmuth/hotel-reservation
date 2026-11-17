/**
 * Thin wrapper around Firebase Auth (+ the Firestore `users` profile docs).
 * Same function names as `firebase/auth`, minus the `auth` argument.
 * See lib/auth/authClient.js.
 */
import {
  applyActionCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/firebase';

export const firebaseAuthClient = {
  onAuthStateChanged: (callback) => onAuthStateChanged(auth, callback),
  signInWithEmailAndPassword: (email, password) =>
    signInWithEmailAndPassword(auth, email, password),
  createUserWithEmailAndPassword: (email, password) =>
    createUserWithEmailAndPassword(auth, email, password),
  signOut: () => signOut(auth),
  sendPasswordResetEmail: (email) => sendPasswordResetEmail(auth, email),
  sendEmailVerification: (user) => sendEmailVerification(user),
  reload: (user) => reload(user),
  getCurrentUser: () => auth.currentUser,
  applyActionCode: (code) => applyActionCode(auth, code),
  confirmPasswordReset: (code, newPassword) =>
    confirmPasswordReset(auth, code, newPassword),
  verifyPasswordResetCode: (code) => verifyPasswordResetCode(auth, code),

  /** Returns the `users/{uid}` profile document data, or null. */
  getUserProfile: async (uid) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? userDoc.data() : null;
  },
};
