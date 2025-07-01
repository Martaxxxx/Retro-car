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
import type { FileData } from "../components/FileExplorerModal";

registerLocale("pl", pl);

const PartsTable = lazy(() => import("../components/PartsTable"));
const FileExplorerModal = lazy(() => import("../components/FileExplorerModal"));

const ProjectDetails: React.FC = () => {
    const { projectId, name } = useParams<{ projectId: string; name: string }>();
    const [project, setProject] = useState<ProjectData | null>(null);
    const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
    const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
    const [editProjectMode, setEditProjectMode] = useState(false);
    const [editPartsMode, setEditPartsMode] = useState(false);
    const [files, setFiles] = useState<FileData[]>([]);
    const [backendFiles, setBackendFiles] = useState<FileData[]>([]);
    const [showFileModal, setShowFileModal] = useState(false);
    const [newRole, setNewRole] = useState("");
    const [newName, setNewName] = useState("");
    const [timeLeft, setTimeLeft] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                fetchFiles(data.id);
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

    const fetchFiles = async (projId: string | number) => {
        try {
            const res = await axios.get(`/projects/${projId}/files`);
            setBackendFiles(res.data);
        } catch (e) {
            console.error("Błąd pobierania plików:", e);
        }
    };

    const uploadFiles = async () => {
        if (!files.length || !project) return;
        const formData = new FormData();
        files.forEach((f) => {
         if ("file" in f) formData.append("files[]", f.file);
        });


        try {
            await axios.post(`/projects/${project.id}/files`, formData);
            setFiles([]);
            fetchFiles(project.id);
        } catch (e) {
            alert("Błąd wysyłania plików");
        }
    };

    const deleteFile = async (id: number) => {
        try {
            await axios.delete(`/projects/files/${id}`);
            fetchFiles(project?.id ?? "");
        } catch (e) {
            alert("Błąd usuwania pliku");
        }
    };

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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploaded = e.target.files;
        if (!uploaded) return;
        const newFiles = Array.from(uploaded).map((file) => ({
            name: file.name,
        size: file.size,
        type: file.type,
        file: file,
        } as FileData));

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
                    <div className="col-md-4 order-md-1">
                        <img
                            src={
                                project?.image?.startsWith("/storage/")
                                    ? project.image
                                    : `/storage/${project?.image}`
                            }
                            alt={`Zdjęcie: ${project?.name}`}
                            className="img-fluid rounded mb-3"
                            onError={(e) => {
                                e.currentTarget.src = "/default-avatar.png";
                            }}
                        />
                    </div>

                    <div className="col-md-8">
                        <h2>{project?.name}</h2>
                        <p><strong>Status:</strong> {project?.status}</p>
                        <p><strong>Marka:</strong> {project?.brand}</p>
                        <p><strong>Model:</strong> {project?.model}</p>
                        <p><strong>Rocznik:</strong> {project?.year}</p>
                        <p><strong>Zlecenie:</strong> {project?.carId}</p>
                        <p><strong>Użytkownicy:</strong> {project?.assignedTo?.join(", ")}</p>

                        <input type="file" multiple onChange={handleFileUpload} />
                        <button className="btn btn-dark mt-2 me-2" onClick={uploadFiles}>Zapisz pliki</button>
                        <button className="btn btn-outline-dark mt-2" onClick={() => setShowFileModal(true)}>
                            📁 Moje pliki ({backendFiles.length})
                        </button>
                    </div>
                </div>

                {showFileModal && (
                    <Suspense fallback={<div>Ładowanie plików...</div>}>
                        <FileExplorerModal
                            files={[...backendFiles, ...files]}
                            onClose={() => setShowFileModal(false)}
                            onRemove={(index) => {
                                const isBackend = index < backendFiles.length;
                                if (isBackend) {
                                    const file = backendFiles[index];
                                    if ("id" in file && file.id) deleteFile(file.id);
                                } else {
                                    const newIndex = index - backendFiles.length;
                                    handleRemoveFile(newIndex);
                                }
                            }}
                        />
                    </Suspense>
                )}
            </div>
        </>
    );
};

export default ProjectDetails;
