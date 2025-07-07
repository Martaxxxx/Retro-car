import React, { useState, lazy, Suspense, useRef, useEffect } from "react";
import { FaFilter, FaPaperclip } from "react-icons/fa";
import Select from "react-select";
import axios from "../axios";

// Lazy load modal components
const FileExplorerModal = lazy(() => import("./FileExplorerModal"));
const NoteModal = lazy(() => import("./NoteModal"));

export interface ShoppingInvoice {
    id?: number;
    name: string;
    url: string;
    size?: number;
    type?: string;
}

export interface ShoppingItem {
    id: string;
    name: string;
    notes: string;
    priceGross: number | "";
    priceNet: number | "";
    status: "dozamowienia" | "zamowione" | "dostarczone";
    link: string;
    invoiceAttached: boolean;
    invoices: (File | ShoppingInvoice)[];
}

interface Props {
    items: ShoppingItem[];
    updateItem: (id: string, field: keyof ShoppingItem, value: any) => void;
    removeItem: (id: string) => void;
    editMode: boolean;
    isLocalNewRow?: (id: string) => boolean;
    onLoadInvoices: (itemId: string) => Promise<void>;
    onSave?: () => void;
}

const customSelectStyles = {
    control: (base: any) => ({
        ...base,
        backgroundColor: '#fff',
        borderColor: '#9C2F3B',
        boxShadow: 'none',
        '&:hover': { borderColor: '#9C2F3B' }
    }),
    option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isFocused ? '#9C2F3B' : '#fff',
        color: state.isFocused ? '#fff' : '#000',
        cursor: 'pointer'
    })
};

const statusOptions = [
    { value: "dozamowienia", label: "Do zamówienia" },
    { value: "zamowione", label: "Zamówione" },
    { value: "dostarczone", label: "Dostarczone" },
];

const itemsPerPage = 25;

const ShoppingListTable: React.FC<Props> = ({
    items,
    updateItem,
    removeItem,
    editMode,
    isLocalNewRow,
    onLoadInvoices,
    onSave,
}) => {
    const [activeItemId, setActiveItemId] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        name: "",
        priceNet: "",
        priceGross: "",
        status: "",
    });
    const [showFilters, setShowFilters] = useState(false);
    const [noteModalContent, setNoteModalContent] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [editingNames, setEditingNames] = useState<Record<string, string>>({});
    const [showNameRequiredAlert, setShowNameRequiredAlert] = useState(false);
    const addButtonRef = useRef<HTMLButtonElement>(null);

    // Scroll to "Dodaj" button when entering editMode
    useEffect(() => {
        if (editMode && addButtonRef.current) {
            setTimeout(() => {
                addButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 100);
        }
    }, [editMode]);

    // Pliki do modala: backend + lokalne
    const getAllFilesForModal = (item: ShoppingItem) => {
        const backendFiles = (Array.isArray(item.invoices)
            ? item.invoices.filter((inv) => inv && typeof inv === "object" && "url" in inv)
            : []) as any[];

        const localFiles = (Array.isArray(item.invoices)
            ? item.invoices.filter((inv) => inv instanceof File).map((f) => ({
                name: f.name,
                size: f.size,
                type: f.type,
                file: f,
            }))
            : []);

        return [...backendFiles, ...localFiles];
    };

    const handleFileChange = (id: string, files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files);
        const current = (items.find((i) => i.id === id)?.invoices || []) as File[];
        const updated = [
            ...current,
            ...newFiles.filter(
                (nf) =>
                    !current.some(
                        (cf) => cf.name === nf.name && cf.size === nf.size
                    )
            ),
        ];
        updateItem(id, "invoices", updated);
        updateItem(id, "invoiceAttached", updated.length > 0);
    };

    const handleRemoveFile = async (id: string, index: number) => {
        const item = items.find((i) => i.id === id);
        if (!item) return;

        const updated = Array.isArray(item.invoices) ? [...item.invoices] : [];
        const fileToRemove = updated[index];

        if (fileToRemove && typeof fileToRemove === "object" && "id" in fileToRemove && fileToRemove.id) {
            try {
                await axios.delete(`/shopping-items/files/${fileToRemove.id}`);
            } catch (err) {
                console.error("Błąd usuwania pliku z serwera:", err);
            }
        }

        updated.splice(index, 1);
        updateItem(id, "invoices", updated);
        updateItem(id, "invoiceAttached", updated.length > 0);

        await onLoadInvoices(id);
    };

    const handleFilterChange = (
        field: keyof typeof filters,
        value: string
    ) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
        setCurrentPage(1);
    };

    const filteredItems = items.filter((item) => {
        const nameMatch = (item.name ?? "")
            .toLowerCase()
            .includes(filters.name.toLowerCase());
        const netMatch =
            filters.priceNet === "" ||
            String(item.priceNet ?? "").includes(filters.priceNet);
        const grossMatch =
            filters.priceGross === "" ||
            String(item.priceGross ?? "").includes(filters.priceGross);
        const statusMatch =
            filters.status === "" || item.status === filters.status;
        return nameMatch && netMatch && grossMatch && statusMatch;
    });

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [filters, totalPages]);

    // Pokazuj tylko wiersze z nazwą jeśli nie editMode (czyli puste nowe wiersze tylko w edycji)
    const visibleItems = paginatedItems.filter(
        (item) => editMode || (item.name && item.name.trim() !== "")
    );

    // Funkcja walidująca przy zapisie (do użycia w ShoppingList!)
    const validateBeforeSave = () => {
        const hasEmptyName = items.some(item => !item.name || item.name.trim() === "");
        if (hasEmptyName) {
            setShowNameRequiredAlert(true);
            return false;
        }
        return true;
    };

    // --- Alert u góry ekranu ---
    useEffect(() => {
        if (showNameRequiredAlert) {
            const t = setTimeout(() => setShowNameRequiredAlert(false), 3500);
            return () => clearTimeout(t);
        }
    }, [showNameRequiredAlert]);

    return (
        <div>
            {/* ALERT/POPUP NA GÓRZE */}
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

            <div className="d-flex align-items-center mb-3 gap-2">
                <span style={{ fontWeight: "bold", fontSize: "1.3rem", color: "#333" }}>
                    Filtr
                </span>
                <FaFilter
                    style={{
                        cursor: "pointer",
                        fontSize: "1.2rem",
                        color: "#9C2F3B",
                    }}
                    onClick={() => setShowFilters((prev) => !prev)}
                />
            </div>

            <div className="shopping-table-wrapper">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Nazwa</th>
                            <th>Notatki</th>
                            <th>Netto</th>
                            <th>Brutto</th>
                            <th>Status</th>
                            <th>Link</th>
                            <th>Załączniki</th>
                            {editMode && <th>Usuń</th>}
                        </tr>
                        {showFilters && (
                            <tr>
                                <th>
                                    <input
                                        className="form-control form-control-sm"
                                        value={filters.name}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                "name",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Filtr"
                                    />
                                </th>
                                <th></th>
                                <th>
                                    <input
                                        className="form-control form-control-sm"
                                        value={filters.priceNet}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                "priceNet",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Filtr"
                                    />
                                </th>
                                <th>
                                    <input
                                        className="form-control form-control-sm"
                                        value={filters.priceGross}
                                        onChange={(e) =>
                                            handleFilterChange(
                                                "priceGross",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Filtr"
                                    />
                                </th>
                                <th>
                                    <Select
                                        styles={customSelectStyles}
                                        options={statusOptions}
                                        isSearchable={false}
                                        value={statusOptions.find(
                                            (opt) =>
                                                opt.value === filters.status
                                        )}
                                        onChange={(selected) =>
                                            handleFilterChange(
                                                "status",
                                                selected?.value || ""
                                            )
                                        }
                                    />
                                </th>
                                <th></th>
                                <th></th>
                                {editMode && <th></th>}
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {visibleItems.map((item) => (
                            <tr
                                key={item.id}
                                style={
                                    isLocalNewRow && isLocalNewRow(item.id)
                                        ? { background: "#f8f8fa" }
                                        : {}
                                }
                            >
                                <td>
                                    {editMode ? (
                                        <input
                                            className="form-control form-control-sm"
                                            value={editingNames[item.id] ?? item.name ?? ""}
                                            onChange={(e) => {
                                                setEditingNames(ed => ({ ...ed, [item.id]: e.target.value }));
                                            }}
                                            onBlur={e => {
                                                updateItem(item.id, "name", e.target.value);
                                                setEditingNames(ed => {
                                                    const copy = { ...ed };
                                                    delete copy[item.id];
                                                    return copy;
                                                });
                                            }}
                                            placeholder="Nazwa (wymagana)"
                                            autoFocus={
                                                isLocalNewRow &&
                                                isLocalNewRow(item.id)
                                            }
                                        />
                                    ) : (
                                        item.name
                                    )}
                                </td>
                                <td>
                                    {editMode ? (
                                        <textarea
                                            className="form-control form-control-sm"
                                            value={item.notes ?? ""}
                                            rows={2}
                                            onChange={(e) =>
                                                updateItem(
                                                    item.id,
                                                    "notes",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    ) : item.notes && item.notes.length > 40 ? (
                                        <>
                                            {item.notes.substring(0, 40)}...
                                            <button
                                                type="button"
                                                className="btn btn-link btn-sm"
                                                onClick={() =>
                                                    setNoteModalContent(
                                                        item.notes
                                                    )
                                                }
                                                style={{
                                                    color: "#9C2F3B",
                                                    fontSize: "0.7rem",
                                                }}
                                            >
                                                Zobacz więcej
                                            </button>
                                        </>
                                    ) : (
                                        item.notes || ""
                                    )}
                                </td>
                                <td>
                                    {editMode ? (
                                        <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            value={
                                                item.priceNet === "" ||
                                                item.priceNet === null ||
                                                isNaN(Number(item.priceNet))
                                                    ? ""
                                                    : String(item.priceNet)
                                            }
                                            onChange={(e) =>
                                                updateItem(
                                                    item.id,
                                                    "priceNet",
                                                    e.target.value === "" ? "" : parseFloat(e.target.value)
                                                )
                                            }
                                        />
                                    ) : (
                                        item.priceNet === "" || item.priceNet === null || isNaN(Number(item.priceNet))
                                            ? ""
                                            : `${Number(item.priceNet).toFixed(2)} zł`
                                    )}
                                </td>
                                <td>
                                    {editMode ? (
                                        <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            value={
                                                item.priceGross === "" ||
                                                item.priceGross === null ||
                                                isNaN(Number(item.priceGross))
                                                    ? ""
                                                    : String(item.priceGross)
                                            }
                                            onChange={(e) =>
                                                updateItem(
                                                    item.id,
                                                    "priceGross",
                                                    e.target.value === "" ? "" : parseFloat(e.target.value)
                                                )
                                            }
                                        />
                                    ) : (
                                        item.priceGross === "" || item.priceGross === null || isNaN(Number(item.priceGross))
                                            ? ""
                                            : `${Number(item.priceGross).toFixed(2)} zł`
                                    )}
                                </td>
                                <td>
                                    {editMode ? (
                                        <Select
                                            styles={customSelectStyles}
                                            options={statusOptions}
                                            value={statusOptions.find(
                                                (opt) => opt.value === item.status
                                            )}
                                            onChange={(selected) =>
                                                updateItem(
                                                    item.id,
                                                    "status",
                                                    selected?.value
                                                )
                                            }
                                            isSearchable={false}
                                        />
                                    ) : (
                                        statusOptions.find(
                                            (opt) => opt.value === item.status
                                        )?.label
                                    )}
                                </td>
                                <td>
                                    {editMode ? (
                                        <input
                                            className="form-control form-control-sm"
                                            value={item.link ?? ""}
                                            onChange={(e) =>
                                                updateItem(
                                                    item.id,
                                                    "link",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    ) : item.link ? (
                                        <a
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="link-bordo"
                                        >
                                            Zobacz
                                        </a>
                                    ) : (
                                        "—"
                                    )}
                                </td>
                                <td>
                                    {editMode ? (
                                        <input
                                            type="file"
                                            multiple
                                            className="form-control form-control-sm"
                                            onChange={(e) =>
                                                handleFileChange(
                                                    item.id,
                                                    e.target.files
                                                )
                                            }
                                        />
                                    ) : Array.isArray(item.invoices) &&
                                        item.invoices.length > 0 ? (
                                        <>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-link text-dark"
                                                onClick={() =>
                                                    setActiveItemId(item.id)
                                                }
                                            >
                                                <FaPaperclip />
                                                <span style={{ fontSize: "0.95em", marginLeft: 2 }}>
                                                    ({item.invoices.length})
                                                </span>
                                            </button>
                                            {activeItemId === item.id && (
                                                <Suspense fallback={<div>Ładowanie załączników...</div>}>
                                                    <FileExplorerModal
                                                        files={getAllFilesForModal(
                                                            item
                                                        )}
                                                        onClose={() =>
                                                            setActiveItemId(null)
                                                        }
                                                        onRemove={(i) =>
                                                            handleRemoveFile(
                                                                item.id,
                                                                i
                                                            )
                                                        }
                                                    />
                                                </Suspense>
                                            )}
                                        </>
                                    ) : (
                                        "—"
                                    )}
                                </td>
                                {editMode && (
                                    <td>
                                        <button
                                            type="button"
                                            className="icon-remove-btn"
                                            onClick={() => {
                                                setEditingNames(ed => {
                                                    const copy = { ...ed };
                                                    delete copy[item.id];
                                                    return copy;
                                                });
                                                removeItem(item.id);
                                            }}
                                            title={
                                                isLocalNewRow &&
                                                    isLocalNewRow(item.id)
                                                    ? "Anuluj"
                                                    : "Usuń"
                                            }
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
                                                fill="currentColor"
                                                className="bi bi-trash3"
                                                viewBox="0 0 16 16"
                                            >
                                                <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Z" />
                                            </svg>
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Przycisk zapisz powinien być w ShoppingList, tutaj tylko funkcja walidacji! */}

            {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4 gap-2 flex-wrap">
                    <span
                        style={{
                            fontSize: "2rem",
                            cursor: currentPage === 1 ? "not-allowed" : "pointer",
                            color: currentPage === 1 ? "#ccc" : "#9C2F3B",
                            userSelect: "none",
                            marginRight: "1rem"
                        }}
                        onClick={() => currentPage > 1 && setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        aria-label="Poprzednia strona"
                        tabIndex={currentPage === 1 ? -1 : 0}
                    >
                        ←
                    </span>
                    <span className="align-self-center" style={{ fontWeight: "bold" }}>
                        {currentPage} / {totalPages}
                    </span>
                    <span
                        style={{
                            fontSize: "2rem",
                            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                            color: currentPage === totalPages ? "#ccc" : "#9C2F3B",
                            userSelect: "none",
                            marginLeft: "1rem"
                        }}
                        onClick={() => currentPage < totalPages && setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        aria-label="Następna strona"
                        tabIndex={currentPage === totalPages ? -1 : 0}
                    >
                        →
                    </span>
                </div>
            )}

            {noteModalContent && (
                <Suspense fallback={<div>Ładowanie notatki...</div>}>
                    <NoteModal
                        content={noteModalContent}
                        onClose={() => setNoteModalContent(null)}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default ShoppingListTable;