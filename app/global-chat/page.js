"use client";

import { auth, db } from "@/config/firebase";
import { createGlobalChat, fetchUserById } from "@/config/hooks";
import { useAuth } from "@/context/userContext";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import moment from "moment";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FullScreenImage } from "../convo/[senderId]/[receiverId]/page";
import { Avatar } from "../messages/page";

const GroupChats = () => {
  const [groupChats, setGroupChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const router = useRouter();
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const senderId = auth.currentUser?.uid;
  const [uploading, setUploading] = useState(false);
  const previousMessageCount = useRef(0);

  const [isFullScreen, setFullscreen] = useState({
    isFull: false,
    image: null,
  });

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

  const showNotification = (senderName, messageContent, messageType) => {
    if ("Notification" in window && Notification.permission === "granted") {
      const body =
        messageType === "image" ? "📷 Sent an image" : messageContent;

      const notification = new Notification(`${senderName} in Global Chat`, {
        body: body,
        icon: "/placeholder-logo.png",
        badge: "/placeholder-logo.png",
        tag: "global-chat-notification",
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 5000);
    }
  };

  useEffect(() => {
    const chatRef = collection(db, `globalChats`);
    const q = query(chatRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chats = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      if (
        previousMessageCount.current > 0 &&
        chats.length > previousMessageCount.current
      ) {
        const newMsg = chats[chats.length - 1];
        if (newMsg.senderId !== senderId) {
          showNotification(
            newMsg.senderName || "Someone",
            newMsg.message,
            newMsg.msgType
          );
        }
      }
      previousMessageCount.current = chats.length;

      setGroupChats(chats);
    });

    return () => unsubscribe();
  }, [user, senderId]);

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
          "text",
          newMessage
        );
        console.log(res);
      });

      setNewMessage("");
    } catch (error) {
      console.log(error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        await fetchUserById(senderId, async (userData) => {
          const res = await createGlobalChat(
            senderId,
            userData?.displayName,
            userData?.photoURL,
            "image",
            data.imageUrl
          );
          console.log(res);
        });
      } else {
        alert(data.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative flex flex-col h-screen bg-gradient-to-b from-indigo-900 to-black">
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
                  } ${
                    msg.messageType === "image"
                      ? "bg-none shadow-none backdrop-blur-none border-none p-0"
                      : "px-4 py-2"
                  }`}
                >
                  {msg.messageType === "image" ? (
                    <div
                      onClick={() =>
                        setFullscreen({ isFull: true, image: msg.message })
                      }
                      className="relative max-w-56 w-36 h-40 p-0"
                    >
                      <Image
                        src={msg.message || "/placeholder.svg"}
                        alt={msg.message}
                        fill
                        priority
                        className="object-contain rounded-xl overflow-hidden"
                      />
                    </div>
                  ) : (
                    <p className="text-sm">{msg.message}</p>
                  )}
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

      <div className="fixed bottom-0 left-0 w-full p-4 bg-black bg-opacity-30 backdrop-blur-lg border-t border-indigo-900/30">
        <form className="flex items-center bg-black bg-opacity-40 backdrop-blur-sm rounded-xl px-4 py-2 border border-indigo-900/30">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <input
            type="text"
            value={newMessage}
            onChange={handleOnChange}
            placeholder="Type a message"
            className="flex-1 h-full bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder-gray-400"
          />

          <div className="flex gap-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg
                  width="25px"
                  height="25px"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 12.5001L3.75159 10.9675C4.66286 10.1702 6.03628 10.2159 6.89249 11.0721L11.1822 15.3618C11.8694 16.0491 12.9512 16.1428 13.7464 15.5839L14.0446 15.3744C15.1888 14.5702 16.7369 14.6634 17.7765 15.599L21 18.5001"
                    stroke="#06b6d4"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M15 5.5H18.5M18.5 5.5H22M18.5 5.5V9M18.5 5.5V2"
                    stroke="#06b6d4"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12C2 10.8717 2 9.87835 2.02008 9M12 2C7.28595 2 4.92893 2 3.46447 3.46447C3.03965 3.88929 2.73806 4.38921 2.52396 5"
                    stroke="#06b6d4"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>

            <button
              type="submit"
              onClick={handleSend}
              disabled={!newMessage.trim()}
              className={`p-2 rounded-lg rotate-90 ${
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
          </div>
        </form>
      </div>

      {isFullScreen?.isFull && (
        <FullScreenImage
          image={isFullScreen.image}
          close={() => setFullscreen({ isFull: false, image: null })}
        />
      )}
    </div>
  );
};

export default GroupChats;
