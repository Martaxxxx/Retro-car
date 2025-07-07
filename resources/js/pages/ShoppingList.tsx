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
import { Project } from "../types/Project";

type LocalNewRow = Omit<ShoppingItem, "id">;

interface CurrentUser {
    id: number;
    name: string;
    surname: string;
    roles: string[];
}

const ShoppingList: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { projects } = useProjectContext();

    const [editMode, setEditMode] = useState(false);
    const [showSummary, setShowSummary] = useState(true);

    // ZATWIERDZONE dane (do podsumowania i PDF)
    const [itemsSaved, setItemsSaved] = useState<ShoppingItem[]>([]);
    // EDYTOWANE dane (do tabeli w trybie edycji)
    const [itemsDraft, setItemsDraft] = useState<ShoppingItem[]>([]);

    const [localNewRows, setLocalNewRows] = useState<LocalNewRow[]>([]);
    const [addError, setAddError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [fallbackProject, setFallbackProject] = useState<Project | null>(null);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

    const [showNameRequiredAlert, setShowNameRequiredAlert] = useState(false);
    const addButtonRef = useRef<HTMLButtonElement>(null);

    const contextProject = projects.find(p => String(p.id) === String(projectId));
    const project = contextProject || fallbackProject;

    // Fetch current user info
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const res = await axios.get("/api/user");
                setCurrentUser({
                    id: res.data.id,
                    name: res.data.name,
                    surname: res.data.surname,
                    roles: res.data.roles ?? [],
                });
            } catch (err) {
                setCurrentUser(null);
            }
        };
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (!contextProject && projectId) {
            axios.get(`/api/projectdetails/${projectId}`)
                .then(res => setFallbackProject(res.data))
                .catch(err => console.error("Nie udało się pobrać projektu:", err));
        }
    }, [contextProject, projectId]);

    // Pobierz ZATWIERDZONE pozycje (do podsumowania i PDF)
    const fetchSavedItems = async () => {
        if (!projectId) return;
        setLoading(true);
        try {
            const res = await axios.get(`/projects/${projectId}/shopping-items`);
            const data = Array.isArray(res.data) ? res.data : [];
            setItemsSaved(data);
            setItemsDraft(data); // domyślny draft to kopia "zatwierdzonych"
        } catch {
            setItemsSaved([]);
            setItemsDraft([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSavedItems();
        // eslint-disable-next-line
    }, [projectId]);

    // Ładowanie plików do itema (np. po usunięciu pliku)
    const loadInvoicesForItem = async (itemId: string) => {
        try {
            const res = await axios.get(`/projects/${projectId}/shopping-items`);
            const refreshed = Array.isArray(res.data) ? res.data : [];

            // aktualizacja draft
            setItemsDraft(prev =>
                prev.map(item => {
                    const updated = refreshed.find((f: any) => f.id === item.id);
                    return updated
                        ? { ...item, invoices: updated.invoices || [] }
                        : item;
                })
            );

            // aktualizacja saved
            setItemsSaved(prev =>
                prev.map(item => {
                    const updated = refreshed.find((f: any) => f.id === item.id);
                    return updated
                        ? { ...item, invoices: updated.invoices || [] }
                        : item;
                })
            );
        } catch (error) {
            console.error("Błąd podczas odświeżania plików:", error);
        }
    };



    // Edycja istniejącej pozycji (tylko w draft)
    const handleUpdate = async (id: string, field: keyof ShoppingItem, value: any) => {
        setItemsDraft(prev =>
            prev.map(item => item.id === id ? { ...item, [field]: value } : item)
        );
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

    // Zapisz WSZYSTKIE nowo dodane wiersze
    const handleSaveAllNewRows = async () => {
        const savedItems: ShoppingItem[] = [];
        let foundEmptyName = false;

        for (const newRow of localNewRows) {
            if (!newRow.name || newRow.name.trim() === "") {
                foundEmptyName = true;
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

        if (foundEmptyName) {
            alert("Nazwa pozycji jest wymagana!");
        }
        setLocalNewRows([]);
        // Po zapisie odśwież całą listę (żeby nie dublować z drafcie)
        await fetchSavedItems();
    };

    const handleCancelNewRow = () => {
        setLocalNewRows([]);
        setAddError(null);
    };

    // Usuwanie pozycji (tylko z draftu, do czasu zapisu)
    const handleRemoveItem = async (id: string) => {
        // Jeśli wiersz istnieje w backendzie (prawdziwe id), usuwamy z backendu i potem odświeżamy
        if (!String(id).startsWith("local-new-")) {
            const confirmed = window.confirm("Czy na pewno chcesz usunąć tę pozycję z listy zakupów?");
            if (!confirmed) return;
            try {
                await axios.delete(`/shopping-items/${id}`);
                // Po usunięciu odśwież dane
                await fetchSavedItems();
            } catch (error) { }
        } else {
            // Jeśli to lokalny wiersz, usuwamy tylko z localNewRows
            const index = parseInt(id.replace("local-new-", ""));
            setLocalNewRows(prev => prev.filter((_, i) => i !== index));
        }
    };

    // PODSUMOWANIE licz tylko na itemsSaved!
    const totalNet = itemsSaved.reduce((sum, i) => sum + Number(i.priceNet), 0).toFixed(2);
    const totalGross = itemsSaved.reduce((sum, i) => sum + Number(i.priceGross), 0).toFixed(2);
    const countsByStatus = {
        dozamowienia: itemsSaved.filter(i => i.status === "dozamowienia").length,
        zamowione: itemsSaved.filter(i => i.status === "zamowione").length,
        dostarczone: itemsSaved.filter(i => i.status === "dostarczone").length,
    };

    // Zapisz zmiany (tylko te istniejące, nie nowe wiersze)
    const handleSaveEdit = async () => {
        // Walidacja: okno systemowe przy pustej nazwie!
        const hasEmptyName = [
            ...itemsDraft,
            ...localNewRows.map((row, index) => ({ ...row, id: `local-new-${index}` }))
        ].some(item => !item.name || item.name.trim() === "");
        if (hasEmptyName) {
            alert("Nazwa pozycji jest wymagana!");
            return;
        }

        // Zapisz wszystkie edytowane istniejące pozycje (draft)
        for (const item of itemsDraft) {
            // Jeśli item.id zaczyna się od "local-new-", to nowy — pominąć tutaj!
            if (String(item.id).startsWith("local-new-")) continue;
            try {
                const formData = new FormData();
                formData.append("name", item.name);
                formData.append("notes", item.notes || "");
                formData.append("priceNet", String(item.priceNet));
                formData.append("priceGross", String(item.priceGross));
                formData.append("status", item.status);
                formData.append("link", item.link || "");
                if (item.invoices && item.invoices.length > 0) {
                    for (const file of item.invoices) {
                        if (file instanceof File) {
                            formData.append("invoices[]", file);
                        }
                    }
                }
                await axios.post(`/shopping-items/${item.id}?_method=PUT`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            } catch (error: any) {
                if (error.response?.data?.errors?.name) {
                    alert("Nazwa pozycji jest wymagana!");
                }
            }
        }

        // Zapisz nowe wiersze
        await handleSaveAllNewRows();

        // Po udanym zapisie odśwież całą listę z backendu
        await fetchSavedItems();

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

    useEffect(() => {
        if (showNameRequiredAlert) {
            const t = setTimeout(() => setShowNameRequiredAlert(false), 3500);
            return () => clearTimeout(t);
        }
    }, [showNameRequiredAlert]);

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

                {/* ALERT NA GÓRZE */}
                {showNameRequiredAlert && (
                    <div style={{
                        position: "sticky",
                        top: 0,
                        left: 0,
                        width: "100%",
                        background: "#d32f2f",
                        color: "#fff",
                        padding: "16px",
                        textAlign: "center",
                        fontWeight: "bold",
                        zIndex: 2000
                    }}>
                        Nazwa jest wymagana w każdym wierszu!
                        <button
                            style={{
                                marginLeft: 20,
                                padding: "4px 16px",
                                border: "none",
                                borderRadius: 4,
                                background: "#fff",
                                color: "#d32f2f",
                                fontWeight: "bold",
                                cursor: "pointer"
                            }}
                            onClick={() => setShowNameRequiredAlert(false)}
                        >
                            OK
                        </button>
                    </div>
                )}

                <Link
                    to={`/projectdetails/${projectId}/${encodeURIComponent(project.name)}`}
                    className="project-breadcrumb"
                    style={{ cursor: "pointer", textDecoration: "none", color: "inherit" }}
                >
                    ← {project.name} / {project.carId}
                </Link>

                <div className="d-flex justify-content-between align-items-center mt-4">
                    <h2 className="shopping-title">Lista zakupów</h2>
                    <button className="btn btn-custom" onClick={() => generateShoppingListPdf(
                        project,
                        itemsSaved,
                        currentUser ? `${currentUser.name} ${currentUser.surname}` : undefined
                    )}>
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
                            <p><strong>Liczba pozycji:</strong> {itemsSaved.length}</p>
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
                        ...(editMode ? itemsDraft : itemsSaved),
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
                    removeItem={id => handleRemoveItem(id)}
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
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