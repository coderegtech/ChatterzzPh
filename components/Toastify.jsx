"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((status, msg) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, status, msg }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className=" fixed bottom-6 left-8 right-8  z-[100] space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={[
                toast.status === "success"
                  ? " bg-green-500"
                  : toast.status === "error"
                  ? "bg-red-500"
                  : "bg-gray-100",
                "flex items-center gap-4  p-4 rounded-md shadow-xl",
              ].join(" ")}
            >
              {/* <ToastIcon status={toast.status} /> */}
              <p className="text-base font-medium text-center">{toast.msg}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.toast;
};

const ToastIcon = ({ status }) => {
  if (status === "success") {
    return (
      <div className="bg-green-200 p-2 rounded-xl">
        <div className="bg-green-500 p-2 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={15}
            height={15}
            fill="white"
            viewBox="0 0 24 24"
          >
            <path d="M22.319 4.431 8.5 18.249a1 1 0 0 1-1.417 0L1.739 12.9a1 1 0 0 0-1.417 0 1 1 0 0 0 0 1.417l5.346 5.345a3.008 3.008 0 0 0 4.25 0L23.736 5.847a1 1 0 0 0 0-1.416 1 1 0 0 0-1.417 0Z" />
          </svg>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="bg-red-200 p-2 rounded-xl">
        <div className="bg-red-500 p-2 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="white"
          >
            <path
              fill="#ef4444"
              d="M12 0a12 12 0 1 0 12 12A12.013 12.013 0 0 0 12 0Zm0 22a10 10 0 1 1 10-10 10.011 10.011 0 0 1-10 10Z"
            />
            <path d="M12 5a1 1 0 0 0-1 1v8a1 1 0 0 0 2 0V6a1 1 0 0 0-1-1Z" />
            <rect width="2" height="2" x="11" y="17" rx="1" />
          </svg>
        </div>
      </div>
    );
  }

  // Add more status icons as needed
  return null;
};
