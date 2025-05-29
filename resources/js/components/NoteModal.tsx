import React from "react";
import "../styles/NoteModal.css";

interface NoteModalProps {
    content: string;
    onClose: () => void;
}

const NoteModal: React.FC<NoteModalProps> = ({ content, onClose }) => {
    return (
        <div className="note-modal-overlay" onClick={onClose}>
            <div className="note-modal-content" onClick={(e) => e.stopPropagation()}>
                <h5>Pełna notatka</h5>
                <div className="note-modal-text">{content}</div>
                <button className="btn btn-custom mt-3" onClick={onClose}>

                    Zamknij
                </button>
            </div>
        </div>
    );
};

export default NoteModal;
