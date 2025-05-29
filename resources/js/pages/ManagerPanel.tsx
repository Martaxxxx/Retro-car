import React, { useState } from "react";
import { useProjectContext } from "../components/context/ProjectContext";
import DatePicker from "react-datepicker";
import Navbar from "../components/Navbar";
import "react-datepicker/dist/react-datepicker.css";
import { pl } from "date-fns/locale";
import Select from "react-select";

const statusOptions = [
    { value: "Utworzony", label: "Utworzony" },
    { value: "W toku", label: "W toku" },
    { value: "Gotowy", label: "Gotowy" },
 
];

const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        borderColor: state.isFocused ? "#9C2F3B" : "#ccc",
        boxShadow: state.isFocused ? "0 0 0 1px #9C2F3B" : "none",
        "&:hover": { borderColor: "#9C2F3B" },
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? "#9C2F3B" : "#fff",
        color: state.isFocused ? "#fff" : "#000",
        cursor: "pointer",
    }),
};

const ManagerPanel: React.FC = () => {
    const { addProject } = useProjectContext();

    const [formData, setFormData] = useState({
        name: "",
        image: "",
        startDate: null as Date | null,
        endDate: null as Date | null,
        status: "W przygotowaniu",
        brand: "",
        model: "",
        year: "",
        carId: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setFormData((prev) => ({ ...prev, image: imageUrl }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.startDate || !formData.endDate) {
            alert("Wybierz daty rozpoczęcia i zakończenia.");
            return;
        }
        if (!formData.name || !formData.brand || !formData.model || !formData.year || !formData.carId) {
            alert("Uzupełnij wszystkie wymagane pola.");
            return;
        }
        const id = formData.name.toLowerCase().replace(/\s+/g, "");
        const newProject = {
            id,
            name: formData.name,
            image: formData.image,
            startDate: formData.startDate.toISOString(),
            endDate: formData.endDate.toISOString(),
            status: formData.status,
            brand: formData.brand,
            model: formData.model,
            year: parseInt(formData.year),
            carId: formData.carId,
            assignedTo: [],
            parts: [],
        };
        addProject(newProject);
        alert("Projekt dodany!");
        setFormData({
            name: "",
            image: "",
            startDate: null,
            endDate: null,
            status: "W przygotowaniu",
            brand: "",
            model: "",
            year: "",
            carId: "",
        });
    };

    const renderCustomHeader = ({ date, decreaseMonth, increaseMonth }: any) => (
        <div className="d-flex justify-content-between align-items-center px-2 py-1">
            <button style={{ background: "none", border: "none", fontSize: "20px" }} onClick={decreaseMonth}>‹</button>
            <div className="text-center" style={{ lineHeight: "1.2" }}>
                <div style={{ fontSize: "20px", fontWeight: "bold" }}>{date.toLocaleDateString("pl-PL", { month: "long" })}</div>
                <div style={{ fontSize: "20px" }}>{date.getFullYear()}</div>
            </div>
            <button style={{ background: "none", border: "none", fontSize: "20px" }} onClick={increaseMonth}>›</button>
        </div>
    );

    return (
        <>
            <Navbar />
            <div
                className="container mt-5 pt-5"
                style={{
                    backgroundColor: "rgba(255,255,255,0.96)",
                    borderRadius: "8px",
                    padding: "20px",
                }}
            >
                <div className="position-relative container mt-3 pt-2">
                    <div className="d-flex justify-content-between align-items-start position-relative mb-4">
                        <h2 className="fw-bold fs-2 mb-0 mt-4">Dodaj Projekt</h2>
                        <div className="position-absolute" style={{ top: 0, right: 0, marginTop: "-30px", marginRight: "-35px" }}>
                            <img src="/dodaj.png" alt="Dodaj" style={{ width: "110px", height: "110px", objectFit: "contain" }} />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="rounded border bg-white p-4 shadow-sm">
                        <h5 className="mb-3">Informacje o projekcie</h5>
                        <div className="row g-3 align-items-start">
                            <div className="col-md-6">
                                <label className="form-label">Nazwa projektu</label>
                                <input name="name" className="form-control" value={formData.name} onChange={handleChange} required />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Wybierz zdjęcie</label>
                                <input type="file" accept="image/*" className="form-control" onChange={handleImageUpload} />
                                {formData.image && (
                                    <div className="mt-2 text-center">
                                        <img src={formData.image} alt="Podgląd" className="img-thumbnail" style={{ maxHeight: "180px" }} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <h5 className="mb-3 mt-4">Harmonogram</h5>
                        <div className="row g-4">
                            <div className="col-md-6">
                                <label className="form-label">Data rozpoczęcia</label>
                                <DatePicker
                                    selected={formData.startDate}
                                    onChange={(date) => setFormData((prev) => ({ ...prev, startDate: date }))}
                                    dateFormat="yyyy-MM-dd"
                                    className="form-control"
                                    locale={pl}
                                    placeholderText="Wybierz datę"
                                    renderCustomHeader={renderCustomHeader}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Data zakończenia</label>
                                <DatePicker
                                    selected={formData.endDate}
                                    onChange={(date) => setFormData((prev) => ({ ...prev, endDate: date }))}
                                    dateFormat="yyyy-MM-dd"
                                    className="form-control"
                                    minDate={formData.startDate || undefined}
                                    locale={pl}
                                    placeholderText="Wybierz datę"
                                    renderCustomHeader={renderCustomHeader}
                                />
                            </div>
                        </div>

                        <h5 className="mb-3 mt-4">Dane pojazdu</h5>
                        <div className="row g-3">
                            <div className="col-md-4">
                                <label className="form-label">Status</label>
                                <Select
                                    styles={customSelectStyles}
                                    options={statusOptions}
                                    value={statusOptions.find(opt => opt.value === formData.status)}
                                    onChange={(option) => setFormData((prev) => ({ ...prev, status: option?.value || "" }))}
                                    placeholder="Wybierz status..."
                                    isSearchable={false}
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Marka</label>
                                <input name="brand" className="form-control" value={formData.brand} onChange={handleChange} />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Model</label>
                                <input name="model" className="form-control" value={formData.model} onChange={handleChange} />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Rok produkcji</label>
                                <input
                                    name="year"
                                    type="number"
                                    className="form-control"
                                    value={formData.year}
                                    onChange={handleChange}
                                    min={1885}
                                    max={new Date().getFullYear()}
                                    placeholder="np. 1983"
                                />
                            </div>
                            <div className="col-md-8">
                                <label className="form-label">Numer VIN / ID samochodu</label>
                                <input name="carId" className="form-control" value={formData.carId} onChange={handleChange} placeholder="Np. MB-W123-001" />
                            </div>
                        </div>

                        <div className="mt-4 text-end">
                            <button type="submit" className="btn btn-burgundy mt-4">Dodaj projekt</button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ManagerPanel;
