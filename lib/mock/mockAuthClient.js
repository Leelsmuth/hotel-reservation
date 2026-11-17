/**
 * Browser-side mock of Firebase Auth, used in mock mode.
 *
 * Exposes the same functions as lib/auth/firebaseAuthClient.js. Users and
 * credentials live in the server-side mock store (via /api/mock/auth). The
 * signed-in user's id is kept in localStorage so sessions survive a page
 * refresh, like Firebase does.
 */
const SESSION_KEY = 'hotel-reservation.mock-auth-uid';

let currentUser = null;
let sessionRestored = null;
const listeners = new Set();

const callMockAuth = async (action, payload = {}) => {
  const response = await fetch('/api/mock/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Mock auth request failed');
    error.code = data.code;
    throw error;
  }
  return data;
};

const readSession = () => {
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
};

const writeSession = (uid) => {
  try {
    if (uid) {
      window.localStorage.setItem(SESSION_KEY, uid);
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // localStorage unavailable (private mode, etc.): session won't persist
  }
};

const setCurrentUser = (user) => {
  currentUser = user;
  writeSession(user?.uid ?? null);
  listeners.forEach((callback) => callback(currentUser));
};

const restoreSession = async () => {
  const uid = readSession();
  if (!uid) return;
  try {
    const { user } = await callMockAuth('getUser', { uid });
    currentUser = user;
  } catch {
    // The mock store resets when the dev server restarts, so accounts created
    // via sign-up disappear. Treat that as being signed out.
    writeSession(null);
  }
};

export const mockAuthClient = {
  onAuthStateChanged: (callback) => {
    listeners.add(callback);
    sessionRestored ??= restoreSession();
    // Like Firebase: every subscriber is told the current state once known
    sessionRestored.then(() => {
      if (listeners.has(callback)) callback(currentUser);
    });
    return () => listeners.delete(callback);
  },

  signInWithEmailAndPassword: async (email, password) => {
    const { user } = await callMockAuth('signIn', { email, password });
    setCurrentUser(user);
    return { user };
  },

  createUserWithEmailAndPassword: async (email, password) => {
    const { user } = await callMockAuth('createUser', { email, password });
    setCurrentUser(user);
    return { user };
  },

  signOut: async () => {
    setCurrentUser(null);
  },

  sendPasswordResetEmail: async (email) => {
    await callMockAuth('sendPasswordResetEmail', { email });
  },

  sendEmailVerification: async (user) => {
    await callMockAuth('sendEmailVerification', { uid: user.uid });
  },

  // Firebase's reload() refreshes the user object in place
  reload: async (user) => {
    const { user: fresh } = await callMockAuth('getUser', { uid: user.uid });
    Object.assign(user, fresh);
  },

  getCurrentUser: () => currentUser,

  applyActionCode: async (code) => {
    await callMockAuth('applyActionCode', { code });
  },

  confirmPasswordReset: async (code, newPassword) => {
    await callMockAuth('confirmPasswordReset', { code, newPassword });
  },

  verifyPasswordResetCode: async (code) => {
    const { email } = await callMockAuth('verifyPasswordResetCode', { code });
    return email;
  },

  getUserProfile: async (uid) => {
    const { profile } = await callMockAuth('getUserProfile', { uid });
    return profile;
  },
};
