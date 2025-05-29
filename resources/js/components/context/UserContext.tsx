import React, { createContext, useState, useContext, useEffect } from "react";

interface User {
    name: string;
    avatar: string;
    roles: string[];
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
        // 🔧 MOCK DLA DEVELOPMENTU BEZ BACKENDU
        console.log("🔄 Fetching mock user...");
        const mockUser: User = {
            name: "Janek",
            avatar: "/default-avatar.png",
            roles: ["user"],
            email: "janek@example.com"
        };
        setUser(mockUser);
        console.log("✅ Mock user ustawiony:", mockUser);
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
