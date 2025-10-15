"use client";
import { Avatar } from "@/app/messages/page";
import { CloseIcon, MenuDotsIcon } from "@/components/Icons";
import { SideMenu } from "@/components/SideMenu";
import { db } from "@/config/firebase";
import { fetchUserById } from "@/config/hooks";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import moment from "moment";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const Conversation = () => {
  const { senderId, receiverId } = useParams();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typing, setIsTyping] = useState({ id: 0, active: false });
  const [seen, setIsSeen] = useState(false);
  const scrollRef = useRef(null);
  const conversationId = [senderId, receiverId].sort().join("_");
  const [msgId, setMsgId] = useState(null);
  const [receiverInfo, setReceiverInfo] = useState(null);
  const [activeSideMenu, setActiveSideMenu] = useState(false);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const previousMessageCount = useRef(0);

  const [isFullScreen, setFullscreen] = useState({
    isFull: false,
    image: null,
  });

  const router = useRouter();

  const scrollToBottom = () => {
    if (scrollRef?.current) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current?.scrollHeight,
        behavior: "smooth",
      });

      // Update seen status
      updateSeenStatus();
      setIsSeen(true);
    }
  };

  const handleOnChange = async (e) => {
    const value = e.target.value;
    setNewMessage(value);

    scrollToBottom();
    await updateTypingStatus(value !== "");
  };

  const showNotification = (senderName, messageContent, messageType) => {
    if ("Notification" in window && Notification.permission === "granted") {
      const body =
        messageType === "image" ? "📷 Sent an image" : messageContent;

      const notification = new Notification(`New message from ${senderName}`, {
        body: body,
        icon: "/placeholder-logo.png",
        badge: "/placeholder-logo.png",
        tag: "message-notification",
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }
  };

  useEffect(() => {
    const messagesRef = collection(db, `chats/${conversationId}/messages`);
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMsgId(
        msgs.map((msg) => ({
          id: msg.id,
          receiverId: msg.receiverId,
        }))
      );

      if (
        previousMessageCount.current > 0 &&
        msgs.length > previousMessageCount.current
      ) {
        const newMsg = msgs[msgs.length - 1];
        if (newMsg.senderId === receiverId) {
          showNotification(
            receiverInfo?.displayName || "Someone",
            newMsg.content,
            newMsg.type
          );
        }
      }
      previousMessageCount.current = msgs.length;

      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [conversationId, receiverId, receiverInfo]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const typingRef = collection(db, `chats/${conversationId}/typing`);
    const unsubscribe = onSnapshot(typingRef, (snapshot) => {
      const typingStatus = {};

      snapshot.docs.forEach((doc) => {
        typingStatus[doc.id] = doc.data().isTyping;
      });

      setIsTyping({
        id: Object.keys(typingStatus).find((key) => typingStatus[key] === true),
        active: typingStatus[senderId],
      });
    });

    return () => unsubscribe();
  }, [senderId, receiverId, conversationId]);

  useEffect(() => {
    const seenRef = collection(db, `chats/${conversationId}/seen`);
    const unsubscribe = onSnapshot(seenRef, (snapshot) => {
      const seenStatus = {};
      snapshot.docs.forEach((doc) => {
        seenStatus[doc.id] = doc.data().seen;
      });
      setIsSeen(seenStatus[receiverId] || false);
    });

    return () => unsubscribe();
  }, [conversationId, receiverId, senderId]);

  // update typing
  const updateTypingStatus = async (status) => {
    setIsTyping({ active: status });

    const typingRef = doc(db, `chats/${conversationId}/typing`, senderId);
    await setDoc(typingRef, { isTyping: status });
  };

  // update typing
  const updateSeenStatus = async () => {
    try {
      console.log("msgId", msgId);
      for (const msg of msgId) {
        const seenRef = doc(db, `chats/${conversationId}/messages`, msg.id);
        onSnapshot(seenRef, async (snapshot) => {
          if (snapshot.exists() && snapshot.data().receiverId !== receiverId) {
            await updateDoc(seenRef, { seen: true });
          }
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();

    try {
      if (newMessage.trim() === "") return;

      const messageData = {
        senderId,
        receiverId,
        content: newMessage,
        type: "text",
        datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
        seen: false,
        timestamp: serverTimestamp(),
      };

      const messagesRef = collection(db, `chats/${conversationId}/messages`);
      const messageDoc = await addDoc(messagesRef, messageData);
      const lastMessageId = messageDoc.id; // Extract the message ID

      const conversationRef = doc(db, "chats", conversationId);
      const inboxData = {
        participants: [senderId, receiverId],
        lastMessage: newMessage,
        lastMessageId: lastMessageId,
        lastSenderId: senderId,
        status: "active",
        session: 86400,
        datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
        timestamp: serverTimestamp(),
      };

      await setDoc(conversationRef, inboxData, { merge: true });

      // dissable the typing component
      setIsTyping({ id: 0, active: false });
      scrollToBottom();
      await updateTypingStatus(false);

      // clear input
      setNewMessage("");
    } catch (error) {
      console.log(error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB.");
      return;
    }

    setUploading(true);

    try {
      // Upload to server
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Send image message
        await sendImageMessage(data.imageUrl);
      } else {
        alert(data.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const sendImageMessage = async (imageUrl) => {
    try {
      const messageData = {
        senderId,
        receiverId,
        content: imageUrl,
        type: "image",
        datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
        seen: false,
        timestamp: serverTimestamp(),
      };

      const messagesRef = collection(db, `chats/${conversationId}/messages`);
      const messageDoc = await addDoc(messagesRef, messageData);
      const lastMessageId = messageDoc.id;

      const conversationRef = doc(db, "chats", conversationId);
      const inboxData = {
        participants: [senderId, receiverId],
        lastMessage: "📷 Image",
        lastMessageId: lastMessageId,
        lastSenderId: senderId,
        status: "active",
        session: 86400,
        datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
        timestamp: serverTimestamp(),
      };

      await setDoc(conversationRef, inboxData, { merge: true });
      scrollToBottom();
    } catch (error) {
      console.error("Error sending image:", error);
    }
  };

  useEffect(() => {
    const loadReceiverInfo = async () => {
      try {
        await fetchUserById(receiverId, (data) => {
          console.log("receiver info: ", data);
          setReceiverInfo(data);
        });
      } catch (e) {
        console.log(e);
      }
    };

    loadReceiverInfo();
  }, [receiverId]);

  return (
    <div className="relative flex flex-col h-screen bg-gradient-to-b from-indigo-900 to-black ">
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

          <Avatar
            isOnline={receiverInfo?.status}
            photoURL={receiverInfo?.photoURL}
            size={30}
          />

          <div className="flex-1 w-full">
            <h2 className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              {receiverInfo?.displayName}
            </h2>
            {typing.id === receiverId && (
              <p className="text-xs text-cyan-500">typing...</p>
            )}
          </div>

          <div
            onClick={() => setActiveSideMenu(true)}
            className="absolute right-5 top-1/2 -translate-y-1/2 cursor-pointer hover:bg-white/20 hover:rounded-full p-1"
          >
            <MenuDotsIcon size="20" />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        id="scroll-smooth"
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg) => {
          const isMe = msg.senderId === senderId;

          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div>
                <div
                  className={`max-w-xs md:max-w-md ${
                    isMe
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl rounded-tr-none shadow-lg shadow-blue-500/20"
                      : "bg-black bg-opacity-40 backdrop-blur-sm text-white border border-indigo-900/30 rounded-xl rounded-tl-none"
                  } ${
                    msg.type === "image"
                      ? "bg-none shadow-none backdrop-blur-none border-none p-0"
                      : "px-4 py-2"
                  }`}
                >
                  {msg.type === "image" ? (
                    <div
                      onClick={() =>
                        setFullscreen({ isFull: true, image: msg.content })
                      }
                      className="relative max-w-56 w-36 h-40 p-0"
                    >
                      <Image
                        src={msg.content || "/placeholder.svg"}
                        alt={msg.content}
                        fill
                        priority
                        className="object-contain rounded-xl overflow-hidden"
                      />
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>

                <div
                  className={`flex ${
                    isMe ? "justify-end" : "justify-start"
                  } items-center mt-1 space-x-1 text-xs ${
                    isMe
                      ? "text-right text-cyan-200"
                      : "text-left text-gray-400"
                  }`}
                >
                  <span className="text-[11px] text-gray-400">
                    {moment(msg.datetime).fromNow()}
                  </span>
                  {isMe && msg.seen && <span className="text-cyan-400">✓</span>}
                </div>
              </div>
            </div>
          );
        })}

        {typing.id === receiverId && (
          <div className="flex justify-start">
            <div className="bg-black bg-opacity-40 backdrop-blur-sm text-white border border-indigo-900/30 rounded-2xl rounded-tl-none px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-black bg-opacity-30 backdrop-blur-lg border-t border-indigo-900/30 z-50">
        <form
          onSubmit={handleSend}
          className="flex items-center bg-black bg-opacity-40 backdrop-blur-sm rounded-xl px-4 py-2 border border-indigo-900/30"
        >
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
            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder-gray-400"
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
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0,0,0,1.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {activeSideMenu && (
        <SideMenu
          open={activeSideMenu}
          close={() => setActiveSideMenu(false)}
          photoURL={receiverInfo?.photoURL}
          isOnline={receiverInfo?.status}
          name={receiverInfo?.displayName}
          convoId={conversationId}
        />
      )}

      {isFullScreen?.isFull && (
        <FullScreenImage
          image={isFullScreen.image}
          close={() => setFullscreen({ isFull: false, image: null })}
        />
      )}
    </div>
  );
};

export const FullScreenImage = ({ image, close }) => {
  return (
    <div className="absolute inset-0 p-4  bg-black">
      <div
        onClick={close}
        className="absolute right-4 top-4 bg-neutral-500/30 z-50"
      >
        <CloseIcon size={"30"} />
      </div>

      <div className=" p-4">
        <Image
          src={image || "/placeholder.svg"}
          alt={image}
          fill
          priority
          className="object-contain rounded-xl overflow-hidden"
        />
      </div>
    </div>
  );
};

export default Conversation;
