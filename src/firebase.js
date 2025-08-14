import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getFunctions } from 'firebase/functions';

// Debug environment variables
console.log('Firebase Environment Variables:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'SET' : 'NOT SET',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? 'SET' : 'NOT SET',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL ? 'SET' : 'NOT SET',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? 'SET' : 'NOT SET',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? 'SET' : 'NOT SET',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ? 'SET' : 'NOT SET',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ? 'SET' : 'NOT SET'
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCdEsxnNGXVb0UOY1gdTElzJTtxZag-Q2w",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "xashmarkets-1.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://xashmarkets-1.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "xashmarkets-1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "xashmarkets-1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "166775884916",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:166775884916:web:20453106dfe337739e5521",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-VRMQS3FBV1"
};

console.log('Firebase Config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? 'SET' : 'NOT SET'
});

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const functions = getFunctions(app, 'europe-west1');