import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCdEsxnNGXVb0UOY1gdTElzJTtxZag-Q2w",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "xashmarkets-1.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://xashmarkets-1-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "xashmarkets-1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "xashmarkets-1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "166775884916",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:166775884916:web:20453106dfe337739e5521",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-VRMQS3FBV1"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const functions = getFunctions(app, 'europe-west1');