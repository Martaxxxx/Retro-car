import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "../../axios";

interface User {
  id: number;
  name: string;
  avatar?: string;
  roles?: string[];
  email: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const fetchUser = async () => {
    try {
      const response = await axios.get("/api/user");
      const userData = response.data;

      const formattedUser: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar || "/user.jpg",
        roles: userData.role ? [userData.role] : userData.roles || ["user"],
      };

      setUser(formattedUser);
    } catch (error) {
      console.error("❌ Błąd pobierania użytkownika:", error);
      setUser(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    window.location.href = "/login";
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      fetchUser();
    }
  }, []);

  useEffect(() => {
    const handleUserUpdated = () => {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    };

    window.addEventListener("user:updated", handleUserUpdated);
    return () => window.removeEventListener("user:updated", handleUserUpdated);
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, fetchUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};
