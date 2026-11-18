import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBz-ekyRIA5LmhXh6bsW0y95WRwdNIvf4k",
  authDomain: "ict4d-c3ea2.firebaseapp.com",
  projectId: "ict4d-c3ea2",
  storageBucket: "ict4d-c3ea2.firebasestorage.app",
  messagingSenderId: "1019861130637",
  appId: "1:1019861130637:web:af5e5ffae4c6c3c944b1c4",
  measurementId: "G-5Y1E6METPD"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
