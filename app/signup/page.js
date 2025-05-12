"use client";

import { createUser } from "@/config/hooks";
import { useState } from "react";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { toast } from "react-toastify";
const SignupScreen = () => {
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // const handleProfileChange = (event) => {
  //   const file = event.target.files[0];
  //   if (file) {
  //     setProfile(URL.createObjectURL(file));
  //   }
  // };

  const handleSubmitAccount = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!username || !email || !password) return;

      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      const data = {
        username,
        email,
        password,
      };

      const res = await createUser(data);

      if (res?.error.code === "auth/email-already-in-use") {
        toast.error("Email is already exist!");
      }
    } catch (e) {
      console.log(e);
    } finally {
      setSubmitting(false);
      clearInputs();
    }
  };

  const clearInputs = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="bg-white h-full flex items-center justify-center">
      <div className="bg-white w-full p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create an Account
          </h1>
          <p className="text-gray-500">Sign up to get started</p>
        </div>

        {/* <div className="flex flex-col items-center mb-6">
          <label className="relative cursor-pointer group">
            <input
              type="file"
              className="hidden"
              onChange={handleProfileChange}
            />
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center relative overflow-hidden border-4 border-white shadow-lg transition-transform transform group-hover:scale-105">
              {profile ? (
                <Image
                  src={profile}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <svg
                  className="w-10 h-10 text-white opacity-75 group-hover:opacity-100 transition-opacity"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 12h14m-7-7v14"
                  />
                </svg>
              )}
            </div>
          </label>
          <p className="mt-2 text-sm text-gray-500">Upload Profile Picture</p>
        </div> */}

        <form onSubmit={handleSubmitAccount} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-black"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-black"
              placeholder="Enter your email"
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

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-black"
              placeholder="Confirm your password"
            />

            <div className="absolute right-3 top-2/3 -translate-y-1/2 cursor-pointer">
              <span
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
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
            {submitting ? "creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?
          <a
            href="/login"
            className="pl-2 text-blue-600 hover:text-blue-500 font-semibold"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignupScreen;
