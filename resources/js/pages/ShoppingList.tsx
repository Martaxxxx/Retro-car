import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useProjectContext } from "../components/context/ProjectContext";
import ShoppingListTable, { ShoppingItem } from "../components/ShoppingListTable";
import { generateShoppingListPdf } from "../utils/generateShoppingListPdf";
import Navbar from "../components/Navbar";
import "../styles/ProjectDetails.css";
import "../styles/ShoppingList.css";
import axios from "../axios";
import WheelSpinner from "../components/WheelSpinner";
import { ProjectData } from "../pages/projectData";

type LocalNewRow = Omit<ShoppingItem, "id">;

const ShoppingList: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { projects } = useProjectContext();

    const [editMode, setEditMode] = useState(false);
    const [showSummary, setShowSummary] = useState(true);
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [localNewRow, setLocalNewRow] = useState<LocalNewRow | null>(null);
    const [addError, setAddError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [fallbackProject, setFallbackProject] = useState<ProjectData | null>(null);

    const contextProject = projects.find(p => String(p.id) === String(projectId));
    const project = contextProject || fallbackProject;

    useEffect(() => {
        if (!contextProject && projectId) {
            axios.get(`/api/projectdetails/${projectId}`)
                .then(res => setFallbackProject(res.data))
                .catch(err => console.error("Nie udało się pobrać projektu:", err));
        }
    }, [contextProject, projectId]);

    useEffect(() => {
        if (!projectId) return;
        setLoading(true);
        axios.get(`/projects/${projectId}/shopping-items`)
            .then(res => {
                const data = res.data;
                setItems(Array.isArray(data) ? data : []);
            })
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [projectId]);

    const loadInvoicesForItem = async (itemId: string) => {
        try {
            const res = await axios.get(`/shopping-items/${itemId}/invoices`);
            const invoiceLinks = res.data.invoices || [];
            setItems(prev =>
                prev.map(item =>
                    item.id === itemId
                        ? { ...item, invoicesDetails: invoiceLinks, invoicesLoaded: true }
                        : item
                )
            );
        } catch (error) {
            console.error("Błąd podczas ładowania faktur:", error);
        }
    };

    const handleUpdate = async (id: string, field: keyof ShoppingItem, value: any) => {
        const itemToUpdate = items.find(item => item.id === id);
        if (!itemToUpdate) return;

        if (field === "name" && typeof value === "string" && value.trim() === "") {
            alert("Nazwa pozycji jest wymagana!");
            return;
        }

        const updatedItem = { ...itemToUpdate, [field]: value };

        try {
            const formData = new FormData();
            formData.append("name", updatedItem.name);
            formData.append("notes", updatedItem.notes || "");
            formData.append("priceNet", String(updatedItem.priceNet));
            formData.append("priceGross", String(updatedItem.priceGross));
            formData.append("status", updatedItem.status);
            formData.append("link", updatedItem.link || "");
            if (updatedItem.invoices && updatedItem.invoices.length > 0) {
                for (const file of updatedItem.invoices) {
                    if (file instanceof File) {
                        formData.append("invoices[]", file);
                    }
                }
            }

            await axios.post(`/shopping-items/${id}?_method=PUT`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
        } catch (error: any) {
            if (error.response?.data?.errors?.name) {
                alert("Błąd: " + error.response.data.errors.name.join(", "));
            }
        }
    };

    const handleLocalNewRowChange = (field: keyof LocalNewRow, value: any) => {
        setLocalNewRow(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleAddEmptyRow = () => {
        setLocalNewRow({
            name: "",
            notes: "",
            priceGross: 0,
            priceNet: 0,
            status: "dozamowienia",
            link: "",
            invoiceAttached: false,
            invoices: [],
        });
        setAddError(null);
    };

    const handleSaveNewRow = async () => {
        if (!projectId || !localNewRow) return;
        if (localNewRow.name.trim() === "") {
            setAddError("Nazwa pozycji jest wymagana!");
            return;
        }
        setAddError(null);
        try {
            const formData = new FormData();
            formData.append("name", localNewRow.name);
            formData.append("notes", localNewRow.notes || "");
            formData.append("priceNet", String(localNewRow.priceNet));
            formData.append("priceGross", String(localNewRow.priceGross));
            formData.append("status", localNewRow.status);
            formData.append("link", localNewRow.link || "");
            if (localNewRow.invoices && localNewRow.invoices.length > 0) {
                for (const file of localNewRow.invoices) {
                    if (file instanceof File) {
                        formData.append("invoices[]", file);
                    }
                }
            }

            const response = await axios.post(`/projects/${projectId}/shopping-items`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setItems(prev => [...prev, response.data]);
            setLocalNewRow(null);
        } catch (error: any) {
            if (error.response?.data?.errors?.name) {
                setAddError(error.response.data.errors.name.join(", "));
            }
        }
    };

    const handleCancelNewRow = () => {
        setLocalNewRow(null);
        setAddError(null);
    };

    const handleRemoveItem = async (id: string) => {
        try {
            await axios.delete(`/shopping-items/${id}`);
            setItems(prev => prev.filter(item => item.id !== id));
        } catch (error) {}
    };

    const totalNet = items.reduce((sum, i) => sum + Number(i.priceNet), 0).toFixed(2);
    const totalGross = items.reduce((sum, i) => sum + Number(i.priceGross), 0).toFixed(2);
    const countsByStatus = {
        dozamowienia: items.filter(i => i.status === "dozamowienia").length,
        zamowione: items.filter(i => i.status === "zamowione").length,
        dostarczone: items.filter(i => i.status === "dostarczone").length,
    };

    const handleSaveEdit = async () => {
        if (localNewRow) {
            await handleSaveNewRow();
        }
        setEditMode(false);
    };

    if (!project || loading) {
        return (
            <>
                <Navbar />
                <div className="container mt-5 d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
                    <WheelSpinner />
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="container mt-5 pt-5">
                <Link
                    to={`/projectdetails/${projectId}/${encodeURIComponent(project.name)}`}
                    className="project-breadcrumb"
                    style={{ cursor: "pointer", textDecoration: "none", color: "inherit" }}
                >
                    ← {project.name} / {project.carId}
                </Link>

                <div className="d-flex justify-content-between align-items-center mt-4">
                    <h2 className="shopping-title">Lista zakupów</h2>
                    <button className="btn btn-custom" onClick={() => generateShoppingListPdf(project, items)}>
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
                            <p><strong>Liczba pozycji:</strong> {items.length}</p>
                            <p><strong>Statusy:</strong></p>
                            <ul>
                                <li>Do zamówienia: {countsByStatus.dozamowienia}</li>
                                <li>Zamówione: {countsByStatus.zamowione}</li>
                                <li>Dostarczone: {countsByStatus.dostarczone}</li>
                            </ul>
                        </div>
                        <img src="/shop.png" alt="Koszyk zakupowy" className="summary-image-absolute" />
                    </div>
                )}

                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div />
                    {!editMode && (
                        <button className="btn btn-custom" onClick={() => setEditMode(true)}>
                            Edytuj listę zakupów
                        </button>
                    )}
                </div>

                <ShoppingListTable
                    items={localNewRow ? [...items, { ...localNewRow, id: "local-new-row" }] : items}
                    updateItem={(id, field, value) => {
                        if (id === "local-new-row") {
                            handleLocalNewRowChange(field as keyof LocalNewRow, value);
                        } else {
                            handleUpdate(id, field, value);
                        }
                    }}
                    editMode={editMode}
                    removeItem={id => {
                        if (id === "local-new-row") {
                            handleCancelNewRow();
                        } else {
                            handleRemoveItem(id);
                        }
                    }}
                    isLocalNewRow={id => id === "local-new-row"}
                    onLoadInvoices={loadInvoicesForItem}
                />

                {editMode && (
                    <div className="d-flex justify-content-between mt-4">
                        <button className="btn btn-custom" onClick={handleAddEmptyRow}>Dodaj</button>
                        <button className="btn btn-custom" onClick={handleSaveEdit}>Zapisz</button>
                    </div>
                )}
            </div>
        </>
    );
};

export default ShoppingList;
