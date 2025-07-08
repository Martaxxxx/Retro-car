import React, { useEffect, useState, lazy, Suspense } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import DatePicker, { registerLocale } from "react-datepicker";
import { pl } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import WheelSpinner from "../components/WheelSpinner";
import Navbar from "../components/Navbar";
import { Part } from "../components/PartsTable";
import { generateProjectDetails } from "../utils/generateProjectDetails";
import axios from "../axios";
import { Project } from "../types/Project";
import Select from "react-select";

registerLocale("pl", pl);

const PartsTable = lazy(() => import("../components/PartsTable"));
const FileExplorerModal = lazy(() => import("../components/FileExplorerModal"));

interface FileData {
    id?: number;
    name: string;
    size: number;
    type: string;
    file?: File;
    url: string;
}

interface CurrentUser {
    id: number;
    name: string;
    surname: string;
    roles: string[];
}

const customSelectStyles = {
    control: (base) => ({
        ...base,
        backgroundColor: "#fff",
        borderColor: "#9C2F3B",
        boxShadow: "none",
        "&:hover": { borderColor: "#9C2F3B" }
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? "#9C2F3B" : "#fff",
        color: state.isFocused ? "#fff" : "#000",
        cursor: "pointer"
    })
};

const ProjectDetails: React.FC = () => {
    const { projectId, name } = useParams<{ projectId: string; name: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
    const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
    const [editProjectMode, setEditProjectMode] = useState(false);
    const [editPartsMode, setEditPartsMode] = useState(false);
    const [files, setFiles] = useState<FileData[]>([]);
    const [showFileModal, setShowFileModal] = useState(false);
    const [timeLeft, setTimeLeft] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [allUsers, setAllUsers] = useState<{ id: number; name: string; surname: string }[]>([]);
    const [userIds, setUserIds] = useState<number[]>([]);
    const [savingParts, setSavingParts] = useState(false);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

    const navigate = useNavigate();

    // Pobierz info o użytkowniku (endpoint poprawiony na /api/user!)
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

    // Pobierz projekt i użytkowników (jeśli można edytować projekt)
    useEffect(() => {
        const fetchProjectAndUsers = async () => {
            try {
                setLoading(true);
                setError(null);

                const projectRes = await axios.get(`/api/projectdetails/${projectId}/${encodeURIComponent(name || "")}`);
                const data = projectRes.data;
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
                    users: data.users || [],
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
                setUserIds((data.users || []).map((u: any) => u.id));
                setSelectedStartDate(new Date(data.start_date));
                setSelectedEndDate(new Date(data.end_date));
                if (Array.isArray(data.files)) {
                    const existingFiles: FileData[] = data.files.map((f: any) => ({
                        id: f.id,
                        name: f.original_name || f.name,
                        size: f.size,
                        type: f.mime_type || f.type || "",
                        url: f.stored_path || f.url || `/storage/${f.name}`,
                    }));
                    setFiles(existingFiles);
                } else {
                    setFiles([]);
                }

                // Pobieraj użytkowników tylko jeśli edycja projektu jest możliwa
                if (
                    currentUser &&
                    Array.isArray(currentUser.roles) &&
                    (currentUser.roles.includes("admin") || currentUser.roles.includes("manager"))
                ) {
                    const usersRes = await axios.get("/api/users");
                    setAllUsers(usersRes.data || []);
                } else {
                    setAllUsers([]);
                }
            } catch (err: any) {
                setError("Nie udało się załadować projektu.");
                setProject(null);
            } finally {
                setLoading(false);
            }
        };

        if (projectId && name && currentUser) {
            fetchProjectAndUsers();
        }
    }, [projectId, name, currentUser]);

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

    const handleInputChange = (field: keyof Project, value: string) => {
        setProject((prev) => (prev ? { ...prev, [field]: value } : null));
    };

    const saveProjectChanges = async () => {
        if (!project) return;
        try {
            const res = await axios.put(`/projects/${project.id}`, {
                start_date: selectedStartDate?.toISOString(),
                end_date: selectedEndDate?.toISOString(),
                user_ids: userIds,
            });

            const updated = res.data.project;
            setProject((prev) =>
                prev ? { ...prev, users: updated.users } : prev
            );
            setEditProjectMode(false);
            window.dispatchEvent(new Event("notifications:update"));
        } catch (err) {
            console.error("Błąd zapisu zmian projektu:", err);
        }
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

    const updateField = (
        partId: string,
        field: keyof Omit<Part, "id" | "partCode">,
        value: string
    ) => {
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
    };

    const addPart = (newPart: Part) => {
        console.log("Dodaję część:", newPart);
        setProject((prev) => {
            if (!prev) return null;

            const isDuplicate = prev.parts.some(
                (p) => p.partCode === newPart.partCode && p.name.trim() === ""
            );

            if (isDuplicate) {
                console.warn("Pominięto duplikat tymczasowej części:", newPart);
                return prev; // nie dodawaj drugi raz
            }

            return {
                ...prev,
                parts: [...prev.parts, newPart],
            };
        });
    };

    const removePart = async (id: string) => {
        try {
            await axios.delete(`/parts/${id}`);
            setProject((prev) =>
                prev ? { ...prev, parts: prev.parts.filter((p) => p.id !== id) } : null
            );
            window.dispatchEvent(new Event("notifications:update"));
        } catch (error) {
            console.error("Błąd usuwania części:", error);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFiles = e.target.files;
        if (!uploadedFiles) return;
        const filesArray = Array.from(uploadedFiles);

        for (const file of filesArray) {
            const formData = new FormData();
            formData.append("file", file);
            try {
                await axios.post(`/projects/${projectId}/files`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } catch (err: any) {
                if (err.response) {
                    console.error("Odpowiedź serwera:", err.response.data);
                    alert("Błąd serwera: " + JSON.stringify(err.response.data));
                } else {
                    console.error("Inny błąd:", err);
                    alert("Błąd przesyłania pliku: " + file.name);
                }
            }
        }

        try {
            const refreshed = await axios.get(`/projects/${projectId}/files`);
            const fetched = (refreshed.data || []).map((f: any) => ({
                id: f.id,
                name: f.original_name || f.name,
                size: f.size,
                type: f.mime_type || f.type || "",
                url: f.stored_path || f.url || `/storage/${f.name}`,
            }));
            setFiles(fetched);
        } catch (err) {
            console.error("Błąd odświeżenia plików po uploadzie", err);
        }
        e.target.value = "";
    };

    const handleRemoveFile = async (index: number) => {
        setFiles((prev) => {
            const fileToRemove = prev[index];
            if (!fileToRemove) return prev;
            if (fileToRemove.id) {
                axios.delete(`/projects/files/${fileToRemove.id}`)
                    .catch(err => console.error("Błąd usuwania pliku na serwerze:", err));
            }
            const updatedFiles = prev.filter((_, i) => i !== index);
            return updatedFiles;
        });
    };

    const savePartsEdits = async () => {
        if (!project) return;
        setSavingParts(true);
        try {
            // Zapisz nowe części (POST)
            const newParts = project.parts.filter(p => typeof p.id === "string" && p.id.startsWith("temp-"));
            for (const part of newParts) {
                const partCodeToSend = part.partCode?.trim() ? part.partCode : part.name;
                if ((partCodeToSend ?? "").trim() && (part.name ?? "").trim()) {
                    await axios.post(`/projects/${project.id}/parts`, {
                        part_code: partCodeToSend,
                        name: part.name,
                        category: part.category,
                        notes: part.notes,
                        status: part.status,
                    });
                }
            }
            // Zaktualizuj istniejące części (PUT)
            const existingParts = project.parts.filter(p => !(typeof p.id === "string" && p.id.startsWith("temp-")));
            await Promise.all(
                existingParts.map(async part => {
                    await axios.put(`/parts/${part.id}`, {
                        name: part.name,
                        category: part.category,
                        notes: part.notes,
                        status: part.status,
                    });
                })
            );
            // Pobierz części z backendu!
            const refreshed = await axios.get(`/api/projectdetails/${project.id}/${encodeURIComponent(project.name)}`);
            const data = refreshed.data;
            setProject(prev => prev ? {
                ...prev,
                parts: (data.parts || []).map((part: any) => ({
                    id: String(part.id),
                    partCode: part.part_code,
                    name: part.name,
                    category: part.category,
                    notes: part.notes,
                    status: part.status,
                }))
            } : null);
            window.dispatchEvent(new Event("notifications:update"));
            setEditPartsMode(false);
        } catch (err) {
            alert("Błąd zapisu części: " + err);
        } finally {
            setSavingParts(false);
        }
    };

    const canEditProject = !!currentUser && Array.isArray(currentUser.roles) && (
        currentUser.roles.includes("admin") || currentUser.roles.includes("manager")
    );

    const handleDeleteProject = async () => {
        if (!project) return;
        if (!window.confirm("Czy na pewno chcesz usunąć ten projekt? Operacja nieodwracalna!")) return;
        try {
            await axios.delete(`/projects/${project.id}`);
            alert("Projekt został usunięty.");
            navigate("/");
        } catch (err) {
            alert("Błąd podczas usuwania projektu.");
            console.error(err);
        }
    };

    if (loading) return <WheelSpinner />;
    if (error) return <div className="container mt-5 text-danger">{error}</div>;
    if (!project) return <div className="container mt-5">Brak projektu.</div>;

    return (
        <>
            <Navbar />
            <div className="container mt-5 pt-5">
                <div className="row">
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
                    <div style={{ flex: "1 1 40%", maxWidth: "40%", minWidth: "280px" }} className="order-md-2 order-3">
                        {editProjectMode ? (
                            <>
                                {["name", "status", "brand", "model", "year", "carId"].map((field) => (
                                    <input
                                        key={field}
                                        type="text"
                                        className="form-control form-control-sm mb-2"
                                        style={{ maxWidth: "500px", height: "40px" }}
                                        value={project[field as keyof Project] as string}
                                        onChange={(e) => handleInputChange(field as keyof Project, e.target.value)}
                                    />
                                ))}
                                <div className="mb-3" style={{ maxWidth: "500px" }}>
                                    <label className="form-label">Użytkownicy:</label>
                                    <Select
                                        isMulti
                                        placeholder="Wybierz użytkowników..."
                                        options={allUsers.map(user => ({
                                            value: user.id,
                                            label: `${user.name} ${user.surname}`,
                                        }))}
                                        value={allUsers
                                            .filter(user => userIds.includes(user.id))
                                            .map(user => ({
                                                value: user.id,
                                                label: `${user.name} ${user.surname}`,
                                            }))
                                        }
                                        onChange={(selected) => {
                                            setUserIds(selected.map(s => s.value));
                                        }}
                                        styles={customSelectStyles}
                                    />
                                </div>
                                <button
                                    className="btn btn-outline-dark hover-black mb-2"
                                    onClick={saveProjectChanges}
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
                                <p><strong>Użytkownicy:</strong> {project.users && project.users.length > 0 ? project.users.map(u => `${u.name} ${u.surname}`).join(", ") : "Brak"}</p>
                            </>
                        )}

                        <div className="d-flex flex-wrap gap-2 mt-3 align-items-center">
                            <input
                                type="file"
                                className="form-control"
                                onChange={handleFileUpload}
                                multiple
                            />
                            <Link to={`/projectdetails/${project.id}/lista_zakupow`} className="btn btn-outline-dark">
                                🛒 Lista zakupów
                            </Link>
                            <button
                                className="btn btn-outline-dark"
                                onClick={() => setShowFileModal(true)}
                            >
                                📁 Moje pliki ({files.length})
                            </button>
                            {canEditProject && (
                                <button
                                    className="btn btn-outline-dark"
                                    onClick={() => setEditProjectMode(!editProjectMode)}
                                >
                                    {editProjectMode ? "Anuluj edycję" : "Edytuj projekt"}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="calendar-wrapper order-md-3 order-2 d-flex align-items-start" style={{ marginLeft: "4px" }}>
                        {canEditProject && editProjectMode && (
                            <button
                                className="btn btn-danger me-3"
                                title="Usuń projekt"
                                onClick={handleDeleteProject}
                                style={{
                                    width: 40,
                                    height: 40,
                                    padding: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "6px",
                                    border: "2px solid #dc3545",
                                    backgroundColor: "#dc3545",
                                    color: "#fff",
                                    boxShadow: "0 2px 6px rgba(220,53,69,0.08)",
                                    transition: "background 0.2s",
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M3 6h18M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
                                </svg>
                            </button>
                        )}
                        <div className="calendar-section flex-grow-1">
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

                {savingParts ? (
                    <div className="d-flex justify-content-center align-items-center my-5">
                        <WheelSpinner />
                        <span className="ms-2">Zapisywanie zmian...</span>
                    </div>
                ) : (
                    <Suspense fallback={<div>Ładowanie części...</div>}>
                        {currentUser?.roles && !currentUser.roles.includes("purchaser") && (
                            <PartsTable
                                parts={project.parts}
                                updateStatus={updateStatus}
                                updateField={updateField}
                                addPart={addPart}
                                removePart={removePart}
                                editMode={editPartsMode}
                                projectName={project.name}
                                projectId={project.id}
                                onEndEdit={async () => {
                                    await savePartsEdits();
                                }}
                                onToggleEdit={() => setEditPartsMode((prev) => !prev)}
                                onGeneratePDF={() =>
                                    generateProjectDetails(
                                        project,
                                        currentUser ? `${currentUser.name} ${currentUser.surname}` : undefined
                                    )
                                }
                            />
                        )}
                    </Suspense>
                )}

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