import React from "react";
import { auth } from "../../firebase-config";
import { signOut } from "firebase/auth";
function SideMenu({ user }) {
  const { displayName, photoURL } = user;

  const signOutUser = async () => {
    await signOut(auth);
  };

  return (
    <div className="sideMenu">
      <h1 className="web-title">Chatterzz Ph</h1>

      <div className="user ds-flex">
        <img src={photoURL} alt={displayName} className="user-profile" />
        <p className="userName">{displayName}</p>
      </div>

      <button onClick={signOutUser} className="btn logout-btn">
        Log Out
      </button>
    </div>
  );
}

export default SideMenu;
