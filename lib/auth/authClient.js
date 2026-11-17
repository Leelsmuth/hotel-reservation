/**
 * Auth client used by the UI (AuthProvider, login/signup pages, ...).
 *
 * Uses Firebase Auth normally, and a mock implementation backed by the
 * in-memory mock store in mock mode (see lib/config/mockMode.js).
 */
import { USE_MOCKS } from '@/lib/config/mockMode';
import { firebaseAuthClient } from './firebaseAuthClient';
import { mockAuthClient } from '@/lib/mock/mockAuthClient';

export const authClient = USE_MOCKS ? mockAuthClient : firebaseAuthClient;
