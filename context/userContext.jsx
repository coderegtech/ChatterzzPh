"use client";
import { auth } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext({
  user: null,
  setUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/") {
      router.push(`/messages`);
    }
  }, [pathname]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsLoading(false);
    }
  }, []);

  // Handle authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        setUser({ uid: firebaseUser.uid, accessToken: token });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle route protection and redirection
  useEffect(() => {
    if (isLoading) return;

    const publicRoutes = ["/login", "/signup", "/"];
    const protectedRoutes = ["/home", "/profile", "/users"];

    const isPublicRoute = publicRoutes.includes(pathname);
    const isProtectedRoute = protectedRoutes.includes(pathname);
    const isAuthenticated = !!user;

    if (isAuthenticated && isPublicRoute) {
      // Redirect authenticated users away from public routes
      router.push(`/messages`);
    } else if (!isAuthenticated && isProtectedRoute) {
      // Redirect unauthenticated users from protected routes
      router.push("/login");
    }
  }, [user, pathname, isLoading, router]);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
