import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "../../axios"; // ← musisz mieć poprawnie skonfigurowany axios

interface User {
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
                name: userData.name,
                email: userData.email,
                avatar: "/default-avatar.png",
                roles: [userData.role || "user"],
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
