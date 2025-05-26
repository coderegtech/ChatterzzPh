"use client";

import { useToast } from "@/components/Toastify";
import {
  AnonymousSignin,
  FacebookAuth,
  GitHubAuth,
  GoogleAuth,
  loginUser,
} from "@/config/hooks";
import Link from "next/link";
import { useState } from "react";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!email || !password) return;

      const res = await loginUser(email, password);

      if (res?.error.code === "auth/invalid-credential") {
        toast("error", "Invalid credential!");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setSubmitting(false);
      clearInputs();
    }
  };

  const clearInputs = () => {
    setEmail("");
    setPassword("");
  };

  const handleAuthLogin = async (type) => {
    try {
      let res = null;

      if (type === "google") {
        res = await GoogleAuth();
      } else if (type === "facebook") {
        res = await FacebookAuth();
      } else if (type === "github") {
        res = await GitHubAuth();
      } else if (type === "anonymous") {
        res = await AnonymousSignin();
      }

      if (res?.error.code === "auth/account-exists-with-different-credential") {
        toast("error", "Account exists with different credentials");
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="bg-white min-h-screen flex items-center justify-start">
      <div className="bg-white w-full p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-gray-500">Sign in to continue to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-black"
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-black"
              placeholder="Enter your password"
            />

            <div className="absolute right-3 top-2/3 -translate-y-1/2 cursor-pointer">
              <span onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <IoMdEye size="30" color="#ddd" />
                ) : (
                  <IoMdEyeOff size="30" />
                )}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
          >
            {submitting ? "processing..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?
          <Link
            href="/signup"
            className="pl-2 text-blue-600 hover:text-blue-500 font-semibold"
          >
            Sign up
          </Link>
        </p>

        <div className="flex items-center py-4">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-4 text-gray-400 text-sm">OR</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        <div className="flex flex-col space-y-4 mb-8">
          <button
            onClick={() => handleAuthLogin("anonymous")}
            className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 px-4 rounded-lg transition-all duration-200"
          >
            <svg
              width="20px"
              height="20px"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4.6138 8.54479L4.1875 10.25H2C1.58579 10.25 1.25 10.5858 1.25 11C1.25 11.4142 1.58579 11.75 2 11.75H22C22.4142 11.75 22.75 11.4142 22.75 11C22.75 10.5858 22.4142 10.25 22 10.25H19.8125L19.3862 8.54479C18.8405 6.36211 18.5677 5.27077 17.7539 4.63538C16.9401 4 15.8152 4 13.5653 4H10.4347C8.1848 4 7.05988 4 6.24609 4.63538C5.43231 5.27077 5.15947 6.36211 4.6138 8.54479ZM6.5 21C8.12316 21 9.48826 19.8951 9.88417 18.3963L10.9938 17.8415C11.6272 17.5248 12.3728 17.5248 13.0062 17.8415L14.1158 18.3963C14.5117 19.8951 15.8768 21 17.5 21C19.433 21 21 19.433 21 17.5C21 15.567 19.433 14 17.5 14C15.8399 14 14.4498 15.1558 14.0903 16.7065L13.6771 16.4999C12.6213 15.972 11.3787 15.972 10.3229 16.4999L9.90967 16.7065C9.55023 15.1558 8.16009 14 6.5 14C4.567 14 3 15.567 3 17.5C3 19.433 4.567 21 6.5 21Z"
                fill="#1C274C"
              />
            </svg>
            Signin as Anonymous
          </button>

          <button
            onClick={() => handleAuthLogin("google")}
            className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 px-4 rounded-lg transition-all duration-200"
          >
            <svg
              width="20px"
              height="20px"
              viewBox="-0.5 0 48 48"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Google-color</title>
              <desc>Created with Sketch.</desc>
              <defs></defs>
              <g
                id="Icons"
                stroke="none"
                strokeWidth="1"
                fill="none"
                fillRule="evenodd"
              >
                <g id="Color-" transform="translate(-401.000000, -860.000000)">
                  <g id="Google" transform="translate(401.000000, 860.000000)">
                    <path
                      d="M9.82727273,24 C9.82727273,22.4757333 10.0804318,21.0144 10.5322727,19.6437333 L2.62345455,13.6042667 C1.08206818,16.7338667 0.213636364,20.2602667 0.213636364,24 C0.213636364,27.7365333 1.081,31.2608 2.62025,34.3882667 L10.5247955,28.3370667 C10.0772273,26.9728 9.82727273,25.5168 9.82727273,24"
                      id="Fill-1"
                      fill="#FBBC05"
                    ></path>
                    <path
                      d="M23.7136364,10.1333333 C27.025,10.1333333 30.0159091,11.3066667 32.3659091,13.2266667 L39.2022727,6.4 C35.0363636,2.77333333 29.6954545,0.533333333 23.7136364,0.533333333 C14.4268636,0.533333333 6.44540909,5.84426667 2.62345455,13.6042667 L10.5322727,19.6437333 C12.3545909,14.112 17.5491591,10.1333333 23.7136364,10.1333333"
                      id="Fill-2"
                      fill="#EB4335"
                    ></path>
                    <path
                      d="M23.7136364,37.8666667 C17.5491591,37.8666667 12.3545909,33.888 10.5322727,28.3562667 L2.62345455,34.3946667 C6.44540909,42.1557333 14.4268636,47.4666667 23.7136364,47.4666667 C29.4455,47.4666667 34.9177955,45.4314667 39.0249545,41.6181333 L31.5177727,35.8144 C29.3995682,37.1488 26.7323182,37.8666667 23.7136364,37.8666667"
                      id="Fill-3"
                      fill="#34A853"
                    ></path>
                    <path
                      d="M46.1454545,24 C46.1454545,22.6133333 45.9318182,21.12 45.6113636,19.7333333 L23.7136364,19.7333333 L23.7136364,28.8 L36.3181818,28.8 C35.6879545,31.8912 33.9724545,34.2677333 31.5177727,35.8144 L39.0249545,41.6181333 C43.3393409,37.6138667 46.1454545,31.6490667 46.1454545,24"
                      id="Fill-4"
                      fill="#4285F4"
                    ></path>
                  </g>
                </g>
              </g>
            </svg>
            Continue with Google
          </button>

          <button
            onClick={() => handleAuthLogin("facebook")}
            className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 px-4 rounded-lg transition-all duration-200"
          >
            <svg
              width="20px"
              height="20px"
              viewBox="0 0 16 16"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
            >
              <path
                fill="#1877F2"
                d="M15 8a7 7 0 00-7-7 7 7 0 00-1.094 13.915v-4.892H5.13V8h1.777V6.458c0-1.754 1.045-2.724 2.644-2.724.766 0 1.567.137 1.567.137v1.723h-.883c-.87 0-1.14.54-1.14 1.093V8h1.941l-.31 2.023H9.094v4.892A7.001 7.001 0 0015 8z"
              />
              <path
                fill="#ffffff"
                d="M10.725 10.023L11.035 8H9.094V6.687c0-.553.27-1.093 1.14-1.093h.883V3.87s-.801-.137-1.567-.137c-1.6 0-2.644.97-2.644 2.724V8H5.13v2.023h1.777v4.892a7.037 7.037 0 002.188 0v-4.892h1.63z"
              />
            </svg>
            Continue with Facebook
          </button>

          {/* <button
            onClick={() => handleAuthLogin("github")}
            className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 px-4 rounded-lg transition-all duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            Continue with GitHub
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
