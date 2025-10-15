"use client";

import { useEffect, useRef } from "react";

export default function NotificationManager() {
  const notificationPermission = useRef(null);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[App] Service Worker registered:", registration);
        })
        .catch((error) => {
          console.error("[App] Service Worker registration failed:", error);
        });
    }

    // Request notification permission
    const requestNotificationPermission = async () => {
      if ("Notification" in window && Notification.permission === "default") {
        try {
          const permission = await Notification.requestPermission();
          notificationPermission.current = permission;
          console.log("[App] Notification permission:", permission);
        } catch (error) {
          console.error(
            "[App] Error requesting notification permission:",
            error
          );
        }
      }
    };

    // Request permission after a short delay to avoid blocking initial render
    const timer = setTimeout(() => {
      requestNotificationPermission();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
