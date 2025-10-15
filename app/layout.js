import { ToastProvider } from "@/components/Toastify";
import UserProvider from "@/context/userContext";
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
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/android-chrome-192x192.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="512x512"
          href="/android-chrome-512x512.png"
        />

        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <UserProvider>
          <ToastProvider>{children}</ToastProvider>
        </UserProvider>
      </body>
    </html>
  );
}
