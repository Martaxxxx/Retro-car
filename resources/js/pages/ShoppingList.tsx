import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjectContext } from "../components/context/ProjectContext";
import ShoppingListTable, { ShoppingItem } from "../components/ShoppingListTable";
import { generateShoppingListPdf } from "../utils/generateShoppingListPdf";
import Navbar from "../components/Navbar";
import "../styles/ProjectDetails.css";
import "../styles/ShoppingList.css";
import { FaFilter } from "react-icons/fa";

const ShoppingList: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { projects } = useProjectContext();
    const project = projects.find(p => p.id === projectId);

    const [editMode, setEditMode] = useState(false);
    const [showSummary, setShowSummary] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [filters, setFilters] = useState({
        name: "",
        notes: "",
        link: "",
        status: ""
    });

    const handleUpdate = (
        id: string,
        field: keyof ShoppingItem,
        value: string | number | boolean | File[]
    ) => {
        setItems(prev =>
            prev.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const handleAddItem = () => {
        const newItem: ShoppingItem = {
            id: `s${Date.now()}`,
            name: "",
            notes: "",
            priceGross: 0,
            priceNet: 0,
            status: "dozamowienia",
            link: "",
            invoiceAttached: false,
            invoices: [],
        };
        setItems(prev => [...prev, newItem]);
    };

    const handleRemoveItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleFilterChange = (field: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(filters.name.toLowerCase()) &&
        item.notes.toLowerCase().includes(filters.notes.toLowerCase()) &&
        item.link.toLowerCase().includes(filters.link.toLowerCase()) &&
        (filters.status === "" || item.status === filters.status)
    );

    const totalNet = filteredItems.reduce((sum, i) => sum + Number(i.priceNet), 0).toFixed(2);
    const totalGross = filteredItems.reduce((sum, i) => sum + Number(i.priceGross), 0).toFixed(2);
    const countsByStatus = {
        dozamowienia: filteredItems.filter(i => i.status === "dozamowienia").length,
        zamowione: filteredItems.filter(i => i.status === "zamowione").length,
        dostarczone: filteredItems.filter(i => i.status === "dostarczone").length,
    };

    if (!project) return <div className="container mt-5">Nie znaleziono projektu.</div>;

    return (
        <>
            <Navbar />
            <div className="container mt-5 pt-5">
                <h5
                    className="project-breadcrumb"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/projectdetails/${projectId}`)}
                >
                    ← {project.name} / {project.carId}
                </h5>

                <div className="d-flex justify-content-between align-items-center mt-4">
                    <h2 className="shopping-title">Lista zakupów</h2>
                    <button className="btn btn-custom" onClick={() => generateShoppingListPdf(project, filteredItems)}>
                        📄 Pobierz PDF
                    </button>
                </div>

                <div className="mb-3 mt-3">
                    <button className="btn btn-custom toggle-summary" onClick={() => setShowSummary(!showSummary)}>
                        Podsumowanie {showSummary ? "▲" : "▼"}
                    </button>
                </div>

                {showSummary && (
                    <div className="shopping-summary card position-relative mb-3 p-3 shadow-sm">
                        <div className="summary-text" style={{ paddingRight: "240px" }}>
                            <p><strong>Łączna kwota netto:</strong> {totalNet} zł</p>
                            <p><strong>Łączna kwota brutto:</strong> {totalGross} zł</p>
                            <p><strong>Liczba pozycji:</strong> {filteredItems.length}</p>
                            <p><strong>Statusy:</strong></p>
                            <ul>
                                <li>Do zamówienia: {countsByStatus.dozamowienia}</li>
                                <li>Zamówione: {countsByStatus.zamowione}</li>
                                <li>Dostarczone: {countsByStatus.dostarczone}</li>
                            </ul>
                        </div>

                        <img
                            src="/shop.png"
                            alt="Koszyk zakupowy"
                            className="summary-image-absolute"
                        />
                    </div>
                )}

                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center ms-1 gap-2">
                        {/* dodatkowe filtry, przyciski itp. */}
                    </div>

                    {!editMode && (
                        <button className="btn btn-custom" onClick={() => setEditMode(true)}>
                            Edytuj listę zakupów
                        </button>
                    )}
                </div>

                {showFilters && (
                    <div className="row mb-3 mt-2">
                        <div className="col-md-3 mb-2">
                            <input
                                className="form-control form-control-sm"
                                placeholder="Filtruj nazwę"
                                value={filters.name}
                                onChange={(e) => handleFilterChange("name", e.target.value)}
                            />
                        </div>
                        <div className="col-md-3 mb-2">
                            <input
                                className="form-control form-control-sm"
                                placeholder="Filtruj notatki"
                                value={filters.notes}
                                onChange={(e) => handleFilterChange("notes", e.target.value)}
                            />
                        </div>
                        <div className="col-md-3 mb-2">
                            <input
                                className="form-control form-control-sm"
                                placeholder="Filtruj link"
                                value={filters.link}
                                onChange={(e) => handleFilterChange("link", e.target.value)}
                            />
                        </div>
                        <div className="col-md-3 mb-2">
                            <select
                                className="form-select form-select-sm"
                                value={filters.status}
                                onChange={(e) => handleFilterChange("status", e.target.value)}
                            >
                                <option value="">Wszystkie statusy</option>
                                <option value="dozamowienia">Do zamówienia</option>
                                <option value="zamowione">Zamówione</option>
                                <option value="dostarczone">Dostarczone</option>
                            </select>
                        </div>
                    </div>
                )}

                <ShoppingListTable
                    items={filteredItems}
                    updateItem={handleUpdate}
                    editMode={editMode}
                    removeItem={handleRemoveItem}
                />

                {editMode && (
                    <div className="d-flex justify-content-between mt-4">
                        <button className="btn btn-custom" onClick={handleAddItem}>
                            Dodaj
                        </button>
                        <button className="btn btn-custom" onClick={() => setEditMode(false)}>
                            Zakończ edycję
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default ShoppingList;
