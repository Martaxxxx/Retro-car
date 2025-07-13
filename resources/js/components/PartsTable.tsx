import React, { useEffect, useState, useRef } from "react";
import {
  Filter as LucideFilter,
  Printer as LucidePrinter,
  FileText as LucideFileText,
  Trash2 as LucideTrash2,
  Plus as LucidePlus
} from "lucide-react";
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
  control: (base: any) => ({
    ...base,
    backgroundColor: "#fff",
    borderColor: "#9C2F3B",
    boxShadow: "none",
    "&:hover": { borderColor: "#9C2F3B" },
  }),
  option: (base: any, state: any) => ({
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

  const addRowButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (editMode && addRowButtonRef.current) {
      setTimeout(() => {
        addRowButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [editMode]);

  const filteredParts = parts.filter(
    (part) =>
      (part.partCode ?? "").toLowerCase().includes(filters.partCode.toLowerCase()) &&
      (part.name ?? "").toLowerCase().includes(filters.name.toLowerCase()) &&
      (part.category ?? "").toLowerCase().includes(filters.category.toLowerCase()) &&
      (part.notes ?? "").toLowerCase().includes(filters.notes.toLowerCase()) &&
      (!filters.status || part.status === filters.status)
  );
  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);

  const paginatedParts = filteredParts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
    const existingNumbers = parts
      .filter(p => p.partCode.startsWith(`${projectId}-`))
      .map(p => parseInt(p.partCode.split("-")[1], 10))
      .filter(n => !isNaN(n));
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

  const visibleParts = paginatedParts.filter(
    (part) => editMode || (part.name && part.name.trim() !== "")
  );

  const isNewRow = (part: Part) => typeof part.id === "string" && part.id.startsWith("temp-");

  return (
    <div ref={tableRef}>
      <div className="mt-5">
        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap px-2">
          <div className="d-flex align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontWeight: "bold", fontSize: "1.3rem", color: "#333" }}>Filtr</span>
              <LucideFilter
                style={{ cursor: "pointer", fontSize: "1.2rem", color: "#9C2F3B" }}
                onClick={() => setShowFilters(prev => !prev)}
              />
            </div>
            <button
              className="btn btn-custom ms-3"
              onClick={handlePrintQRs}
              disabled={selectedIds.length === 0}
            >
              <LucidePrinter size={20} color="#fff" style={{ marginRight: 6, verticalAlign: "middle", position: "relative", top: "-2px" }} /> QR
            </button>
          </div>

          {!editMode && (
            <div className="d-flex mt-md-0 ms-8 mt-2 gap-2">
              <button className="btn btn-custom" onClick={onGeneratePDF}>
                <LucideFileText size={20} style={{ marginRight: 6, verticalAlign: "middle", position: "relative", top: "-2px" }} /> Pobierz PDF
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
            <th style={{ textAlign: "center", verticalAlign: "middle", width: "60px" }}>
              <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
            </th>
            <th style={{ textAlign: "center", verticalAlign: "middle", width: "120px" }}>QR Kod</th>
            <th style={{ textAlign: "center", verticalAlign: "middle" }}>Kod części</th>
            <th style={{ textAlign: "center", verticalAlign: "middle" }}>Nazwa</th>
            <th style={{ textAlign: "center", verticalAlign: "middle" }}>Kategoria</th>
            <th style={{ textAlign: "center", verticalAlign: "middle" }}>Notatki</th>
            <th style={{ textAlign: "center", verticalAlign: "middle" }}>Status</th>
            {editMode && <th style={{ textAlign: "center", verticalAlign: "middle" }}>Usuń</th>}
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
              <td style={{ textAlign: "center", verticalAlign: "middle", width: "60px" }}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(part.id)}
                  onChange={() => toggleSelectOne(part.id)}
                />
              </td>
              <td style={{ textAlign: "center", verticalAlign: "middle", width: "120px" }}>
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
                  </div>
                ) : (
                  <span className="text-muted" style={{ fontSize: "0.8rem" }}>Uzupełnij dane</span>
                )}
              </td>
              <td style={{ textAlign: "center", verticalAlign: "middle" }}>{part.partCode}</td>
              <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                {editMode ? (
                  <input
                    className="form-control form-control-sm"
                    value={part.name ?? ""}
                    onChange={(e) => updateField(part.id, "name", e.target.value)}
                  />
                ) : part.name}
              </td>
              <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                {editMode ? (
                  <input
                    className="form-control form-control-sm"
                    value={part.category ?? ""}
                    onChange={(e) => updateField(part.id, "category", e.target.value)}
                  />
                ) : part.category}
              </td>
              <td style={{ position: 'relative', textAlign: "center", verticalAlign: "middle" }}>
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
              <td style={{ textAlign: "center", verticalAlign: "middle" }}>
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
                <td className="text-center" style={{ verticalAlign: "middle" }}>
                  <button
                    className="icon-remove-btn"
                    onClick={() => removePart(part.id)}
                    title="Usuń"
                  >
                    <LucideTrash2 size={20} color="#b03a2e" />
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
            <LucidePlus size={24} style={{ marginRight: 6, verticalAlign: "middle" }} />
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