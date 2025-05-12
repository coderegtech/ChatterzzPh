"use client";

import { auth, db } from "@/config/firebase";
import { createGlobalChat, fetchUserById } from "@/config/hooks";
import { useAuth } from "@/context/userContext";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import moment from "moment";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "../messages/page";

const GroupChats = () => {
  const [groupChats, setGroupChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const router = useRouter();
  const scrollRef = useRef(null);
  const { user } = useAuth();
  const senderId = auth.currentUser?.uid;

  const handleOnChange = async (e) => {
    const value = e.target.value;
    setNewMessage(value);
  };

  const scrollToBottom = () => {
    if (scrollRef?.current) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current?.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const chatRef = collection(db, `globalChats`);
    const q = query(chatRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      setGroupChats(chats);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [groupChats]);

  const handleSend = async (e) => {
    e.preventDefault();

    try {
      if (newMessage.trim() === "") return;

      await fetchUserById(senderId, async (data) => {
        const res = await createGlobalChat(
          senderId,
          data?.displayName,
          data?.photoURL,
          newMessage
        );
        console.log(res);
      });

      setNewMessage("");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-indigo-900 to-black">
      {/* Header */}
      <div className="bg-black bg-opacity-40 backdrop-blur-lg p-4 flex items-center border-b border-indigo-900/30">
        <div className="flex items-center space-x-3">
          <div onClick={() => router.back()} className="cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              id="Outline"
              viewBox="0 0 24 24"
              width="35"
              height="35"
              fill="url(#blue-cyan-gradient)"
            >
              <defs>
                <linearGradient
                  id="blue-cyan-gradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <path d="M19,11H9l3.29-3.29a1,1,0,0,0,0-1.42,1,1,0,0,0-1.41,0l-4.29,4.3A2,2,0,0,0,6,12H6a2,2,0,0,0,.59,1.4l4.29,4.3a1,1,0,1,0,1.41-1.42L9,13H19a1,1,0,0,0,0-2Z" />
            </svg>
          </div>

          <h1 className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-lg">
            Global Chat
          </h1>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        id="scroll-smooth"
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {groupChats.map((msg) => {
          const isMe = msg.senderId === senderId;

          return (
            <div
              key={msg.id}
              className={`flex relative gap-x-2 items-start ${
                isMe ? "justify-end" : "justify-start"
              }`}
            >
              {!isMe && (
                <div className="mt-1">
                  <Avatar photoURL={msg.senderPhoto} size={15} />
                </div>
              )}

              <div>
                <p
                  className={`text-xs mb-1 ${
                    isMe
                      ? "text-right text-cyan-200"
                      : "text-left text-gray-300"
                  }`}
                >
                  {msg.senderName}
                </p>

                <div
                  className={`max-w-xs md:max-w-md ${
                    isMe
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl rounded-tr-none shadow-lg shadow-blue-500/20"
                      : "bg-black bg-opacity-40 backdrop-blur-sm text-white border border-indigo-900/30 rounded-xl rounded-tl-none"
                  } px-4 py-2`}
                >
                  <p className="text-sm">{msg.message}</p>
                </div>

                <span
                  className={`text-[11px] mt-1 block ${
                    isMe
                      ? "text-right text-cyan-200"
                      : "text-left text-gray-400"
                  }`}
                >
                  {moment(msg.createdAt).fromNow()}
                </span>
              </div>

              {isMe && (
                <div className="mt-1">
                  <Avatar photoURL={msg.senderPhoto} size={15} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Message Input */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-black bg-opacity-30 backdrop-blur-lg border-t border-indigo-900/30">
        <form
          onSubmit={handleSend}
          className="flex items-center bg-black bg-opacity-40 backdrop-blur-sm rounded-full px-4 py-2 border border-indigo-900/30"
        >
          <input
            type="text"
            value={newMessage}
            onChange={handleOnChange}
            placeholder="Type a message"
            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder-gray-400"
          />
          <button
            type="submit"
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className={`p-2 rounded-full rotate-90 ${
              newMessage.trim()
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-blue-500/20"
                : "bg-gray-700 text-gray-500"
            } transition-all duration-300`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default GroupChats;
