/**
 * Backend for the mock Firebase Auth client (lib/mock/mockAuthClient.js).
 * Only available in mock mode; returns 404 otherwise.
 */
import { USE_MOCKS } from '@/lib/config/mockMode';
import * as mockAuth from '@/lib/mock/mockAuthServer';
import { mockLatency } from '@/lib/mock/store';
import { NextResponse } from 'next/server';

const handlers = {
  signIn: ({ email, password }) => ({
    user: mockAuth.signIn(email, password),
  }),
  createUser: ({ email, password }) => ({
    user: mockAuth.createUser({ email, password }),
  }),
  getUser: ({ uid }) => ({ user: mockAuth.getUser(uid) }),
  getUserProfile: ({ uid }) => ({ profile: mockAuth.getUserProfile(uid) }),
  sendEmailVerification: ({ uid }, origin) => {
    mockAuth.sendEmailVerification(uid, origin);
    return { success: true };
  },
  applyActionCode: ({ code }) => {
    mockAuth.applyActionCode(code);
    return { success: true };
  },
  sendPasswordResetEmail: ({ email }, origin) => {
    mockAuth.sendPasswordResetEmail(email, origin);
    return { success: true };
  },
  verifyPasswordResetCode: ({ code }) => ({
    email: mockAuth.verifyPasswordResetCode(code),
  }),
  confirmPasswordReset: ({ code, newPassword }) => {
    mockAuth.confirmPasswordReset(code, newPassword);
    return { success: true };
  },
};

export async function POST(request) {
  if (!USE_MOCKS) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const { action, ...payload } = await request.json();
  const handler = handlers[action];

  if (!handler) {
    return NextResponse.json(
      { message: `Unknown mock auth action: ${action}` },
      { status: 400 }
    );
  }

  await mockLatency();

  try {
    const origin = new URL(request.url).origin;
    return NextResponse.json(handler(payload, origin));
  } catch (error) {
    if (error instanceof mockAuth.MockAuthError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: 400 }
      );
    }
    console.error('Mock auth error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
