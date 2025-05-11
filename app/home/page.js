"use client";
import { auth, db } from "@/config/firebase";
import { signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Home = () => {
  const { userId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [seen, setIsSeen] = useState(false);
  const [receiverId, setReceiverId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    setIsLoading(true);

    const chatRef = collection(db, "chats");
    const q = query(
      chatRef,
      where("participants", "array-contains", userId),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inboxMessages = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      const receiver = inboxMessages.map((item) =>
        item.participants.find((index) => index !== userId)
      );
      // console.log("receiver: ", ...receiver);
      setReceiverId(...receiver);
      setMessages(inboxMessages);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    const conversationId = [userId, receiverId].sort().join("_");

    const seenRef = collection(db, `chats/${conversationId}/seen`);
    const unsubscribe = onSnapshot(seenRef, (snapshot) => {
      let seenStatus = {};
      snapshot.docs.forEach((doc) => {
        seenStatus[doc.id] = doc.data().seen;
      });
      setIsSeen(seenStatus[receiverId] || false);
    });

    return () => unsubscribe();
  }, [receiverId, userId]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <span className="text-3xl text-center">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header />
      <UserInfoBar auth={auth} signOut={signOut} />
      <MessagesList
        messages={messages}
        userId={userId}
        seen={seen}
        router={router}
      />
      <BottomNavigation />
    </div>
  );
};

// Header component with title and action buttons
function Header() {
  return (
    <div className="bg-white shadow-sm p-4 flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-gray-800">Chats</h1>
      </div>
      <div className="flex items-center space-x-2">
        <ActionButton icon={<SearchIcon />} />
        <ActionButton icon={<MenuIcon />} />
      </div>
    </div>
  );
}

// User info bar with account details and logout button
function UserInfoBar({ auth, signOut }) {
  return (
    <div className="bg-white shadow-sm p-3 flex items-center justify-between border-b border-gray-200">
      <div className="flex items-center space-x-2">
        <Avatar
          initial={auth?.currentUser?.email?.charAt(0)?.toUpperCase()}
          bgColor="bg-blue-500"
        />
        <div className="text-sm text-gray-600 truncate max-w-xs">
          {auth?.currentUser?.email}
        </div>
      </div>
      <button
        onClick={async () => await signOut(auth)}
        className="px-3 py-1 text-sm text-white bg-blue-500 rounded-full hover:bg-blue-600 transition"
      >
        Logout
      </button>
    </div>
  );
}

// Message list component that handles empty state and message rendering
function MessagesList({ messages, userId, seen, router }) {
  if (messages.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="divide-y divide-gray-200">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            userId={userId}
            seen={seen}
            onClick={() => {
              const otherParticipant = message.participants.find(
                (index) => index !== userId
              );
              router.push(`/convo/${userId}/${otherParticipant}`);
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Individual message item component
function MessageItem({ message, userId, seen, onClick }) {
  const otherParticipant = message.participants.find(
    (index) => index !== userId
  );
  const isUnread = message.status === "unread";

  return (
    <div
      onClick={onClick}
      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
    >
      <div className="relative mr-3">
        <Avatar
          initial={otherParticipant.charAt(0).toUpperCase()}
          bgColor="bg-gray-300"
          textColor="text-gray-600"
        />
        {isUnread && <UnreadIndicator />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h3
            className={`text-sm font-medium ${
              isUnread ? "text-black" : "text-gray-700"
            }`}
          >
            {otherParticipant}
          </h3>
          <span className="text-xs text-gray-500">{message.datetime}</span>
        </div>
        <div className="flex items-center">
          <p
            className={`text-sm truncate ${
              isUnread ? "text-black font-medium" : "text-gray-500"
            }`}
          >
            {message.lastMessage}
          </p>
          {seen && <SeenIndicator />}
        </div>
      </div>
    </div>
  );
}

// Empty state component
function EmptyState() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <MessagesIcon large />
        <p className="mt-2 text-center">No messages available</p>
        <p className="text-sm">Start a new conversation</p>
      </div>
    </div>
  );
}

// Bottom navigation component
function BottomNavigation() {
  return (
    <div className="bg-white border-t border-gray-200 flex justify-around py-3">
      <NavItem icon={<MessagesIcon />} label="Chats" active />
      <NavItem icon={<PeopleIcon />} label="People" />
      <NavItem icon={<StoriesIcon />} label="Stories" />
    </div>
  );
}

// Reusable avatar component
function Avatar({
  initial,
  bgColor = "bg-gray-300",
  textColor = "text-white",
  size = "h-12 w-12",
}) {
  return (
    <div
      className={`${size} rounded-full ${bgColor} flex items-center justify-center`}
    >
      <span className={`${textColor} font-medium`}>{initial}</span>
    </div>
  );
}

// Navigation item component
function NavItem({ icon, label, active = false }) {
  const textColor = active ? "text-blue-500" : "text-gray-400";

  return (
    <div className="flex flex-col items-center">
      <div className={textColor}>{icon}</div>
      <span
        className={`text-xs ${textColor} ${active ? "font-medium" : ""} mt-1`}
      >
        {label}
      </span>
    </div>
  );
}

// Unread indicator component
function UnreadIndicator() {
  return (
    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-blue-500 rounded-full border-2 border-white"></div>
  );
}

// Seen indicator component
function SeenIndicator() {
  return (
    <span className="ml-1 text-blue-500">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

// Action button component
function ActionButton({ icon, onClick }) {
  return (
    <div
      onClick={onClick}
      className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer"
    >
      {icon}
    </div>
  );
}

// Icon components
function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 text-gray-600"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 text-gray-600"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  );
}

function MessagesIcon({ large = false }) {
  const size = large ? "h-16 w-16 text-gray-300" : "h-6 w-6";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={size}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function StoriesIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

export default Home;
