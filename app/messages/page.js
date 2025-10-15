"use client";
import NotificationManager from "@/components/NotificationManager";
import { useToast } from "@/components/Toastify";
import { auth, db } from "@/config/firebase";
import { fetchUserById, logoutUser } from "@/config/hooks";
import { useAuth } from "@/context/userContext";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import moment from "moment";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Loading from "../loading";

const Messages = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [seen, setIsSeen] = useState(false);
  const [receiverId, setReceiverId] = useState(null);
  const router = useRouter();
  const { user, setUser } = useAuth();
  const toast = useToast();
  const senderId = user?.uid || "something";
  const previousMessagesRef = useRef({});

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
    if (!senderId) return;

    setIsLoading(true);

    const chatRef = collection(db, "chats");
    const q = query(
      chatRef,
      where("participants", "array-contains", senderId),
      where("status", "!=", "inactive"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const inboxMessages = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        inboxMessages.forEach((message) => {
          const previousMessage = previousMessagesRef.current[message.id];

          if (
            previousMessage &&
            previousMessage.lastMessage !== message.lastMessage &&
            message.lastSenderId &&
            message.lastSenderId !== senderId
          ) {
            const nagSendId = message.participants.find((p) => p !== senderId);

            fetchUserById(nagSendId, (senderName) => {
              if (senderName?.displayName) {
                showNotification(senderName?.displayName, message.lastMessage);
              }

              showNotification("Someone", "New Message");
            });
          }
        });

        const messagesMap = {};
        inboxMessages.forEach((msg) => {
          messagesMap[msg.id] = {
            lastMessage: msg.lastMessage,
            lastSenderId: msg.lastSenderId,
          };
        });
        previousMessagesRef.current = messagesMap;

        const receivers = inboxMessages.map((item) =>
          item.participants.find((id) => id !== senderId)
        );

        console.log("Receivers: ", receivers);
        setReceiverId(receivers); // or setReceiverId(receivers[0]) if only one expected
        setMessages(inboxMessages);
        setIsLoading(false);
      },
      (error) => {
        console.log("Error fetching chats:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [senderId, user?.uid]);

  useEffect(() => {
    const conversationId = [senderId, receiverId].sort().join("_");

    const seenRef = collection(db, `chats/${conversationId}/seen`);
    const unsubscribe = onSnapshot(seenRef, (snapshot) => {
      let seenStatus = {};
      snapshot.docs.forEach((doc) => {
        seenStatus[doc.id] = doc.data().seen;
      });
      setIsSeen(seenStatus[receiverId] || false);
    });

    return () => unsubscribe();
  }, [receiverId, senderId]);

  useEffect(() => {
    const userRef = doc(db, "users", senderId);

    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUser((prev) => ({
          ...prev,
          ...snapshot.data(),
        }));
      }
    });

    return () => unsubscribe();
  }, [senderId, setUser]);

  if (isLoading) {
    return <Loading />;
  }

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      setUser(null);
      localStorage.removeItem("user");
      router.push("/login");

      toast("success", "User logged out!");
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-indigo-900 to-black relative">
      <NotificationManager />

      <Header router={router} />
      <UserInfoBar user={user} auth={auth} signOut={handleLogout} />
      <GlobalChatIndex />

      <MessagesList
        messages={messages}
        senderId={senderId}
        seen={seen}
        router={router}
      />
      <BottomNavigation userId={user?.uid} />
    </div>
  );
};

// Header component with title and action buttons
function Header({ router }) {
  return (
    <div className="bg-black bg-opacity-40 backdrop-blur-lg p-4 flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Messenger
        </h1>
      </div>
      <div
        onClick={() => router.push("/users")}
        className="flex items-center space-x-2"
      >
        <ActionButton icon={<SearchIcon />} />
      </div>
    </div>
  );
}

// User info bar with account details and logout button
function UserInfoBar({ user, auth, signOut }) {
  return (
    <div className="bg-black bg-opacity-30 backdrop-blur-sm p-3 flex items-center justify-between border-b border-indigo-900">
      <div className="flex items-center space-x-2">
        <Avatar photoURL={user?.photoURL} />
        <h2 className="text-lg text-white font-medium max-w-xs">
          {user?.displayName}
        </h2>
      </div>
      <button
        onClick={signOut}
        className="px-3 py-1 text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full hover:from-cyan-400 hover:to-blue-400 transition"
      >
        Logout
      </button>
    </div>
  );
}

// Message list component that handles empty state and message rendering
function MessagesList({ messages, senderId, seen, router }) {
  if (messages.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="divide-y divide-indigo-900/30">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            senderId={senderId}
            seen={seen}
            onClick={() => {
              const otherParticipant = message.participants.find(
                (index) => index !== senderId
              );
              router.push(`/convo/${senderId}/${otherParticipant}`);
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Individual message item component
function MessageItem({ message, senderId, seen, onClick }) {
  const [senderInfo, setSenderInfo] = useState(null);
  const isUnread = message.status === "unread";
  const isFromYou = message.lastSenderId === senderId;
  const isLong = message.lastMessage.length > 30;
  const preview = isLong
    ? message.lastMessage.substring(0, 30) + "..."
    : message.lastMessage;

  const displayMessage = isFromYou ? `You: ${preview}` : preview;

  const otherParticipantId = message.participants.find(
    (index) => index !== senderId
  );

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        await fetchUserById(otherParticipantId, (data) => {
          setSenderInfo(data);
        });
      } catch (e) {
        console.log(e);
      }
    };

    loadUserInfo();
  }, [otherParticipantId, senderId]);

  return (
    <div
      onClick={onClick}
      className="flex items-center p-3 hover:bg-black hover:bg-opacity-20 backdrop-blur-sm cursor-pointer transition duration-300"
    >
      <div className="relative mr-3">
        <Avatar
          isOnline={senderInfo?.status}
          photoURL={senderInfo?.photoURL}
          size={30}
        />
        {isUnread && <UnreadIndicator />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h3
            className={`text-base font-medium ${
              isUnread ? "text-cyan-400" : "text-gray-200"
            }`}
          >
            {senderInfo?.displayName}
          </h3>
          <span className="text-xs text-gray-400">
            {moment(message.datetime).fromNow()}
          </span>
        </div>
        <div className="flex items-center">
          <p
            className={`text-sm truncate ${
              isUnread ? "text-white font-medium" : "text-gray-400"
            }`}
          >
            {displayMessage}
          </p>
          {seen && <SeenIndicator />}
        </div>
      </div>
    </div>
  );
}

const GlobalChatIndex = () => {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push("/global-chat")}
      className="flex items-center p-3 hover:bg-black hover:bg-opacity-20 backdrop-blur-sm cursor-pointer transition duration-300 border-b border-white/5"
    >
      <div className="relative mr-3">
        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-white"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h3 className="text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Global Chat
          </h3>
        </div>
      </div>
    </div>
  );
};

// Empty state component
function EmptyState() {
  const router = useRouter();

  return (
    <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center">
      <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-800 to-black flex items-center justify-center">
        <MessagesIcon large />
      </div>
      <p className="mt-4 text-center text-white font-medium">
        No messages available
      </p>
      <p className="text-sm text-gray-400 mt-2">Start a new conversation</p>
      <button
        onClick={() => router.push("/users")}
        className="mt-6 px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full text-sm font-medium hover:from-cyan-400 hover:to-blue-400 transition"
      >
        Find Users
      </button>
    </div>
  );
}

// Bottom navigation component
export function BottomNavigation(userId) {
  const router = useRouter();
  const pathname = usePathname();

  const items = [
    {
      path: `/messages`,
      icon: <MessagesIcon />,
      label: "Chats",
    },
    {
      path: "/users",
      icon: <PeopleIcon />,
      label: "Users",
    },
    {
      path: "/",
      icon: <StoriesIcon />,
      label: "Posts",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-black backdrop-blur-lg border-t border-indigo-900/30 flex justify-around py-5">
      {items.map((item, index) => (
        <NavItem
          key={index}
          path={item.path}
          icon={item.icon}
          label={item.label}
          active={pathname === item.path}
          onClick={() => router.push(item.path)}
        />
      ))}
    </div>
  );
}

// Reusable avatar component
export function Avatar({ photoURL, size = 40, isOnline }) {
  return (
    <div
      className={`${size} ${
        isOnline === "online" ? "border-2 border-cyan-500 p-[1px]" : ""
      } rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-indigo-900`}
    >
      <Image
        src={
          photoURL ||
          "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fstatic.vecteezy.com%2Fsystem%2Fresources%2Fpreviews%2F013%2F317%2F294%2Foriginal%2Fincognito-icon-man-woman-face-with-glasses-black-and-white-graphic-spy-agent-line-and-glyph-icon-security-and-detective-hacker-sign-graphics-editable-stroke-linear-icon-free-vector.jpg&f=1&nofb=1&ipt=b94b7dea24b7bc4f9dcbca158723d626ae9bac7220954149c2bb42d805ed81f5"
        }
        alt="Avatar"
        width={size}
        height={size}
        className="rounded-full"
      />
    </div>
  );
}

// Navigation item component
function NavItem({ icon, label, path, active = false }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(path)}
      className={`flex flex-col items-center ${
        active ? "relative" : ""
      } cursor-pointer`}
    >
      <div className={`${active ? "text-cyan-400" : "text-gray-500"}`}>
        {icon}
      </div>
      <span
        className={`text-xs ${
          active ? "text-cyan-400 font-medium" : "text-gray-500"
        } mt-1`}
      >
        {label}
      </span>
      {active && (
        <div className="absolute -bottom-3 w-6 h-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"></div>
      )}
    </div>
  );
}

// Unread indicator component
function UnreadIndicator() {
  return (
    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full border-2 border-black"></div>
  );
}

// Seen indicator component
function SeenIndicator() {
  return (
    <span className="ml-1 text-cyan-500">
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
export function ActionButton({ icon, onClick }) {
  return (
    <div
      onClick={onClick}
      className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-800 to-indigo-900 hover:from-indigo-700 hover:to-indigo-800 flex items-center justify-center cursor-pointer transition"
    >
      {icon}
    </div>
  );
}

// Icon components
export function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 text-gray-300"
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
      className="h-5 w-5 text-gray-300"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  );
}

export function MessagesIcon({ large = false, extraSize = false }) {
  const size = large ? "h-16 w-16 text-cyan-200" : "h-6 w-6";
  const sizeLg = extraSize ? "h-24 w-24 text-cyan-200" : size;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={large ? size : extraSize ? sizeLg : size}
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

export default Messages;
