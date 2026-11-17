import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { USE_MOCKS } from '@/lib/config/mockMode';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

if (!USE_MOCKS && !firebaseConfig.apiKey) {
  console.error(
    'Firebase credentials are missing (NEXT_PUBLIC_FIREBASE_*). Add them to ' +
      '.env.local (see .env.example), or run `npm run dev:mock` to use the ' +
      'app with dummy data instead.'
  );
}

// In mock mode Firebase is never initialised: nothing here should be used,
// the mock data layer / auth client take over instead.
const firebaseApp = USE_MOCKS
  ? null
  : getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export let analytics;

if (firebaseApp) {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(firebaseApp);
      }
    })
    .catch((error) => {
      console.error('Error checking analytics support:', error);
    });
}

// logEvent(analytics, 'notification_received');
