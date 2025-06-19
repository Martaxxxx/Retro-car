import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjectContext } from "../components/context/ProjectContext";
import ShoppingListTable, { ShoppingItem } from "../components/ShoppingListTable";
import { generateShoppingListPdf } from "../utils/generateShoppingListPdf";
import Navbar from "../components/Navbar";
import "../styles/ProjectDetails.css";
import "../styles/ShoppingList.css";
import axios from "../axios"; 


const ShoppingList: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { projects } = useProjectContext();
    const project = projects.find(p => p.id === projectId);

    const [editMode, setEditMode] = useState(false);
    const [showSummary, setShowSummary] = useState(true);
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [filters, setFilters] = useState({
        name: "",
        notes: "",
        link: "",
        status: ""
    });

    useEffect(() => {
        if (!projectId) return;
      
        axios.get(`/projects/${projectId}/shopping-items`)
          .then(res => {
            const data = res.data;
            if (Array.isArray(data)) {
              setItems(data);
            } else {
              console.warn("Oczekiwano tablicy, ale przyszło:", data);
              setItems([]);
            }
          })
          .catch(err => {
            console.error("Błąd ładowania zakupów:", err);
            setItems([]);
          });
      }, [projectId]);
      
    

    const handleUpdate = async (
        id: string,
        field: keyof ShoppingItem,
        value: string | number | boolean | File[]
    ) => {
        const itemToUpdate = items.find(item => item.id === id);
        if (!itemToUpdate) return;

        const updatedItem = { ...itemToUpdate, [field]: value };

        try {
            await axios.put(`/shopping-items/${id}`, updatedItem);
            setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
        } catch (error) {
            console.error("Błąd podczas aktualizacji", error);
        }
    };

    const handleAddItem = async () => {
        if (!projectId) return;

        const newItem: Omit<ShoppingItem, 'id'> & { project_id: string } = {
            name: "",
            notes: "",
            priceGross: 0,
            priceNet: 0,
            status: "dozamowienia",
            link: "",
            invoiceAttached: false,
            invoices: [],
            project_id: projectId
        };

        try {
            const response = await axios.post('/shopping-items', newItem);
            setItems(prev => [...prev, response.data]);
        } catch (error) {
            console.error("Błąd podczas dodawania", error);
        }
    };

    const handleRemoveItem = async (id: string) => {
        try {
            await axios.delete(`/shopping-items/${id}`);
            setItems(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error("Błąd podczas usuwania", error);
        }
    };

    const handleFilterChange = (field: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const filteredItems = Array.isArray(items)
    ? items.filter(item =>
        item.name.toLowerCase().includes(filters.name.toLowerCase()) &&
        item.notes.toLowerCase().includes(filters.notes.toLowerCase()) &&
        item.link.toLowerCase().includes(filters.link.toLowerCase()) &&
        (filters.status === "" || item.status === filters.status)
    )
    : [];


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
