import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// `getReactNativePersistence` is only declared under the "react-native" export
// condition of @firebase/auth, which Metro resolves correctly, unlike the
// `firebase/auth` facade package used above for the rest of the Auth API.
import { getReactNativePersistence } from '@firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { env } from '@/config/env';

const app = getApps()[0] ?? initializeApp(env.firebase);

// initializeAuth must be called exactly once per app; reuse getAuth on reloads
// (for example Fast Refresh) to avoid a "already initialized" runtime error.
const createAuth = () => {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return getAuth(app);
  }
};

export const auth = createAuth();
export const db = getFirestore(app);
