import React, { useEffect, useState, useRef } from "react";
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
    const [localNewRows, setLocalNewRows] = useState<LocalNewRow[]>([]);
    const [addError, setAddError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [fallbackProject, setFallbackProject] = useState<ProjectData | null>(null);

    // REF for the "Dodaj" button to enable scrollIntoView!
    const addButtonRef = useRef<HTMLButtonElement>(null);

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
            const res = await axios.get(`/projects/${projectId}/shopping-items`);
            const refreshed = Array.isArray(res.data) ? res.data : [];

            setItems(prev => {
                return prev.map(item => {
                    const updated = refreshed.find((f: any) => f.id === item.id);
                    return updated ? updated : item;
                });
            });
        } catch (error) {
            console.error("Błąd podczas odświeżania plików:", error);
        }
    };

    // USUNIĘTO WALIDACJĘ "Nazwa pozycji jest wymagana!" PODCZAS EDYCJI
    const handleUpdate = async (id: string, field: keyof ShoppingItem, value: any) => {
        const itemToUpdate = items.find(item => item.id === id);
        if (!itemToUpdate) return;

        let updatedInvoices = itemToUpdate.invoices;

        if (field === "invoices") {
            updatedInvoices = [
                ...(itemToUpdate.invoices.filter(f => !(f instanceof File)) as any[]),
                ...(Array.isArray(value) ? value.filter(f => f instanceof File) : []),
            ];
        }

        const updatedItem = {
            ...itemToUpdate,
            [field]: value,
            invoices: updatedInvoices,
        };

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

    const handleLocalNewRowChange = (index: number, field: keyof LocalNewRow, value: any) => {
        setLocalNewRows(prev =>
            prev.map((row, i) =>
                i === index ? { ...row, [field]: value } : row
            )
        );
    };

    const handleAddEmptyRow = () => {
     setLocalNewRows((prev) => [
       ...prev,
        {
          name: "",
          notes: "",
          priceGross: 0,
          priceNet: 0,
          status: "dozamowienia",
          link: "",
          invoiceAttached: false,
          invoices: [],
        },
      ]);
      setAddError(null);
    };

    const handleSaveAllNewRows = async () => {
      const savedItems: ShoppingItem[] = [];

      for (const newRow of localNewRows) {
        if (!newRow.name || newRow.name.trim() === "") {
          console.warn("Pominięto pusty wiersz bez nazwy");
          continue;
        }

        const formData = new FormData();
        formData.append("name", newRow.name);
        formData.append("notes", newRow.notes || "");
        formData.append("priceNet", String(newRow.priceNet));
        formData.append("priceGross", String(newRow.priceGross));
        formData.append("status", newRow.status);
        formData.append("link", newRow.link || "");
        if (newRow.invoices?.length) {
          newRow.invoices.forEach((file) => {
            if (file instanceof File) formData.append("invoices[]", file);
          });
        }

        try {
          const response = await axios.post(`/projects/${projectId}/shopping-items`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          savedItems.push(response.data);
        } catch (err) {
          console.error("Błąd zapisu pozycji:", err);
        }
      }

      setItems((prev) => [...prev, ...savedItems]);
      setLocalNewRows([]);
    };

    const handleCancelNewRow = () => {
        setLocalNewRows([]);
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
      await handleSaveAllNewRows();
      setEditMode(false);
    };

    // SCROLL to "Dodaj" button when entering editMode
    useEffect(() => {
        if (editMode && addButtonRef.current) {
            setTimeout(() => {
                addButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 100);
        }
    }, [editMode]);

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
                    items={[
                      ...items,
                      ...localNewRows.map((row, index) => ({ ...row, id: `local-new-${index}` }))
                    ]}

                    updateItem={(id, field, value) => {
                        if (String(id).startsWith("local-new-")) {
                            const index = parseInt(id.replace("local-new-", ""));
                            handleLocalNewRowChange(index, field as keyof LocalNewRow, value);
                        } else {
                            handleUpdate(id, field, value);
                        }
                    }}

                    editMode={editMode}
                    removeItem={id => {
                        if (String(id).startsWith("local-new-")) {
                            const index = parseInt(id.replace("local-new-", ""));
                            setLocalNewRows(prev => prev.filter((_, i) => i !== index));
                        } else {
                            handleRemoveItem(id);
                        }
                    }}

                    isLocalNewRow={id => String(id).startsWith("local-new-")}
                    onLoadInvoices={loadInvoicesForItem}
                />

                {editMode && (
                    <div className="d-flex justify-content-between mt-4">
                        <button
                            className="btn btn-custom"
                            ref={addButtonRef}
                            onClick={handleAddEmptyRow}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                            Dodaj
                        </button>
                        <button className="btn btn-custom" onClick={handleSaveEdit}>Zapisz</button>
                    </div>
                )}
            </div>
        </>
    );
};

export default ShoppingList;