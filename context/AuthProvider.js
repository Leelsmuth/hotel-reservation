'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { authClient } from '@/lib/auth/authClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  // True until the first auth state arrives (who is signed in isn't known
  // yet). The app still renders meanwhile, including on the server: hiding
  // it until then left every page blank for seconds on load. UI that depends
  // on the user (header account menu, protected pages) checks `initializing`
  // or `loading` instead. Auth actions must never unmount the app either:
  // that blanked the page when they failed and lost form state.
  const [initializing, setInitializing] = useState(true);
  // Auth actions in flight; exposed to pages as `loading` for spinners.
  const [pendingActions, setPendingActions] = useState(0);
  // Who the most recent auth update is for. A slower update for anyone else
  // is dropped (e.g. a sign-in finishing after a sign-out must not sign the
  // user back in). Updates for the same user all apply: login() and the
  // auth-state listener both load the user and either may finish first.
  const latestUid = useRef(undefined);

  const trackPending = useCallback(async (action) => {
    setPendingActions((count) => count + 1);
    try {
      return await action();
    } finally {
      setPendingActions((count) => count - 1);
    }
  }, []);

  // Loads the latest user (email verification status) and profile, then sets
  // both together so `user` is never set without `userData`.
  const applyUser = useCallback(async (authUser) => {
    latestUid.current = authUser?.uid ?? null;

    if (!authUser) {
      setUser(null);
      setUserData(null);
      return;
    }

    // Independent requests: fetch the latest user (email verification
    // status) and the profile in parallel
    const [, profile] = await Promise.all([
      authClient.reload(authUser),
      authClient.getUserProfile(authUser.uid),
    ]);

    if (latestUid.current === authUser.uid) {
      setUser(authUser);
      setUserData(profile);
    }
  }, []);

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = authClient.onAuthStateChanged(async (firebaseUser) => {
      try {
        await applyUser(firebaseUser);
      } catch (error) {
        console.error('Failed to load the signed-in user:', error);
        await applyUser(null);
      } finally {
        setInitializing(false);
      }
    });

    return () => unsubscribe();
  }, [applyUser]);

  /**
   * Signs in and resolves with the signed-in user once `user`/`userData` are
   * set. Callers must check `emailVerified`: unverified users are signed in
   * (so a new verification email can be sent) but shouldn't be let through.
   * Rejects with the auth error (e.g. wrong password).
   */
  const login = (email, password) =>
    trackPending(async () => {
      const userCredential = await authClient.signInWithEmailAndPassword(
        email,
        password
      );
      await applyUser(userCredential.user);
      return userCredential.user;
    });

  // Signup function with email verification
  const signup = (email, password) =>
    trackPending(async () => {
      const userCredential = await authClient.createUserWithEmailAndPassword(
        email,
        password
      );

      const user = userCredential.user;
      await authClient.sendEmailVerification(user); // Send verification email

      setUser(user);

      return user; // Return user so the signup page can handle further actions (like showing a success message)
    });

  // Logout function
  const logout = () =>
    trackPending(async () => {
      await authClient.signOut();
      await applyUser(null);
    });

  // Function to initiate password reset
  const initiatePasswordReset = (email) =>
    trackPending(() => authClient.sendPasswordResetEmail(email));

  // Reload user data (for checking email verification status, etc.)
  const reloadUser = async () => {
    const currentUser = authClient.getCurrentUser();
    if (currentUser) {
      await authClient.reload(currentUser);
      setUser(currentUser);
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
        // Who is signed in isn't known yet
        initializing,
        // `initializing` or an auth action (login, logout, ...) in flight
        loading: initializing || pendingActions > 0,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);
