import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// const firebaseConfig = {
//   apiKey: "AIzaSyCRJBPKB8NY8KSzuczR1ZeRNgUzEssczF4",
//   authDomain: "chatterzz-app.firebaseapp.com",
//   projectId: "chatterzz-app",
//   storageBucket: "chatterzz-app.firebasestorage.app",
//   messagingSenderId: "420248101665",
//   appId: "1:420248101665:web:73b9621240cb95fbdc9460",
// };

const firebaseConfig = {
  apiKey: "AIzaSyD9UYKX8tPQSdLZBBpNY7cSrUx5QyspInk",
  authDomain: "react-firebase-chat-app-815ef.firebaseapp.com",
  databaseURL:
    "https://react-firebase-chat-app-815ef-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "react-firebase-chat-app-815ef",
  storageBucket: "react-firebase-chat-app-815ef.appspot.com",
  messagingSenderId: "84893852681",
  appId: "1:84893852681:web:d88d3a29924b7a4df6c4d8",
  measurementId: "G-KNG6NB10PX",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { auth, db, storage };
