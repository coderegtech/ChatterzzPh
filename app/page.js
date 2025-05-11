"use client";

import { useAuth } from "@/context/userContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MessagesIcon } from "./messages/page";

const MainPage = () => {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.uid || user?.accessToken) {
      router.push("/messages");
    }
  }, [router, user?.accessToken, user?.uid]);

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-b from-indigo-900 to-black">
      <div>
        <MessagesIcon extraSize />
      </div>
    </div>
  );
};

export default MainPage;
