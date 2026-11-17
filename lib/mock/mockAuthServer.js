/**
 * Server-side half of the mock Firebase Auth. Users live in the mock store so
 * accounts created through /api/auth/signup can log in straight away.
 *
 * Errors mimic Firebase error codes/messages so the UI behaves the same way.
 */
import { generateMockId, getMockStore } from './store';
import { logMockEmail } from './mockMailer';

export class MockAuthError extends Error {
  constructor(code) {
    super(`Firebase: Error (${code}).`);
    this.code = code;
  }
}

const ACTION = {
  VERIFY_EMAIL: 'verifyEmail',
  RESET_PASSWORD: 'resetPassword',
};

const normalizeEmail = (email = '') => email.trim().toLowerCase();

/** The subset of a Firebase `User` the app relies on. */
export const toPublicUser = (user) => ({
  uid: user.uid,
  email: user.email,
  emailVerified: user.emailVerified,
  displayName: null,
});

const findUserByEmail = (email) => {
  const target = normalizeEmail(email);
  for (const user of getMockStore().users.values()) {
    if (normalizeEmail(user.email) === target) return user;
  }
  return null;
};

const requireUser = (uid) => {
  const user = getMockStore().users.get(uid);
  if (!user) throw new MockAuthError('auth/user-not-found');
  return user;
};

const assertPasswordStrength = (password) => {
  // Firebase Auth's own minimum
  if (!password || password.length < 6) {
    throw new MockAuthError('auth/weak-password');
  }
};

const issueActionCode = (type, uid) => {
  const code = generateMockId(`mock-${type}`);
  getMockStore().actionCodes.set(code, { type, uid });
  return code;
};

const readActionCode = (code, type) => {
  const entry = getMockStore().actionCodes.get(code);
  if (!entry || entry.type !== type) {
    throw new MockAuthError('auth/invalid-action-code');
  }
  return entry;
};

export const signIn = (email, password) => {
  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    throw new MockAuthError('auth/invalid-credential');
  }
  return toPublicUser(user);
};

export const createUser = ({ email, password, fullName = '' }) => {
  if (!email) throw new MockAuthError('auth/invalid-email');
  if (findUserByEmail(email)) {
    throw new MockAuthError('auth/email-already-in-use');
  }
  assertPasswordStrength(password);

  const user = {
    uid: generateMockId('mock-user'),
    email: email.trim(),
    password,
    emailVerified: false,
    profile: {
      fullName,
      email: email.trim(),
      createdAt: new Date().toISOString(),
      isAdmin: false,
    },
  };
  getMockStore().users.set(user.uid, user);
  return toPublicUser(user);
};

export const deleteUser = (uid) => {
  getMockStore().users.delete(uid);
};

export const getUser = (uid) => toPublicUser(requireUser(uid));

export const getUserProfile = (uid) => {
  const user = getMockStore().users.get(uid);
  return user ? { ...user.profile } : null;
};

export const sendEmailVerification = (uid, origin) => {
  const user = requireUser(uid);
  const code = issueActionCode(ACTION.VERIFY_EMAIL, uid);
  const link = `${origin}/auth-manager?mode=${ACTION.VERIFY_EMAIL}&oobCode=${code}`;

  logMockEmail({
    to: user.email,
    subject: 'Verify your email for Beverly Hills Hotel',
    text: `Follow this link to verify your email address:\n${link}`,
  });
};

export const applyActionCode = (code) => {
  const { uid } = readActionCode(code, ACTION.VERIFY_EMAIL);
  requireUser(uid).emailVerified = true;
  getMockStore().actionCodes.delete(code);
};

export const sendPasswordResetEmail = (email, origin) => {
  const user = findUserByEmail(email);
  // Like Firebase with email enumeration protection, unknown emails succeed
  // silently.
  if (!user) return;

  const code = issueActionCode(ACTION.RESET_PASSWORD, user.uid);
  const link = `${origin}/auth-manager?mode=${ACTION.RESET_PASSWORD}&oobCode=${code}`;

  logMockEmail({
    to: user.email,
    subject: 'Reset your password for Beverly Hills Hotel',
    text: `Follow this link to reset your password:\n${link}`,
  });
};

export const verifyPasswordResetCode = (code) => {
  const { uid } = readActionCode(code, ACTION.RESET_PASSWORD);
  return requireUser(uid).email;
};

export const confirmPasswordReset = (code, newPassword) => {
  const { uid } = readActionCode(code, ACTION.RESET_PASSWORD);
  assertPasswordStrength(newPassword);
  requireUser(uid).password = newPassword;
  getMockStore().actionCodes.delete(code);
};
