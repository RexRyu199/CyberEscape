import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
    signInAnonymously as fbSignInAnonymously,
    signOut as fbSignOut,
    getAuth,
    getReactNativePersistence,
    initializeAuth,
} from 'firebase/auth';
import {
    doc,
    getDoc,
    getFirestore,
    initializeFirestore,
    serverTimestamp,
    setDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAzy1PuRrHHAkuSI4uiQo4bKrlvuldiCD0",
  authDomain: "cyberescape-41ce0.firebaseapp.com",
  projectId: "cyberescape-41ce0",
  storageBucket: "cyberescape-41ce0.firebasestorage.app",
  messagingSenderId: "341357392978",
  appId: "1:341357392978:web:44ecae22d9f3df361d1b8b",
  measurementId: "G-97Q8XK1B55"
};

const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

export const auth = isFirstInit
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);

export const db = isFirstInit
  ? initializeFirestore(app, { experimentalForceLongPolling: true })
  : getFirestore(app);

export async function signInAnonymously() {
  if (auth.currentUser) return auth.currentUser;
  const cred = await fbSignInAnonymously(auth);
  return cred.user;
}

export async function createPlayerProfile(uid, codename) {
  await setDoc(doc(db, 'users', uid), {
    codename,
    createdAt: serverTimestamp(),
    selectedTheme: 'matrix',
    credits: 0,
    progress: {
      currentChapter: 1,
      completedMissions: [],
    },
  });
}

export async function getPlayerProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export function signOut() {
  return fbSignOut(auth);
}