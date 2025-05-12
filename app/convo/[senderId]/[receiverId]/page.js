"use client";
import { Avatar } from "@/app/messages/page";
import { useToast } from "@/components/Toastify";
import { db } from "@/config/firebase";
import { DeleteChat, fetchUserById } from "@/config/hooks";
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

  const router = useRouter();

  const handleOnChange = async (e) => {
    const value = e.target.value;
    setNewMessage(value);

    await updateTypingStatus(value !== "");
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
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

      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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
      let seenStatus = {};
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
    <div className="flex flex-col h-screen bg-gradient-to-b from-indigo-900 to-black ">
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
                  } px-4 py-2`}
                >
                  <p className="text-sm">{msg.content}</p>
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
    </div>
  );
};

const SideMenu = ({ open, close, photoURL, isOnline, name, convoId }) => {
  const toast = useToast();
  const router = useRouter();

  const handleDeleteConvo = async () => {
    await DeleteChat(convoId);
    toast("success", "Message successfully removed!");
    router.push("/messages");
  };

  return (
    <div
      className={`absolute max-w-80 w-full h-full top-0 z-[100] p-6 
      bg-gradient-to-b from-indigo-900 to-black 
      transition-all duration-300 ease-in-out 
      ${open ? "right-0" : "-right-full"}`}
    >
      <header className="w-full flex justify-end">
        <div onClick={close}>
          <CloseIcon size={"30"} />
        </div>
      </header>

      <div className="py-4 flex flex-col justify-center gap-y-2 items-center">
        <Avatar photoURL={photoURL} size={"80"} isOnline={isOnline} />
        <p className="text-lg">{name}</p>
      </div>

      <div className="py-4">
        <ul>
          <li
            onClick={handleDeleteConvo}
            className="border-b border-white/5 p-2 hover:bg-white/5 cursor-pointer
            flex items-center gap-x-2"
          >
            <span>
              <svg
                version="1.1"
                id="Capa_1"
                x="0px"
                y="0px"
                viewBox="0 0 512 512"
                width="20"
                height="20"
                fill="#ef4444"
              >
                <g>
                  <path d="M448,85.333h-66.133C371.66,35.703,328.002,0.064,277.333,0h-42.667c-50.669,0.064-94.327,35.703-104.533,85.333H64   c-11.782,0-21.333,9.551-21.333,21.333S52.218,128,64,128h21.333v277.333C85.404,464.214,133.119,511.93,192,512h128   c58.881-0.07,106.596-47.786,106.667-106.667V128H448c11.782,0,21.333-9.551,21.333-21.333S459.782,85.333,448,85.333z    M234.667,362.667c0,11.782-9.551,21.333-21.333,21.333C201.551,384,192,374.449,192,362.667v-128   c0-11.782,9.551-21.333,21.333-21.333c11.782,0,21.333,9.551,21.333,21.333V362.667z M320,362.667   c0,11.782-9.551,21.333-21.333,21.333c-11.782,0-21.333-9.551-21.333-21.333v-128c0-11.782,9.551-21.333,21.333-21.333   c11.782,0,21.333,9.551,21.333,21.333V362.667z M174.315,85.333c9.074-25.551,33.238-42.634,60.352-42.667h42.667   c27.114,0.033,51.278,17.116,60.352,42.667H174.315z" />
                </g>
              </svg>
            </span>

            <p className="text-base text-red-500">Delete chat </p>
          </li>
        </ul>
      </div>
    </div>
  );
};

const CloseIcon = ({ size }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      id="Outline"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="white"
    >
      <path d="M18,6h0a1,1,0,0,0-1.414,0L12,10.586,7.414,6A1,1,0,0,0,6,6H6A1,1,0,0,0,6,7.414L10.586,12,6,16.586A1,1,0,0,0,6,18H6a1,1,0,0,0,1.414,0L12,13.414,16.586,18A1,1,0,0,0,18,18h0a1,1,0,0,0,0-1.414L13.414,12,18,7.414A1,1,0,0,0,18,6Z" />
    </svg>
  );
};

const MenuDotsIcon = ({ size }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      id="Outline"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="white"
    >
      <circle cx="2" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="22" cy="12" r="2" />
    </svg>
  );
};
export default Conversation;
