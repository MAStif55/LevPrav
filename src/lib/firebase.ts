import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: "levprav-art.firebaseapp.com",
    projectId: "levprav-art",
    storageBucket: "levprav-art.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let app: FirebaseApp = undefined as unknown as FirebaseApp;
let storage: FirebaseStorage = undefined as unknown as FirebaseStorage;
let auth: Auth = undefined as unknown as Auth;
let db: Firestore = undefined as unknown as Firestore;

try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    storage = getStorage(app);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    console.error("Firebase Initialization Error:", error);
}

export { app, storage, auth, db };
