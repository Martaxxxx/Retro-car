import React from "react";
import "../styles/FileExplorerModal.css";

// POZWÓL na dwa typy plików: backend (url) i frontend (file)
export type FileData =
    | { name: string; size?: number; type?: string; url: string } // backend, z url
    | { name: string; size: number; type: string; file: File };   // frontend, z file

interface Props {
    files: FileData[];
    onClose: () => void;
    onRemove: (index: number) => void;
}

const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
};

const FileExplorerModal: React.FC<Props> = ({ files, onClose, onRemove }) => {
    return (
        <div className="file-explorer-overlay">
            <div className="file-explorer-card">
                <div className="file-explorer-header">
                    📂 Załączniki ({files.length})
                </div>
                <ul className="file-explorer-list">
                    {files.map((f, idx) => {
                        // wykryj typ pliku
                        const isBackend = "url" in f;
                        const isImage = f.type?.startsWith("image/");
                        return (
                            <li key={idx} className="file-explorer-item">
                                <div className="file-explorer-info">
                                    {isImage ? (
                                        isBackend ? (
                                            <img
                                                src={f.url}
                                                alt="preview"
                                                className="file-explorer-thumb"
                                            />
                                        ) : (
                                            <img
                                                src={URL.createObjectURL((f as any).file)}
                                                alt="preview"
                                                className="file-explorer-thumb"
                                            />
                                        )
                                    ) : (
                                        <div style={{ fontSize: "1.8rem" }}>📄</div>
                                    )}
                                    <div>
                                        <div className="file-explorer-name">{f.name}</div>
                                        <div className="file-explorer-meta">
                                            {(f.type || "plik") +
                                                (f.size ? ` • ${formatSize(f.size)}` : "")}
                                        </div>
                                    </div>
                                </div>
                                <div className="file-explorer-actions d-flex">
                                    <a
                                        href={isBackend ? f.url : URL.createObjectURL((f as any).file)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-sm btn-outline-primary"
                                    >
                                        Podgląd
                                    </a>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-delete-fixed"
                                        onClick={() => onRemove(idx)}
                                    >
                                        Usuń
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
                <div className="file-explorer-close">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Zamknij
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FileExplorerModal;