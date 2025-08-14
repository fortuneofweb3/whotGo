import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyCdEsxnNGXVb0UOY1gdTElzJTtxZag-Q2w",
  authDomain: "xashmarkets-1.firebaseapp.com",
  databaseURL: "https://xashmarkets-1-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "xashmarkets-1",
  storageBucket: "xashmarkets-1.firebasestorage.app",
  messagingSenderId: "166775884916",
  appId: "1:166775884916:web:20453106dfe337739e5521",
  measurementId: "G-VRMQS3FBV1"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const functions = getFunctions(app, 'europe-west1');