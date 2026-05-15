import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN;
const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const firebaseStorageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;
const firebaseMessagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID;
const firebaseAppId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID;
const firebaseMeasurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID;

const missingFirebaseVars: string[] = [];
if (!firebaseApiKey) missingFirebaseVars.push("NEXT_PUBLIC_FIREBASE_API_KEY or FIREBASE_API_KEY");
if (!firebaseAuthDomain) missingFirebaseVars.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN or FIREBASE_AUTH_DOMAIN");
if (!firebaseProjectId) missingFirebaseVars.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID or FIREBASE_PROJECT_ID");
if (!firebaseStorageBucket) missingFirebaseVars.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET or FIREBASE_STORAGE_BUCKET");
if (!firebaseMessagingSenderId) missingFirebaseVars.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID or FIREBASE_MESSAGING_SENDER_ID");
if (!firebaseAppId) missingFirebaseVars.push("NEXT_PUBLIC_FIREBASE_APP_ID or FIREBASE_APP_ID");

if (missingFirebaseVars.length > 0) {
  throw new Error(
    `Firebase environment variables are not configured on this build. Set ${missingFirebaseVars.join(", ")} in Vercel environment variables.`
  );
}

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: firebaseAuthDomain,
  projectId: firebaseProjectId,
  storageBucket: firebaseStorageBucket,
  messagingSenderId: firebaseMessagingSenderId,
  appId: firebaseAppId,
  measurementId: firebaseMeasurementId,
};

// Inicializa o Firebase apenas se não houver uma app já inicializada
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
