import React from "react";
import { FcGoogle } from "react-icons/fc";

import "./style/login.css";

function Login({ googleSignIn }) {
  return (
    <div className="signin-container">
      <h1 className="web-title">Chatterzz Ph</h1>

      <div>
        <button onClick={googleSignIn} className="login">
          Sign In with Google
          <FcGoogle className="icon" />
        </button>
      </div>
    </div>
  );
}

export default Login;
