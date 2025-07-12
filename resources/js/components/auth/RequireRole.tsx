import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

interface Props {
    roles?: string[];
    children: React.ReactNode;
}

const RequireRole: React.FC<Props> = ({ roles, children }) => {
    const { user, isLoadingUser } = useUser();

    if (isLoadingUser) {
        return null;
    }

    if (!user) {
        return <Navigate to="/logowanie" replace />;
    }


    if (roles && !roles.some(role => user.roles?.includes(role))) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default RequireRole;