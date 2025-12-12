// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDQe4bYfXrZ6j8-Wkn3aKfUYhHKk9jDxpQ",
  authDomain: "gomar33-cc75d.firebaseapp.com",
  projectId: "gomar33-cc75d",
  storageBucket: "gomar33-cc75d.firebasestorage.app",
  messagingSenderId: "1047566900696",
  appId: "1:1047566900696:web:ab9acc9d3c412ad50326ad",
  measurementId: "G-4SD3M8JS4M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in browser environment
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, analytics };

