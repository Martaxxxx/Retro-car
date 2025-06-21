import React, { useEffect, useState, lazy, Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import DatePicker, { registerLocale } from "react-datepicker";
import { pl } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import WheelSpinner from "../components/WheelSpinner";
import Navbar from "../components/Navbar";
import { ProjectData } from "../pages/projectData";
import { Part } from "../components/PartsTable";
import { generateProjectDetails } from "../utils/generateProjectDetails";
import axios from "../axios";


registerLocale("pl", pl);

const PartsTable = lazy(() => import("../components/PartsTable"));
const FileExplorerModal = lazy(() => import("../components/FileExplorerModal"));

interface FileData {
    name: string;
    size: number;
    type: string;
    file: File;
}

const ProjectDetails: React.FC = () => {
    const { projectId, name } = useParams<{ projectId: string; name: string }>();
    const [project, setProject] = useState<ProjectData | null>(null);
    const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
    const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
    const [editProjectMode, setEditProjectMode] = useState(false);
    const [editPartsMode, setEditPartsMode] = useState(false);
    const [files, setFiles] = useState<FileData[]>([]);
    const [showFileModal, setShowFileModal] = useState(false);
    const [newRole, setNewRole] = useState("");
    const [newName, setNewName] = useState("");
    const [timeLeft, setTimeLeft] = useState("");
    const [loading, setLoading] = useState(true); // Dodane
    const [error, setError] = useState<string | null>(null); // Dodane

    useEffect(() => {
        const fetchProject = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await axios.get(`/api/projectdetails/${projectId}/${encodeURIComponent(name || "")}`);
                const data = res.data;
                setProject({
                    id: data.id,
                    name: data.name,
                    image: data.image,
                    startDate: data.start_date,
                    endDate: data.end_date,
                    status: data.status,
                    brand: data.brand,
                    model: data.model,
                    year: data.year,
                    carId: data.car_id,
                    assignedTo: data.assignedTo || [],
                    description: data.description || "",
                    parts: (data.parts || []).map((part: any) => ({
                        id: String(part.id),
                        partCode: part.part_code,
                        name: part.name,
                        category: part.category,
                        notes: part.notes,
                        status: part.status,
                    })),
                });
                setSelectedStartDate(new Date(data.start_date));
                setSelectedEndDate(new Date(data.end_date));
            } catch (err: any) {
                setError("Nie udało się załadować projektu.");
                setProject(null);
            } finally {
                setLoading(false);
            }
        };

        if (projectId && name) {
            fetchProject();
        }
    }, [projectId, name]);

    useEffect(() => {
        if (project) {
            const endDate = new Date(project.endDate);
            const timer = setInterval(() => {
                const now = new Date();
                const diff = endDate.getTime() - now.getTime();
                if (diff <= 0) return setTimeLeft("Projekt zakończony!");
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((diff / (1000 * 60)) % 60);
                const seconds = Math.floor((diff / 1000) % 60);
                setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [project]);

    const handleInputChange = (field: keyof ProjectData, value: string) => {
        setProject((prev) => (prev ? { ...prev, [field]: value } : null));
    };

    const saveProjectDates = () => {
        setProject((prev) =>
            prev
                ? {
                      ...prev,
                      startDate: selectedStartDate?.toISOString() || prev.startDate,
                      endDate: selectedEndDate?.toISOString() || prev.endDate,
                  }
                : null
        );
    };

    const addUser = () => {
        if (!newRole || !newName) return;
        const newUser = `${newRole}_${newName}`;
        setProject((prev) =>
            prev ? { ...prev, assignedTo: [...(prev.assignedTo || []), newUser] } : null
        );
        setNewRole("");
        setNewName("");
    };

    const removeUser = (user: string) => {
        setProject((prev) =>
            prev
                ? {
                      ...prev,
                      assignedTo: (prev.assignedTo ?? []).filter((u) => u !== user),
                  }
                : null
        );
    };

    const updateStatus = async (partId: string, newStatus: Part["status"]) => {
        try {
            await axios.put(`/parts/${partId}`, { status: newStatus });
            setProject((prev) =>
                prev
                    ? {
                          ...prev,
                          parts: prev.parts.map((p) =>
                              p.id === partId ? { ...p, status: newStatus } : p
                          ),
                      }
                    : null
            );
        } catch (error) {
            console.error("Błąd podczas aktualizacji statusu części:", error);
        }
    };

    const updateField = async (
        partId: string,
        field: keyof Omit<Part, "id" | "partCode">,
        value: string
    ) => {
        try {
            const part = project?.parts.find((p) => p.id === partId);
            if (!part) return;
            const id = part.id;

            if (
                typeof id === "string" &&
                (id.startsWith("temp-") || id === "" || id.startsWith("p"))
            ) {
                setProject((prev) =>
                    prev
                        ? {
                              ...prev,
                              parts: prev.parts.map((p) =>
                                  p.id === partId ? { ...p, [field]: value } : p
                              ),
                          }
                        : null
                );
            } else {
                await axios.put(`/parts/${partId}`, { [field]: value });
                setProject((prev) =>
                    prev
                        ? {
                              ...prev,
                              parts: prev.parts.map((p) =>
                                  p.id === partId ? { ...p, [field]: value } : p
                              ),
                          }
                        : null
                );
            }
        } catch (error) {
            console.error("Błąd aktualizacji pola części:", error);
        }
    };

    const addPart = (newPart: Part) => {
        setProject((prev) =>
            prev ? { ...prev, parts: [...prev.parts, newPart] } : null
        );
    };

    const removePart = async (id: string) => {
        try {
            await axios.delete(`/parts/${id}`);
            setProject((prev) =>
                prev ? { ...prev, parts: prev.parts.filter((p) => p.id !== id) } : null
            );
        } catch (error) {
            console.error("Błąd usuwania części:", error);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploaded = e.target.files;
        if (!uploaded) return;
        const newFiles: FileData[] = Array.from(uploaded).map((file) => ({
            name: file.name,
            size: file.size,
            type: file.type,
            file: file,
        }));
        setFiles((prev) => [...prev, ...newFiles]);
    };

    const handleRemoveFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const savePartsEdits = async () => {
        if (!project) return;

        try {
            let updatedParts: Part[] = [];

            for (const part of project.parts) {
                const id = part.id;

                if (typeof id === "string" && id.startsWith("temp-")) {
                    if ((part.partCode ?? "").trim() && (part.name ?? "").trim()) {
                        const response = await axios.post(`/projects/${project.id}/parts`, {
                            part_code: part.partCode,
                            name: part.name,
                            category: part.category,
                            notes: part.notes,
                            status: part.status,
                        });

                        updatedParts.push({
                            ...response.data,
                            partCode: response.data.partCode || response.data.part_code || part.partCode,
                        });
                    }
                } else {
                    await axios.put(`/parts/${part.id}`, {
                        name: part.name,
                        category: part.category,
                        notes: part.notes,
                        status: part.status,
                    });

                    updatedParts.push(part);
                }
            }

            setProject((prev) =>
                prev
                    ? {
                          ...prev,
                          parts: updatedParts,
                      }
                    : null
            );

            setEditPartsMode(false);
        } catch (err) {
            alert("Błąd zapisu części: " + err);
        }
    };

    // === WAŻNE: Pokaż spinner, błąd lub brak projektu ===
    if (loading) return <WheelSpinner />;
    if (error) return <div className="container mt-5 text-danger">{error}</div>;
    if (!project) return <div className="container mt-5">Brak projektu.</div>;

    return (
        <>
            <Navbar />
            <div className="container mt-5 pt-5">
                <div className="row">
                    {/* Zdjęcie */}
                    <div className="col-md-4 order-md-1">
                        <img
                            src={
                                project.image?.startsWith("/storage/")
                                    ? project.image
                                    : `/storage/${project.image}`
                            }
                            alt={`Zdjęcie: ${project.name}`}
                            className="img-fluid rounded mb-3"
                            onError={(e) => {
                                e.currentTarget.src = "/default-avatar.png";
                            }}
                        />
                    </div>

                    {/* Dane projektu */}
                    <div style={{ flex: "1 1 40%", maxWidth: "40%", minWidth: "280px" }} className="order-md-2 order-3">
                        {editProjectMode ? (
                            <>
                                {["name", "status", "brand", "model", "year", "carId"].map((field) => (
                                    <input
                                        key={field}
                                        type="text"
                                        className="form-control form-control-sm mb-2"
                                        style={{ maxWidth: "500px", height: "40px" }}
                                        value={project[field as keyof ProjectData] as string}
                                        onChange={(e) => handleInputChange(field as keyof ProjectData, e.target.value)}
                                    />
                                ))}

                                <div className="mb-3" style={{ maxWidth: "500px" }}>
                                    <label className="form-label">Użytkownicy:</label>
                                    <ul className="list-unstyled mb-3">
                                        {project.assignedTo?.map((u, i) => (
                                            <li
                                                key={i}
                                                className="d-flex justify-content-between align-items-center bg-light mb-2 rounded border px-2 py-1"
                                            >
                                                <span>{u}</span>
                                                <button
                                                    type="button"
                                                    className="btn-icon"
                                                    onClick={() => removeUser(u)}
                                                    title="Usuń użytkownika"
                                                >
                                                    <i className="bi bi-x"></i>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="d-flex align-items-center mb-3 gap-2">
                                        <select
                                            className="form-control"
                                            style={{ height: "40px" }}
                                            value={newRole}
                                            onChange={(e) => setNewRole(e.target.value)}
                                        >
                                            <option value="">Rola</option>
                                            <option value="Blacharz">Blacharz</option>
                                            <option value="Lakiernik">Lakiernik</option>
                                            <option value="Mechanik">Mechanik</option>
                                        </select>

                                        <select
                                            className="form-control"
                                            style={{ height: "40px" }}
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                        >
                                            <option value="">Imię</option>
                                            <option value="Arek">Arek</option>
                                            <option value="Kasia">Kasia</option>
                                            <option value="Marek">Marek</option>
                                        </select>

                                        <button
                                            type="button"
                                            className="btn-icon"
                                            onClick={addUser}
                                            title="Dodaj użytkownika"
                                        >
                                            <i className="bi bi-plus"></i>
                                        </button>
                                    </div>
                                </div>

                                <button
                                    className="btn btn-outline-dark hover-black mb-2"
                                    onClick={() => {
                                        saveProjectDates();
                                        setEditProjectMode(false);
                                    }}
                                >
                                    Zapisz zmiany
                                </button>
                            </>
                        ) : (
                            <>
                                <h2>{project.name}</h2>
                                <p><strong>Status:</strong> {project.status}</p>
                                <p><strong>Marka:</strong> {project.brand}</p>
                                <p><strong>Model:</strong> {project.model}</p>
                                <p><strong>Rocznik:</strong> {project.year}</p>
                                <p><strong>Zlecenie:</strong> {project.carId}</p>
                                <p><strong>Użytkownicy:</strong> {project.assignedTo?.join(", ") ?? "Brak"}</p>
                            </>
                        )}

                        <div className="d-flex flex-wrap gap-2 mt-3">
                            <input type="file" className="form-control" onChange={handleFileUpload} multiple />
                            <Link to={`/projectdetails/${project.id}/lista_zakupow`} className="btn btn-outline-dark">
                                🛒 Lista zakupów
                            </Link>
                            <button className="btn btn-outline-dark" onClick={() => setShowFileModal(true)}>
                                📁 Moje pliki ({files.length})
                            </button>
                            <button className="btn btn-outline-dark" onClick={() => setEditProjectMode(!editProjectMode)}>
                                {editProjectMode ? "Anuluj edycję" : "Edytuj projekt"}
                            </button>
                        </div>
                    </div>

                    {/* Kalendarz */}
                    <div className="calendar-wrapper order-md-3 order-2" style={{ marginLeft: "20px" }}>
                        <div className="calendar-section">
                            <label className="label-date">Data Startu:</label>
                            <DatePicker
                                selected={selectedStartDate}
                                onChange={(date: Date | null) => setSelectedStartDate(date)}
                                dateFormat="yyyy-MM-dd"
                                className="date-picker burgundy-picker"
                                placeholderText="Wybierz datę startu"
                                locale="pl"
                            />

                            <label className="label-date mt-2">Data Zakończenia:</label>
                            <DatePicker
                                selected={selectedEndDate}
                                onChange={(date: Date | null) => setSelectedEndDate(date)}
                                dateFormat="yyyy-MM-dd"
                                className="date-picker burgundy-picker"
                                placeholderText="Wybierz datę zakończenia"
                                locale="pl"
                                minDate={selectedStartDate ?? undefined}
                            />
                        </div>
                    </div>
                </div>

                <div className="time-left mt-4" style={{ color: "#b03a2e", fontWeight: "bold" }}>
                    ⏳ <strong>Pozostały czas do zakończenia:</strong> {timeLeft}
                </div>

                <Suspense fallback={<div>Ładowanie części...</div>}>
                    <PartsTable
                        parts={project.parts}
                        updateStatus={updateStatus}
                        updateField={updateField}
                        addPart={addPart}
                        removePart={removePart}
                        editMode={editPartsMode}
                        projectName={project.name}
                        onEndEdit={async () => {
                            await savePartsEdits(); // zapisuje zmiany
                            setEditPartsMode(false); // kończy edycję
                        }}
                        onToggleEdit={() => setEditPartsMode((prev) => !prev)}
                        onGeneratePDF={() => generateProjectDetails(project)}
                    />
                </Suspense>

                {showFileModal && (
                    <Suspense fallback={<div>Ładowanie plików...</div>}>
                        <FileExplorerModal
                            files={files}
                            onClose={() => setShowFileModal(false)}
                            onRemove={handleRemoveFile}
                        />
                    </Suspense>
                )}
            </div>
        </>
    );
};

export default ProjectDetails;