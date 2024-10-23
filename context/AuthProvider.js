'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  createUserWithEmailAndPassword,
  reload,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        await reload(firebaseUser); // Reload user to get the latest email verification status
        setUser(firebaseUser);

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login function with loading state
  const login = async (email, password) => {
    setLoading(true);
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;
    await reload(user); // Ensure the user object is up-to-date

    if (!user.emailVerified) {
      console.log('unverified');
      return null;
    }

    setUser(user);

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      setUserData(userDoc.data());
    }

    setLoading(false);
  };

  // Signup function with email verification
  const signup = async (email, password) => {
    setLoading(true);
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;
    await sendEmailVerification(user); // Send verification email

    setUser(user);
    setLoading(false);

    return user; // Return user so the signup page can handle further actions (like showing a success message)
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    setUser(null);
    setUserData(null);
    setLoading(false);
  };

  // Function to initiate password reset
  const initiatePasswordReset = async (email) => {
    setLoading(true);
    await sendPasswordResetEmail(auth, email);
    setLoading(false);
  };

  // Reload user data (for checking email verification status, etc.)
  const reloadUser = async () => {
    if (auth.currentUser) {
      await reload(auth.currentUser);
      setUser(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        login,
        signup,
        logout,
        initiatePasswordReset,
        reloadUser,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);
