import { ToastProvider } from "@/components/Toastify";
import UserProvider from "@/context/userContext";
import Script from "next/script";
import "./globals.css";

export const metadata = {
  title: "ChatterzzPh - Real-Time Chat Application",
  description:
    "Connect and chat in real-time with ChatterzzPh. A modern messaging platform for seamless communication with friends and colleagues.",
  keywords:
    "chat, messaging, real-time chat, instant messaging, ChatterzzPh, communication",
  authors: [{ name: "ChatterzzPh Team" }],
  creator: "Coderegtech",
  publisher: "Coderegtech",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#3b82f6" />
        <link rel="manifest" href="/manifest.json" />
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          defer
        />
      </head>
      <body>
        <UserProvider>
          <ToastProvider>{children}</ToastProvider>
        </UserProvider>
      </body>
    </html>
  );
}
