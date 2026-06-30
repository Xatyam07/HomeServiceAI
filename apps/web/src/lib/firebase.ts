import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCF2cLF0qhtcQxbSUXoqcbn_ECPee9K7I8",
  authDomain: "homesphereai.firebaseapp.com",
  projectId: "homesphereai",
  storageBucket: "homesphereai.firebasestorage.app",
  messagingSenderId: "137273915134",
  appId: "1:137273915134:web:df99e8af8019cb84b157af",
  measurementId: "G-N0G16234WV"
};

// Initialize Firebase once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { app, auth, analytics };
