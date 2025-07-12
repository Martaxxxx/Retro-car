import React from "react";
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Renovations from "./pages/Renovations";
import ProjectDetails from "./pages/ProjectDetails";
import ShoppingList from "./pages/ShoppingList";
import UserSettings from "./pages/UserSettings";
import ManagerPanel from "./pages/ManagerPanel";
import Reports from "./pages/Reports";
import AdminPanel from "./pages/AdminPanel";
import UserLogs from "./pages/UserLogs";
import RequireRole from "./components/auth/RequireRole";

const App: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/logowanie" element={<Login />} />

            {/*Chronione trasy dla dowolnego zalogowanego użytkownika */}
            <Route path="/ustawienia" element={<RequireRole><UserSettings /></RequireRole>} />
            <Route path="/renowacje" element={<RequireRole><Renovations /></RequireRole>} />
            <Route path="/projectdetails/:projectId/:name" element={<RequireRole><ProjectDetails /></RequireRole>} />
            <Route path="/projectdetails/:projectId/lista_zakupow" element={<RequireRole><ShoppingList /></RequireRole>} />
            <Route path="/raporty" element={<RequireRole><Reports /></RequireRole>} />

            {/*Chronione trasy tylko dla admin + manager */}
            <Route path="/zarządzanie" element={<RequireRole roles={['admin', 'manager']}><ManagerPanel /></RequireRole>} />

            {/*Chronione trasy tylko dla admin */}
            <Route path="/adminpanel" element={<RequireRole roles={['admin']}><AdminPanel /></RequireRole>} />
            <Route path="/admin/users/:id/logs" element={<RequireRole roles={['admin']}><UserLogs /></RequireRole>} />
        </Routes>
    );
};

export default App;