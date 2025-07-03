import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCP8AxMnX4KR7UcH2D2YkNHvbSmhNIvSPM",
  authDomain: "tool-ai-5f0cf.firebaseapp.com",
  databaseURL: "https://tool-ai-5f0cf-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tool-ai-5f0cf",
  storageBucket: "tool-ai-5f0cf.firebasestorage.app",
  messagingSenderId: "419860453970",
  appId: "1:419860453970:web:44e74b340686fd3adf9d8b",
  measurementId: "G-7CHSGEM9KS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { auth, database };