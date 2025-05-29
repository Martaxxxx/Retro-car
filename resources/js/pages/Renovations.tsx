import React, { useState } from "react";
import Navbar from "../components/Navbar";
import "rc-slider/assets/index.css";
import { projectMap } from "./projectData";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { useProjectContext } from "../components/context/ProjectContext";
import Slider from "rc-slider";

const Range = Slider.Range;

const sortOptions = [
    { value: "updated-newest", label: "Sortuj od najnowszych" },
    { value: "updated-oldest", label: "Sortuj od najstarszych" },
    { value: "name-asc", label: "Sortuj po nazwie (A-Z)" },
    { value: "name-desc", label: "Sortuj po nazwie (Z-A)" },
    { value: "year-asc", label: "Sortuj po roczniku rosnąco" },
    { value: "year-desc", label: "Sortuj po roczniku malejąco" },
];

const statusOptions = [
    { value: "Utworzony", label: "Utworzony" },
    { value: "W toku", label: "W toku" },
    { value: "Gotowy", label: "Gotowy" },
];

const customSelectStyles = {
    control: (base: any) => ({
        ...base,
        backgroundColor: '#fff',
        borderColor: '#9C2F3B',
        boxShadow: 'none',
        '&:hover': { borderColor: '#9C2F3B' }
    }),
    option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isFocused ? '#9C2F3B' : '#fff',
        color: state.isFocused ? '#fff' : '#000',
        cursor: 'pointer'
    })
};

const Renovations: React.FC = () => {
    const { projects: dynamicProjects } = useProjectContext();
    const navigate = useNavigate();

    const allProjects = [
        ...Object.values(projectMap),
        ...dynamicProjects.filter(dp => !projectMap[dp.id])
    ];

    const allBrands = Array.from(new Set(allProjects.map(p => p.brand)));
    const brandOptions = allBrands.map(brand => ({ value: brand, label: brand }));

    const currentYear = new Date().getFullYear();
    const allYears = allProjects.map(p => p.year);
    const initialYearMin = Math.max(1885, Math.min(...allYears));
    const initialYearMax = Math.min(currentYear, Math.max(...allYears));

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [brandFilter, setBrandFilter] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [onlyMine, setOnlyMine] = useState(false);
    const [showFilters, setShowFilters] = useState(true);
    const [yearMin, setYearMin] = useState(initialYearMin);
    const [yearMax, setYearMax] = useState(initialYearMax);
    const [visibleCount, setVisibleCount] = useState(10);

    const filteredProjects = allProjects
        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter(p => (statusFilter ? p.status === statusFilter : true))
        .filter(p => (brandFilter ? p.brand === brandFilter : true))
        .filter(p => p.year >= yearMin && p.year <= yearMax)
        .sort((a, b) => {
            switch (sortBy) {
                case "name-asc": return a.name.localeCompare(b.name);
                case "name-desc": return b.name.localeCompare(a.name);
                case "year-asc": return a.year - b.year;
                case "year-desc": return b.year - a.year;
                case "updated-newest": return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
                case "updated-oldest": return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
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
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Status</label>
                                <Select
                                    styles={customSelectStyles}
                                    options={statusOptions}
                                    value={statusOptions.find(opt => opt.value === statusFilter)}
                                    onChange={(option) => setStatusFilter(option?.value || "")}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">Marka</label>
                                <Select
                                    styles={customSelectStyles}
                                    options={brandOptions}
                                    value={brandOptions.find(opt => opt.value === brandFilter)}
                                    onChange={(option) => setBrandFilter(option?.value || "")}
                                />
                            </div>
                            <div className="col-md-3 ms-auto">
                                <label className="form-label">Sortowanie</label>
                                <Select
                                    styles={customSelectStyles}
                                    options={sortOptions}
                                    value={sortOptions.find(opt => opt.value === sortBy)}
                                    onChange={(option) => setSortBy(option?.value || "")}
                                />
                            </div>
                        </div>

                        <div className="row g-3 mt-4">
                            <div className="col-md-6">
                                <label className="form-label">Rocznik</label>
                                <Range
                                    allowCross={false}
                                    min={initialYearMin}
                                    max={initialYearMax}
                                    value={[yearMin, yearMax]}
                                    onChange={([min, max]) => {
                                        setYearMin(min);
                                        setYearMax(max);
                                    }}
                                />
                                <div className="d-flex justify-content-between mt-2">
                                    <input type="number" value={yearMin} onChange={e => setYearMin(Number(e.target.value))} />
                                    <input type="number" value={yearMax} onChange={e => setYearMax(Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="col-md-6 d-flex justify-content-end align-items-end">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={onlyMine}
                                        onChange={(e) => setOnlyMine(e.target.checked)}
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
                    {filteredProjects.slice(0, visibleCount).map((project, index) => (
                        <div className="col" key={index}>
                            <div className="card h-100 shadow" onClick={() => navigate(`/projectdetails/${project.id}`)} style={{ cursor: "pointer" }}>
                                {project.image && (
                                    <img src={project.image} alt={project.name} className="card-img-top" />
                                )}
                                <div className="card-body text-center">
                                    <h5 className="card-title">{project.name}</h5>
                                    <p className="card-text">
                                        Rok: {project.year}<br />
                                        Marka: {project.brand}<br />
                                        Status: {project.status}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {visibleCount < filteredProjects.length && (
                    <div className="mt-4 text-center">
                        <button className="btn btn-outline-secondary" onClick={handleLoadMore}>Załaduj więcej</button>
                    </div>
                )}

                {filteredProjects.length === 0 && <p className="text-center">Brak wyników.</p>}
            </div>
        </>
    );
};

export default Renovations;
