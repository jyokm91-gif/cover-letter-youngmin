import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDQ6Mgk5Bke0AxL453cdXSGFMzWEWR8Qk0",
  authDomain: "coverletter-370ad.firebaseapp.com",
  projectId: "coverletter-370ad",
  storageBucket: "coverletter-370ad.firebasestorage.app",
  messagingSenderId: "431914247180",
  appId: "1:431914247180:web:246f35785fd6f7b4c9ba29",
  measurementId: "G-HZZXSDCPPW"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
