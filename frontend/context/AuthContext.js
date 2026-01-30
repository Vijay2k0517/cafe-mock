"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuth = () => {
      try {
        const storedToken = localStorage.getItem("authToken");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error loading auth state:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    };

    loadAuth();

    // Listen for storage changes (login/logout from other tabs)
    const handleStorage = (e) => {
      if (e.key === "authToken" || e.key === "user") {
        loadAuth();
      }
    };

    window.addEventListener("storage", handleStorage);

    // Custom event for same-tab auth changes
    const handleAuthChange = () => loadAuth();
    window.addEventListener("authChange", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("authChange", handleAuthChange);
    };
  }, []);

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("authToken", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    window.dispatchEvent(new Event("authChange"));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("authChange"));
  };

  const isAuthenticated = !!token && !!user;
  const isAgent = user?.role === "agent" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isAgent,
        isAdmin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
