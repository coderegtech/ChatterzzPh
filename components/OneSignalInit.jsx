"use client";
import { useEffect } from "react";

export default function OneSignalInit({ userId }) {
  useEffect(() => {
    if (typeof window !== "undefined" && window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async (OneSignal) => {
        // Initialize OneSignal
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
        });

        // Set external user ID for targeting specific users
        if (userId) {
          await OneSignal.login(userId);
        }

        // Request notification permission
        const permission = await OneSignal.Notifications.permission;
        if (!permission) {
          await OneSignal.Notifications.requestPermission();
        }
      });
    }
  }, [userId]);

  return null;
}
