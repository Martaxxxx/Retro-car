import React, { useState } from "react";
import { useProjectContext } from "../components/context/ProjectContext";
import DatePicker from "react-datepicker";
import Navbar from "../components/Navbar";
import "react-datepicker/dist/react-datepicker.css";
import { pl } from "date-fns/locale";
import Select from "react-select";
import axios from "../axios";

const statusOptions = [
    { value: "Utworzony", label: "Utworzony" },
    { value: "W toku", label: "W toku" },
    { value: "Gotowy", label: "Gotowy" },
];

const customSelectStyles = {
    control: (base: any, state: any) => ({
        ...base,
        borderColor: state.isFocused ? "#9C2F3B" : "#ccc",
        boxShadow: state.isFocused ? "0 0 0 1px #9C2F3B" : "none",
        "&:hover": { borderColor: "#9C2F3B" },
    }),
    option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isFocused ? "#9C2F3B" : "#fff",
        color: state.isFocused ? "#fff" : "#000",
        cursor: "pointer",
    }),
};

const ManagerPanel: React.FC = () => {
    const { fetchProjects } = useProjectContext();
    const [formData, setFormData] = useState({
        name: "",
        image: "", // podgląd
        imageFile: null as File | null,
        startDate: null as Date | null,
        endDate: null as Date | null,
        status: "Utworzony",
        brand: "",
        model: "",
        year: "",
        carId: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setFormData((prev) => ({ ...prev, image: imageUrl, imageFile: file }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.startDate || !formData.endDate) {
            alert("Wybierz daty rozpoczęcia i zakończenia.");
            return;
        }

        try {
            const data = new FormData();
            data.append("name", formData.name);
            if (formData.imageFile) data.append("image", formData.imageFile);
            data.append("start_date", formData.startDate.toISOString());
            data.append("end_date", formData.endDate.toISOString());
            data.append("status", formData.status);
            data.append("brand", formData.brand);
            data.append("model", formData.model);
            data.append("year", formData.year);
            data.append("car_id", formData.carId);

            await axios.post("/projects", data, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            alert("✅ Projekt dodany!");

            setFormData({
                name: "",
                image: "",
                imageFile: null,
                startDate: null,
                endDate: null,
                status: "Utworzony",
                brand: "",
                model: "",
                year: "",
                carId: "",
            });

            fetchProjects();
        } catch (error: any) {
            console.error("❌ Błąd zapisu projektu:", error);
            console.log("🔎 Odpowiedź backendu:", error.response?.data);
            alert("Wystąpił błąd przy zapisie.");
        }
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
            <div className="container mt-5 pt-5" style={{ backgroundColor: "rgba(255,255,255,0.96)", borderRadius: "8px", padding: "20px" }}>
                <form onSubmit={handleSubmit} className="rounded border bg-white p-4 shadow-sm">
                    <h5 className="mb-3">Informacje o projekcie</h5>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Nazwa projektu</label>
                            <input name="name" className="form-control" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Wybierz zdjęcie</label>
                            <input type="file" accept="image/*" className="form-control" onChange={handleImageUpload} />
                        </div>
                        {formData.image && (
                            <div className="col-12 mt-2 text-center">
                                <img src={formData.image} alt="Podgląd" className="img-thumbnail" style={{ maxHeight: "180px" }} />
                            </div>
                        )}
                    </div>

                    <h5 className="mb-3 mt-4">Harmonogram</h5>
                    <div className="d-flex gap-4 mb-4">
                        <div className="d-flex align-items-center gap-2">
                            <label className="form-label mb-0">Data rozpoczęcia</label>
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
                        <div className="d-flex align-items-center gap-2">
                            <label className="form-label mb-0">Data zakończenia</label>
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

                    <h5 className="mb-3">Dane pojazdu</h5>
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
                            <input name="carId" className="form-control" value={formData.carId} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="mt-4 text-end">
                        <button type="submit" className="btn btn-burgundy">Dodaj projekt</button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default ManagerPanel;