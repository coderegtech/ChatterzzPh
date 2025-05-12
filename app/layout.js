import UserProvider from "@/context/userContext";
import { Bounce, ToastContainer } from "react-toastify";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="h-full bg-white">
        <UserProvider>
          <ToastContainer
            position="bottom-right"
            autoClose={3000}
            hideProgressBar
            newestOnTop
            closeOnClick={false}
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover={false}
            theme="light"
            transition={Bounce}
          />
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
