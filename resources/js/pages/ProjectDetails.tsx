import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Part } from "../components/PartsTable";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/ProjectDetails.css";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import autoTable from "jspdf-autotable";
import robotoFont from "../styles/fonts/Roboto_Italic";
import { pl } from "date-fns/locale";
import { useProjectContext } from "../components/context/ProjectContext";
import { ProjectData } from "../pages/projectData";
import { Link } from "react-router-dom";
import React, { useEffect, useState, lazy, Suspense } from "react";
import { generateProjectDetails } from "../utils/generateProjectDetails";
interface FileData {
    name: string;
    size: number;
    type: string;
    file: File;
}



registerLocale("pl", pl);
const PartsTable = lazy(() => import("../components/PartsTable"));
const FileExplorerModal = lazy(() => import("../components/FileExplorerModal"));
const ProjectDetails: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { projects } = useProjectContext();

    const [project, setProject] = useState<ProjectData | null>(null);
    const [editProjectMode, setEditProjectMode] = useState(false);
    const [editPartsMode, setEditPartsMode] = useState(false);
    const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
    const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>("");

    const [newRole, setNewRole] = useState("");
    const [newName, setNewName] = useState("");

    useEffect(() => {
        if (projectId) {
            const selected = projects.find(p => p.id === projectId);
            if (selected) {
                setProject(selected);
                setSelectedStartDate(new Date(selected.startDate));
                setSelectedEndDate(new Date(selected.endDate));
            }
        }
    }, [projectId, projects]);

    useEffect(() => {
        if (project) {
            const endDate = new Date(project.endDate);
            const calculateTimeLeft = () => {
                const now = new Date();
                const diff = endDate.getTime() - now.getTime();
                if (diff <= 0) return setTimeLeft("Projekt zakończony!");
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((diff / (1000 * 60)) % 60);
                const seconds = Math.floor((diff / 1000) % 60);
                setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            };
            const timer = setInterval(calculateTimeLeft, 1000);
            return () => clearInterval(timer);
        }
    }, [project]);
    //Moje pliki
    const [files, setFiles] = useState<FileData[]>([]);
    const [showFileModal, setShowFileModal] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploaded = e.target.files;
        if (!uploaded) return;
        const newFiles: FileData[] = Array.from(uploaded).map(file => ({
            name: file.name,
            size: file.size,
            type: file.type,
            file: file,
        }));
        setFiles(prev => [...prev, ...newFiles]);
    };

    const handleRemoveFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleInputChange = (field: keyof ProjectData, value: string) => {
        setProject(prev => prev ? { ...prev, [field]: value } : null);
    };

    const saveProjectDates = () => {
        setProject(prev => prev ? {
            ...prev,
            startDate: selectedStartDate?.toISOString() || prev.startDate,
            endDate: selectedEndDate?.toISOString() || prev.endDate,
        } : null);
    };

    const addUser = () => {
        if (!newRole || !newName) return;
        const newUser = `${newRole}_${newName}`;
        setProject(prev =>
            prev ? {
                ...prev,
                assignedTo: [...(prev.assignedTo || []), newUser]
            } : null
        );
        setNewRole("");
        setNewName("");
    };

    const removeUser = (userToRemove: string) => {
        setProject(prev => {
            if (!prev || !prev.assignedTo) return prev;
            const updated = prev.assignedTo.filter(u => u !== userToRemove);
            return { ...prev, assignedTo: updated };
        });
    };



    const loadImageAsync = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = reject;
        });
    };

  


    const updateStatus = (partId: string, newStatus: Part["status"]) => {
        setProject(prev => prev ? {
            ...prev,
            parts: prev.parts.map(p =>
                p.id === partId ? { ...p, status: newStatus } : p
            ),
        } : null);
    };

    const updateField = (
        partId: string,
        field: keyof Omit<Part, "id" | "partCode">,
        value: string
    ) => {
        setProject(prev => prev ? {
            ...prev,
            parts: prev.parts.map(p =>
                p.id === partId ? { ...p, [field]: value } : p
            ),
        } : null);
    };

    const addPart = (newPart: Part) => {
        setProject(prev => (prev ? { ...prev, parts: [...prev.parts, newPart] } : null));
    };
    const removePart = (id: string) => {
        setProject(prev =>
            prev ? { ...prev, parts: prev.parts.filter(p => p.id !== id) } : null
        );
    };
    if (!project) return <div className="container mt-5">Nie znaleziono projektu.</div>;

    return (
        <>
            <Navbar />
            <div className="container mt-5 pt-5">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-4">

                    {/* Obraz */}
                    <div className="left-column">

                        <img
                            src={project.image}
                            alt={`Zdjęcie: ${project.name}`}
                            style={{ width: "100%", borderRadius: "12px", marginBottom: "10px" }}
                        />
                    </div>
                    {/* Kalendarz */}
                    <div className="calendar-wrapper order-md-3 order-2">
                        <div className="calendar-section">
                            <label className="label-date">Data Startu:</label>
                            <DatePicker
                                selected={selectedStartDate}
                                onChange={(date: Date) => setSelectedStartDate(date)}
                                dateFormat="yyyy-MM-dd"
                                className="date-picker burgundy-picker"
                                placeholderText="Wybierz datę startu"
                                locale="pl"
                                renderCustomHeader={({ date, decreaseMonth, increaseMonth }) => (
                                    <div className="d-flex justify-content-between align-items-center px-2 py-1">
                                        <button
                                            onClick={decreaseMonth}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                fontSize: "20px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            ‹
                                        </button>
                                        <div className="text-center" style={{ lineHeight: "1.2" }}>
                                            <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                                                {date.toLocaleDateString("pl-PL", { month: "long" })}
                                            </div>
                                            <div style={{ fontSize: "20px" }}>{date.getFullYear()}</div>
                                        </div>
                                        <button
                                            onClick={increaseMonth}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                fontSize: "20px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            ›
                                        </button>
                                    </div>
                                )}
                            />

                            <label className="label-date mt-2">Data Zakończenia:</label>
                            <DatePicker
                                selected={selectedEndDate}
                                onChange={(date: Date) => setSelectedEndDate(date)}
                                dateFormat="yyyy-MM-dd"
                                className="date-picker burgundy-picker"
                                placeholderText="Wybierz datę zakończenia"
                                locale="pl"
                                minDate={selectedStartDate}
                                renderCustomHeader={({ date, decreaseMonth, increaseMonth }) => (
                                    <div className="d-flex justify-content-between align-items-center px-2 py-1">
                                        <button
                                            onClick={decreaseMonth}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                fontSize: "20px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            ‹
                                        </button>
                                        <div className="text-center" style={{ lineHeight: "1.2" }}>
                                            <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                                                {date.toLocaleDateString("pl-PL", { month: "long" })}
                                            </div>
                                            <div style={{ fontSize: "20px" }}>{date.getFullYear()}</div>
                                        </div>
                                        <button
                                            onClick={increaseMonth}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                fontSize: "20px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            ›
                                        </button>
                                    </div>
                                )}
                            />
                        </div>
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
                                <p><strong>Numer zlecenia:</strong> {project.carId}</p>
                                <p><strong>Użytkownicy:</strong> {project.assignedTo?.join(", ") ?? "Brak"}</p>
                            </>
                        )}

                        <div className="d-flex mt-3 flex-wrap gap-2">
                            <input type="file" className="form-control" onChange={handleFileUpload} multiple />
                            <Link
                                to={`/projectdetails/${project.id}/lista_zakupow`}
                                className="btn btn-outline-dark hover-black"
                            >
                                🛒 Lista zakupów
                            </Link>


                            <button
                                className="btn btn-outline-dark hover-black"
                                onClick={() => setShowFileModal(true)}
                            >
                                📁 Moje pliki ({files.length})
                            </button>
                            <button
                                className="btn btn-outline-dark hover-black"
                                onClick={() => setEditProjectMode(!editProjectMode)}
                            >
                                {editProjectMode ? "Anuluj edycję" : "Edytuj projekt"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="time-left mb-3 mt-4" style={{ color: "#b03a2e", fontWeight: "bold" }}>
                    ⏳ <strong>Pozostały czas do zakończenia:</strong> {timeLeft}
                </div>


                <Suspense fallback={<div>Ładowanie tabeli...</div>}>
                <PartsTable
                    parts={project.parts}
                    updateStatus={updateStatus}
                    updateField={updateField}
                    addPart={addPart}
                    removePart={removePart}
                    editMode={editPartsMode}
                    projectName={project.name}
                    onEndEdit={() => setEditPartsMode(false)}
                    onToggleEdit={() => setEditPartsMode(prev => !prev)}
                    onGeneratePDF={() => project && generateProjectDetails(project)}

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
            </div> {/* ← zamknięcie div.container */}
        </>
    );
};

export default ProjectDetails;