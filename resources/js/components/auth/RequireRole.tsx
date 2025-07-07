import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

interface Props {
    roles?: string[]; // jeśli brak: wystarczy, że user jest zalogowany
    children: React.ReactNode;
}

const RequireRole: React.FC<Props> = ({ roles, children }) => {
    const { user } = useUser();

    if (!user) {
        return <Navigate to="/logowanie" replace />;
    }

    if (roles && !roles.some(role => user.roles?.includes(role))) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default RequireRole;