import React from "react";
import { Routes, Route } from "react-router-dom";

// Importuj swoje widoki:
import Home from "./pages/Home";
import Login from "./pages/Login";
import Renovations from "./pages/Renovations";
import ProjectDetails from "./pages/ProjectDetails";
import ShoppingList from "./pages/ShoppingList";
import UserSettings from "./pages/UserSettings";
import ManagerPanel from "./pages/ManagerPanel";
import Reports from "./pages/Reports";
import Register from "./pages/Register";
import AdminPanel from "./pages/AdminPanel"; // ⬅️ NOWY IMPORT

const App: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/logowanie" element={<Login />} />
            <Route path="/renowacje" element={<Renovations />} />
            <Route path="/projectdetails/:projectName" element={<ProjectDetails />} />
            <Route path="/projectdetails/:projectId/lista_zakupow" element={<ShoppingList />} />
            <Route path="/ustawienia" element={<UserSettings />} />
            <Route path="/zarządzanie" element={<ManagerPanel />} />
            <Route path="/raporty" element={<Reports />} />
            <Route path="/rejestracja" element={<Register />} />
            <Route path="/adminpanel" element={<AdminPanel />} /> {/* ⬅️ NOWA TRASA */}
        </Routes>
    );
};

export default App;
