import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCRJBPKB8NY8KSzuczR1ZeRNgUzEssczF4",
  authDomain: "chatterzz-app.firebaseapp.com",
  projectId: "chatterzz-app",
  storageBucket: "chatterzz-app.firebasestorage.app",
  messagingSenderId: "420248101665",
  appId: "1:420248101665:web:73b9621240cb95fbdc9460",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { auth, db, storage };
