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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <ToastProvider>{children}</ToastProvider>
        </UserProvider>
      </body>
    </html>
  );
}
