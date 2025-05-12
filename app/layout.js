import { ToastProvider } from "@/components/Toastify";
import UserProvider from "@/context/userContext";
import "./globals.css";

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
