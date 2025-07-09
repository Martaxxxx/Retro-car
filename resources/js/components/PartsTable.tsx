import React, { useEffect, useState, useRef } from "react";
import { FaFilter } from "react-icons/fa";
import QRCodeModal from "./QRCodeModal";
import Select from "react-select";
import NoteModal from "./NoteModal";

declare global {
  interface Window {
    QRCode: any;
  }
}

export const statusLabels: Record<string, string> = {
  pending: "W przygotowaniu",
  ready: "Gotowy do montażu",
  installed: "Zamontowany",
};

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
  updateField: (
    partId: string,
    field: keyof Omit<Part, "id" | "partCode">,
    value: string
  ) => void;
  addPart: (newPart: Part) => void;
  removePart: (id: string) => void;
  editMode: boolean;
  projectName: string;
  onEndEdit?: () => void;
  onToggleEdit: () => void;
  onGeneratePDF: () => void;
  projectId: string;
}

const customSelectStyles = {
  control: (base) => ({
    ...base,
    backgroundColor: "#fff",
    borderColor: "#9C2F3B",
    boxShadow: "none",
    "&:hover": { borderColor: "#9C2F3B" },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "#9C2F3B" : "#fff",
    color: state.isFocused ? "#fff" : "#000",
    cursor: "pointer",
  }),
};

const statusOptions = [
  { value: "pending", label: "W przygotowaniu" },
  { value: "ready", label: "Gotowy do montażu" },
  { value: "installed", label: "Zamontowany" },
];

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
  projectId,
}) => {
  const [isQRCodeReady, setQRCodeReady] = useState(false);
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const addRowButtonRef = useRef<HTMLButtonElement>(null);
  const [noteModalContent, setNoteModalContent] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    partCode: "",
    name: "",
    category: "",
    notes: "",
    status: "",
  });

  const itemsPerPage = 25;
  const [currentPage, setCurrentPage] = useState(1);

  // Scroll to "Dodaj wiersz" button when entering editMode
  useEffect(() => {
    if (editMode && addRowButtonRef.current) {
      setTimeout(() => {
        addRowButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [editMode]);

  // Filtered parts
  const filteredParts = parts.filter(
    (part) =>
      (part.partCode ?? "").toLowerCase().includes(filters.partCode.toLowerCase()) &&
      (part.name ?? "").toLowerCase().includes(filters.name.toLowerCase()) &&
      (part.category ?? "").toLowerCase().includes(filters.category.toLowerCase()) &&
      (part.notes ?? "").toLowerCase().includes(filters.notes.toLowerCase()) &&
      (!filters.status || part.status === filters.status)
  );
  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);

  // Paginated parts slice
  const paginatedParts = filteredParts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page to 1 if filters change and current page would be out of bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [filters, totalPages]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js";
    script.async = true;
    script.onload = () => setQRCodeReady(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const generateQRCode = (id: string, partCode: string, partName: string) => {
    const element = document.getElementById(`qrcode-${id}`);
    if (element && typeof window.QRCode === "function") {
      element.innerHTML = "";
      new window.QRCode(element, {
        text: `${projectName}, ${partCode}, ${partName}`,
        width: 100,
        height: 100,
      });
    }
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
      .filter((part) => selectedIds.includes(part.id))
      .map((part) => {
        const canvas = document
          .getElementById(`qrcode-${part.id}`)
          ?.querySelector("canvas");
        const dataUrl = canvas?.toDataURL() ?? "";
        return `<div class="part"><img src="${dataUrl}" width="100" height="100" /><div><strong>${part.partCode}</strong> - ${part.name}</div></div>`;
      })
      .join("");

    printWindow.document.write(htmlStart + content + htmlEnd);
    printWindow.document.close();
  };

  useEffect(() => {
    if (!isQRCodeReady || typeof window.QRCode !== "function") return;
    const timeout = setTimeout(() => {
      paginatedParts.forEach((part) => {
        if ((part.partCode ?? "").trim() && (part.name ?? "").trim()) {
          generateQRCode(part.id, part.partCode, part.name);
        }
      });
    }, 100);
    return () => clearTimeout(timeout);
  }, [paginatedParts, isQRCodeReady, projectName]);

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const handleAddPart = () => {
    if (!editMode) return;
  
    // Zlicz wszystkie części (zatwierdzone i tymczasowe), które zaczynają się od kodu tego projektu
    const existingNumbers = parts
      .filter(p => p.partCode.startsWith(`${projectId}-`))
      .map(p => parseInt(p.partCode.split("-")[1], 10))
      .filter(n => !isNaN(n));
  
    // Wyznacz pierwszy wolny numer (np. 1,2,4 -> daje 3 jeśli dodać nowy)
    let nextNumber = 1;
    while (existingNumbers.includes(nextNumber)) {
      nextNumber++;
    }
    const nextNumberStr = String(nextNumber).padStart(3, "0");
    const newPartCode = `${projectId}-${nextNumberStr}`;
    const tempId = `temp-${Date.now()}-${Math.random()}`;
  
    addPart({
      id: tempId,
      partCode: newPartCode,
      name: "",
      category: "",
      notes: "",
      status: "pending",
    });
  };
  

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredParts.map((part) => part.id));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        expandedNoteId &&
        tableRef.current &&
        !tableRef.current.contains(event.target as Node)
      ) {
        setExpandedNoteId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expandedNoteId]);

  // Pokaż tylko wiersze z nazwą jeśli nie editMode
  const visibleParts = paginatedParts.filter(
    (part) => editMode || (part.name && part.name.trim() !== "")
  );

  // Wykrycie nowego wiersza (temp id)
  const isNewRow = (part: Part) => typeof part.id === "string" && part.id.startsWith("temp-");

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
                      onChange={e => handleFilterChange(field as keyof typeof filters, e.target.value)}
                    />
                  )}
                </td>
              ))}
              {editMode && <td></td>}
            </tr>
          )}
        </thead>
        <tbody>
          {visibleParts.map(part => (
            <tr key={part.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(part.id)}
                  onChange={() => toggleSelectOne(part.id)}
                />
              </td>
              <td>
                {((part.partCode ?? "").trim() && (part.name ?? "").trim()) ? (
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
                      if ((part.partCode ?? "").trim() !== "" && (part.name ?? "").trim() !== "") {
                        setSelectedQR(`${projectName}, ${part.partCode}, ${part.name}`);
                      }
                    }}
                  >
                    {}
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
                    value={part.name ?? ""}
                    onChange={(e) => updateField(part.id, "name", e.target.value)}
                  />
                ) : part.name}
              </td>
              <td>
                {editMode ? (
                  <input
                    className="form-control form-control-sm"
                    value={part.category ?? ""}
                    onChange={(e) => updateField(part.id, "category", e.target.value)}
                  />
                ) : part.category}
              </td>
              <td style={{ position: 'relative' }}>
                {editMode ? (
                  <textarea
                    className="form-control form-control-sm"
                    value={part.notes ?? ""}
                    onChange={(e) => updateField(part.id, "notes", e.target.value)}
                    rows={2}
                  />
                ) : (part.notes ?? "").length > 40 ? (
                  <>
                    {(part.notes ?? "").substring(0, 40)}...
                    <button
                      className="btn btn-link btn-sm"
                      onClick={() => setNoteModalContent(part.notes ?? "")}
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
                    options={statusOptions}
                    value={statusOptions.find(opt => opt.value === part.status)}
                    onChange={(selected) => {
                      if (isNewRow(part)) {
                        updateField(part.id, "status", selected?.value as Part["status"]);
                      } else {
                        updateStatus(part.id, selected?.value as Part["status"]);
                      }
                    }}
                    isSearchable={false}
                  />
                ) : (
                  <span>
                    {statusLabels[part.status]}
                  </span>
                )}
              </td>
              {editMode && (
                <td className="text-center">
                  <button
                    className="icon-remove-btn"
                    onClick={() => removePart(part.id)}
                    title="Usuń"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-trash3" viewBox="0 0 16 16">
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
          <button
            className="btn btn-custom"
            onClick={handleAddPart}
            ref={addRowButtonRef}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
            Dodaj wiersz
          </button>
          <button
            className="btn btn-custom"
            onClick={() => {
              onEndEdit?.();
            }}
          >
            Zapisz zmiany
          </button>
        </div>
      )}

      {!editMode && totalPages > 1 && (
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