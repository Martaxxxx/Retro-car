import React, { useEffect, useState, useRef } from "react";
import { FaFilter } from "react-icons/fa";
import QRCodeModal from "./QRCodeModal";
import Select from "react-select";
import NoteModal from "./NoteModal";

export interface Part {
    id: string;
    partCode: string;
    name: string;
    category: string;
    notes: string;
    status: "pending" | "ready" | "installed";
}

interface Props {
    parts: Part[];
    updateStatus: (partId: string, newStatus: Part["status"]) => void;
    updateField: (partId: string, field: keyof Omit<Part, "id" | "partCode">, value: string) => void;
    addPart: (newPart: Part) => void;
    removePart: (id: string) => void;
    editMode: boolean;
    projectName: string;
    onEndEdit?: () => void;
    onToggleEdit: () => void;
    onGeneratePDF: () => void;
}

const customSelectStyles = {
    control: (base) => ({
        ...base,
        backgroundColor: '#fff',
        borderColor: '#9C2F3B',
        boxShadow: 'none',
        '&:hover': { borderColor: '#9C2F3B' }
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? '#9C2F3B' : '#fff',
        color: state.isFocused ? '#fff' : '#000',
        cursor: 'pointer'
    })
};
const PartsTable: React.FC<Props> = ({
    parts,
    updateStatus,
    updateField,
    addPart,
    removePart,
    editMode,
    projectName,
    onEndEdit,
    onToggleEdit,
    onGeneratePDF,
}) => {
    const [isQRCodeReady, setQRCodeReady] = useState(false);
    const [selectedQR, setSelectedQR] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
    const tableRef = useRef<HTMLDivElement>(null);
    const [noteModalContent, setNoteModalContent] = useState<string | null>(null);

    const [filters, setFilters] = useState({
        partCode: "",
        name: "",
        category: "",
        notes: "",
        status: "",
    });

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js";
        script.async = true;
        script.onload = () => setQRCodeReady(true);
        document.body.appendChild(script);
        return () => document.body.removeChild(script);
    }, []);

    const generateQRCode = (id: string, partCode: string, partName: string) => {
        const element = document.getElementById(`qrcode-${id}`);
        if (element && window.QRCode) {
            element.innerHTML = "";
            new window.QRCode(element, {
                text: `${projectName}, ${partCode}, ${partName}`,
                width: 100,
                height: 100,
            });
        }
    };

    useEffect(() => {
        if (isQRCodeReady) {
            parts.forEach(part => {
                if (part.partCode.trim() !== "" && part.name.trim() !== "") {
                    generateQRCode(part.id, part.partCode, part.name);
                }
            });
        }
    }, [parts, isQRCodeReady]);

    const handleFilterChange = (field: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleAddPart = () => {
        const brandLetter = projectName.charAt(0).toUpperCase() || "X";
        const projectCode = projectName.split(" ").pop()?.toUpperCase() || "XX";
        const prefix = `${brandLetter}${projectCode}-`;
        
        // Find the highest existing number for this project prefix
        const existingNumbers = parts
            .filter(part => part.partCode.startsWith(prefix))
            .map(part => {
                const numberPart = part.partCode.substring(prefix.length);
                return parseInt(numberPart, 10);
            })
            .filter(num => !isNaN(num));
        
        const nextNumber = existingNumbers.length > 0 
            ? Math.max(...existingNumbers) + 1 
            : 1;
        
        const newPartCode = `${prefix}${String(nextNumber).padStart(3, "0")}`;

        // Generate a more robust unique ID
        const uniqueId = `p${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        addPart({
            id: uniqueId,
            partCode: newPartCode,
            name: "",
            category: "",
            notes: "",
            status: "pending"
        });
    };

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredParts.map(part => part.id));
        }
        setSelectAll(!selectAll);
    };

    const toggleSelectOne = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const handlePrintQRs = () => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const style = `
            <style>
                body { font-family: sans-serif; padding: 20px; }
                .part { margin-bottom: 30px; }
                canvas { display: block; margin-bottom: 10px; }
            </style>
        `;
        const htmlStart = `<html><head><title>Drukuj QR kody</title>${style}</head><body><h2>${projectName} - Kody QR</h2>`;
        const htmlEnd = `<script>window.onload = () => setTimeout(() => window.print(), 500);</script></body></html>`;
        const content = parts
            .filter(part => selectedIds.includes(part.id))
            .map(part => {
                const canvas = document.getElementById(`qrcode-${part.id}`)?.querySelector("canvas");
                const dataUrl = canvas?.toDataURL() ?? "";
                return `<div class="part"><img src="${dataUrl}" width="100" height="100" /><div><strong>${part.partCode}</strong> - ${part.name}</div></div>`;
            }).join("");

        printWindow.document.write(htmlStart + content + htmlEnd);
        printWindow.document.close();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (expandedNoteId && tableRef.current && !tableRef.current.contains(event.target as Node)) {
                setExpandedNoteId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [expandedNoteId]);

    const filteredParts = parts.filter(part =>
        part.partCode.toLowerCase().includes(filters.partCode.toLowerCase()) &&
        part.name.toLowerCase().includes(filters.name.toLowerCase()) &&
        part.category.toLowerCase().includes(filters.category.toLowerCase()) &&
        part.notes.toLowerCase().includes(filters.notes.toLowerCase()) &&
        (!filters.status || part.status === filters.status)
    );

    return (
        <div ref={tableRef}>
            <div className="mt-5">
                <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap px-2">
                    <div className="d-flex align-items-center flex-wrap gap-3">
                        <div className="d-flex align-items-center gap-2">
                            <span style={{ fontWeight: "bold", fontSize: "1.3rem", color: "#333" }}>Filtr</span>
                            <FaFilter
                                style={{ cursor: "pointer", fontSize: "1.2rem", color: "#9C2F3B" }}
                                onClick={() => setShowFilters(prev => !prev)}
                            />
                        </div>

                        <button
                            className="btn btn-custom ms-3"
                            onClick={handlePrintQRs}
                            disabled={selectedIds.length === 0}
                        >
                            🖨️ QR
                        </button>
                    </div>

                    {!editMode && (
                        <div className="d-flex mt-md-0 ms-8 mt-2 gap-2">
                            <button className="btn btn-custom" onClick={onGeneratePDF}>
                                📄 Pobierz PDF
                            </button>
                            <button
                                className="btn btn-custom"
                                style={{ marginRight: "-7px" }}
                                onClick={onToggleEdit}
                            >
                                Edytuj części
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <table className="custom-table">
                <thead>
                    <tr>
                        <th><input type="checkbox" checked={selectAll} onChange={toggleSelectAll} /></th>
                        <th>QR Kod</th>
                        <th>Kod części</th>
                        <th>Nazwa</th>
                        <th>Kategoria</th>
                        <th>Notatki</th>
                        <th>Status</th>
                        {editMode && <th>Usuń</th>}
                    </tr>
                    {showFilters && (
                        <tr>
                            <td></td>
                            <td></td>
                            {["partCode", "name", "category", "notes", "status"].map(field => (
                                <td key={field}>
                                    {field === "status" ? (
                                        <select
                                            className="form-select form-select-sm"
                                            value={filters.status}
                                            onChange={e => handleFilterChange("status", e.target.value)}
                                        >
                                            <option value="">Wszystkie</option>
                                            <option value="pending">W przygotowaniu</option>
                                            <option value="ready">Gotowy do montażu</option>
                                            <option value="installed">Zamontowany</option>
                                        </select>
                                    ) : (
                                        <input
                                            className="form-control form-control-sm"
                                            placeholder={`Filtruj ${field}`}
                                            value={filters[field]}
                                            onChange={e => handleFilterChange(field, e.target.value)}
                                        />
                                    )}
                                </td>
                            ))}
                            {editMode && <td></td>}
                        </tr>
                    )}
                </thead>
                <tbody>
                    {filteredParts.map(part => (
                        <tr key={part.id}>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(part.id)}
                                    onChange={() => toggleSelectOne(part.id)}
                                />
                            </td>
                            <td>
                                {(part.partCode.trim() && part.name.trim()) ? (
                                    <div
                                        id={`qrcode-${part.id}`}
                                        style={{
                                            width: "100px",
                                            height: "100px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}
                                        onClick={() => {
                                            if (part.partCode.trim() && part.name.trim()) {
                                                setSelectedQR(`${projectName}, ${part.partCode}, ${part.name}`);
                                            }
                                        }}
                                    >
                                        {(part.partCode.trim() && part.name.trim()) ? null : (
                                            <span style={{ fontSize: "0.7rem", color: "#999" }}>Brak danych</span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-muted" style={{ fontSize: "0.8rem" }}>Uzupełnij dane</span>
                                )}
                            </td>
                            <td>{part.partCode}</td>
                            <td>
                                {editMode ? (
                                    <input
                                        className="form-control form-control-sm"
                                        value={part.name}
                                        onChange={(e) => updateField(part.id, "name", e.target.value)}
                                    />
                                ) : part.name}
                            </td>
                            <td>
                                {editMode ? (
                                    <input
                                        className="form-control form-control-sm"
                                        value={part.category}
                                        onChange={(e) => updateField(part.id, "category", e.target.value)}
                                    />
                                ) : part.category}
                            </td>
                            <td style={{ position: 'relative' }}>
                                {editMode ? (
                                    <textarea
                                        className="form-control form-control-sm"
                                        value={part.notes}
                                        onChange={(e) => updateField(part.id, "notes", e.target.value)}
                                        rows={2}
                                    />
                                ) : part.notes.length > 40 ? (
                                    <>
                                        {part.notes.substring(0, 40)}...
                                        <button
                                            className="btn btn-link btn-sm"
                                            onClick={() => setNoteModalContent(part.notes)}
                                            style={{ fontSize: "0.7rem", color: "#9C2F3B", fontWeight: "bold" }}
                                        >
                                            [Zobacz więcej]
                                        </button>
                                    </>
                                ) : (
                                    part.notes
                                )}
                            </td>
                            <td>
                                {editMode ? (
                                    <Select
                                        styles={customSelectStyles}
                                        classNamePrefix="react-select"
                                        placeholder="Status"
                                        options={[
                                            { value: "pending", label: "W przygotowaniu" },
                                            { value: "ready", label: "Gotowy do montażu" },
                                            { value: "installed", label: "Zamontowany" },
                                        ]}
                                        value={[
                                            { value: "pending", label: "W przygotowaniu" },
                                            { value: "ready", label: "Gotowy do montażu" },
                                            { value: "installed", label: "Zamontowany" },
                                        ].find(opt => opt.value === part.status)}
                                        onChange={(selected) => updateStatus(part.id, selected?.value as Part["status"])}
                                        isSearchable={false}
                                    />

                                ) : (
                                    { pending: "W przygotowaniu", ready: "Gotowy do montażu", installed: "Zamontowany" }[part.status]
                                )}
                            </td>
                            {editMode && (
                                <td className="text-center">
                                    <button
                                        className="icon-remove-btn"
                                        onClick={() => removePart(part.id)}
                                        title="Usuń"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash3" viewBox="0 0 16 16">
                                            <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5" />
                                        </svg>
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {editMode && (
                <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2 px-2">
                    <button className="btn btn-custom" onClick={handleAddPart}>
                        Dodaj wiersz
                    </button>
                    <button className="btn btn-custom" onClick={onEndEdit}>
                        Zakończ edycję części
                    </button>
                </div>
            )}

            {selectedQR && <QRCodeModal qrData={selectedQR} onClose={() => setSelectedQR(null)} />}
            {noteModalContent && (
                <NoteModal
                    content={noteModalContent}
                    onClose={() => setNoteModalContent(null)}
                />
            )}
        </div>
    );
};

export default PartsTable;