import React, { useState } from "react";
import Login from "./components/Login/Login";
import Chat from "./components/Chat/Chat";
import { auth } from "./firebase-config";
import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";

function App() {
  const [user, setUser] = useState("");
  onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
  });

  const googleSignIn = async () => {
    const googleProvider = await new GoogleAuthProvider(auth);
    await signInWithPopup(auth, googleProvider)
      .then((result) => {
        const user = result.user;
        setUser(user);
        // console.log(user);
      })
      .catch((error) => {
        console.log(error);
      });
  };
  return (
    <>{user ? <Chat user={user} /> : <Login googleSignIn={googleSignIn} />}</>
  );
}

export default App;
