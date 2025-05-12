"use client";

import { MessagesIcon } from "./messages/page";

const Loading = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-indigo-900 to-black">
      <MessagesIcon extraSize />
      <svg id="loading" viewBox="25 25 50 50" width="60" height="60">
        <circle r="20" cy="50" cx="50"></circle>
      </svg>
    </div>
  );
};

export default Loading;
