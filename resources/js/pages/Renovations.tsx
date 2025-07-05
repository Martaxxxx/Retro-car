import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import "rc-slider/assets/index.css";
import Slider from "rc-slider";
import axios from "axios";
import Select from "react-select";
import { useNavigate } from "react-router-dom";


interface Project {
    id: string;
    name: string;
    brand: string;
    year: number;
    status: string;
    end_date?: string;
    image?: string;
    user_id?: string;
}

const sortOptions = [
    { value: "updated-newest", label: "Sortuj od najnowszych" },
    { value: "updated-oldest", label: "Sortuj od najstarszych" },
    { value: "name-asc", label: "Sortuj po nazwie (A-Z)" },
    { value: "name-desc", label: "Sortuj po nazwie (Z-A)" },
    { value: "year-asc", label: "Sortuj po roczniku rosnąco" },
    { value: "year-desc", label: "Sortuj po roczniku malejąco" }
];

const statusOptions = [
    { value: "Utworzony", label: "Utworzony" },
    { value: "W toku", label: "W toku" },
    { value: "Gotowy", label: "Gotowy" }
];

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

const Renovations: React.FC = () => {
    const navigate = useNavigate();
    const [allProjects, setAllProjects] = useState<Project[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [brandFilter, setBrandFilter] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [onlyMine, setOnlyMine] = useState(false);
    const [showFilters, setShowFilters] = useState(true);

    // Zakres roczników na podstawie danych z bazy (nie zmienia się po przesuwaniu suwaka)
    const [yearRange, setYearRange] = useState<[number, number]>([1885, new Date().getFullYear()]);
    // Wybrane przez użytkownika wartości suwaka (zmieniają się natychmiast)
    const [selectedYear, setSelectedYear] = useState<[number, number]>([1885, new Date().getFullYear()]);

    const [visibleCount, setVisibleCount] = useState(10);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        axios.get("/renovations")
            .then(response => {
                const projects = Array.isArray(response.data) ? response.data : [];
                setAllProjects(projects);

                if (projects.length > 0) {
                    const years = projects.map((p: Project) => Number(p.year));
                    const minYear = Math.max(1885, Math.min(...years));
                    const maxYear = Math.min(new Date().getFullYear(), Math.max(...years));
                    setYearRange([minYear, maxYear]);
                    setSelectedYear([minYear, maxYear]);
                }
            })
            .catch(error => console.error("Błąd pobierania danych z API:", error));

        axios.get("/api/user")
            .then(res => setUserId(res.data.id))
            .catch(() => setUserId(null));
    }, []);

    const allBrands = Array.from(new Set(allProjects.map(p => p.brand))).filter(Boolean);
    const brandOptions = allBrands.map(brand => ({ value: brand, label: brand }));

    const filteredProjects = allProjects
        .filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter(p => (statusFilter ? p.status === statusFilter : true))
        .filter(p => (brandFilter ? p.brand === brandFilter : true))
        .filter(p => Number(p.year) >= selectedYear[0] && Number(p.year) <= selectedYear[1])
        .filter(p => !onlyMine || (userId && p.user_id === userId))
        .sort((a, b) => {
            switch (sortBy) {
                case "name-asc": return a.name.localeCompare(b.name);
                case "name-desc": return b.name.localeCompare(a.name);
                case "year-asc": return Number(a.year) - Number(b.year);
                case "year-desc": return Number(b.year) - Number(a.year);
                case "updated-newest": return new Date(b.end_date ?? "").getTime() - new Date(a.end_date ?? "").getTime();
                case "updated-oldest": return new Date(a.end_date ?? "").getTime() - new Date(b.end_date ?? "").getTime();
                default: return 0;
            }
        });

    const handleLoadMore = () => setVisibleCount(prev => prev + 10);

    return (
        <>
            <Navbar />
            <div className="container mt-5 pt-5">
                <h2 className="mb-4 text-center">Renowacje</h2>
                <div className="mb-3 text-start">
                    <button className="btn btn-danger" onClick={() => setShowFilters(!showFilters)}>
                        Filtruj wyszukiwanie {showFilters ? "▲" : "▼"}
                    </button>
                </div>
                {showFilters && (
                    <div className="card mb-4 p-4">
                        <div className="row g-3 align-items-end">
                            <div className="col-md-3">
                                <label className="form-label">Nazwa projektu</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Szukaj po nazwie..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Status</label>
                                <Select
                                    styles={customSelectStyles}
                                    options={statusOptions}
                                    value={statusOptions.find(opt => opt.value === statusFilter)}
                                    onChange={option => setStatusFilter(option?.value || "")}
                                    placeholder="Wybierz..."
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Marka</label>
                                <Select
                                    styles={customSelectStyles}
                                    options={brandOptions}
                                    value={brandOptions.find(opt => opt.value === brandFilter)}
                                    onChange={option => setBrandFilter(option?.value || "")}
                                    placeholder="Wybierz..."
                                />
                            </div>
                            <div className="col-md-3 ms-auto">
                                <label className="form-label">Sortowanie</label>
                                <Select
                                    styles={customSelectStyles}
                                    options={sortOptions}
                                    value={sortOptions.find(opt => opt.value === sortBy)}
                                    onChange={option => setSortBy(option?.value || "")}
                                    placeholder="Sortuj..."
                                />
                            </div>
                        </div>
                        <div className="row g-3 mt-4">
                            <div className="col-md-6">
                                <div className="card p-3">
                                    <label className="form-label">Rocznik</label>
                                    <Slider
                                        range
                                        allowCross={false}
                                        min={yearRange[0]}
                                        max={yearRange[1]}
                                        value={selectedYear}
                                        onChange={value => {
                                            if (Array.isArray(value)) {
                                                setSelectedYear([value[0], value[1]]);
                                            }
                                        }}
                                        trackStyle={[{ backgroundColor: "#9C2F3B", height: 6 }]}
                                        handleStyle={[
                                            { backgroundColor: "#9C2F3B", borderColor: "#9C2F3B" },
                                            { backgroundColor: "#9C2F3B", borderColor: "#9C2F3B" }
                                        ]}
                                        railStyle={{ backgroundColor: "#ccc", height: 6 }}
                                    />
                                    <div className="d-flex justify-content-between mt-3 gap-3">
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={selectedYear[0]}
                                            min={yearRange[0]}
                                            max={selectedYear[1]}
                                            onChange={e => {
                                                const newMin = Number(e.target.value);
                                                setSelectedYear([newMin, Math.max(newMin, selectedYear[1])]);
                                            }}
                                        />
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={selectedYear[1]}
                                            min={selectedYear[0]}
                                            max={yearRange[1]}
                                            onChange={e => {
                                                const newMax = Number(e.target.value);
                                                setSelectedYear([Math.min(selectedYear[0], newMax), newMax]);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6 d-flex justify-content-end align-items-end">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={onlyMine}
                                        onChange={e => setOnlyMine(e.target.checked)}
                                        id="onlyMine"
                                    />
                                    <label className="form-check-label ms-2" htmlFor="onlyMine">
                                        Moje renowacje
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5 g-4">
                    {filteredProjects.slice(0, visibleCount).map((project) => (
                        <div className="col" key={project.id}>
                            <div
                                className="card h-100 shadow"
                                onClick={() => navigate(`/projectdetails/${project.id}/${encodeURIComponent(project.name)}`)}
                                style={{ cursor: "pointer" }}
                            >
                                {project.image && (
                                    <img
                                        src={project.image}
                                        alt={project.name}
                                        className="card-img-top"
                                        style={{ height: "180px", objectFit: "cover" }}
                                    />
                                )}
                                <div className="card-body text-center">
                                    <h5 className="card-title">{project.name}</h5>
                                    <p className="card-text">
                                        Rok: {project.year}
                                        <br />
                                        Marka: {project.brand}
                                        <br />
                                        Status: {project.status}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {visibleCount < filteredProjects.length && (
                    <div className="mt-4 text-center">
                        <button className="btn btn-outline-secondary" onClick={handleLoadMore}>
                            Załaduj więcej
                        </button>
                    </div>
                )}
                {filteredProjects.length === 0 && <p className="text-center">Brak wyników.</p>}
            </div>
        </>
    );
};

export default Renovations;