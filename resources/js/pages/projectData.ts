import { Part } from "../components/PartsTable";

export interface ProjectData {
    id: string;
    name: string;
    image: string;
    startDate: string;
    endDate: string;
    status: string;
    brand: string;
    model: string;
    year: number;
    carId: string;
    assignedTo?: string[];
    parts: Part[];
}

export const projectMap: Record<string, ProjectData> = {
    mercedes300sl: {
        id: "mercedes300sl",
        name: "Mercedes 300SL",
        image: "/300.jpg",
        startDate: "2024-03-01",
        endDate: "2025-06-15",
        status: "W toku",
        brand: "Mercedes",
        model: "300SL",
        year: 1965,
        carId: "MB-300SL-001",
        assignedTo: ["Blacharz_Arek", "Mechanik_Igor"],
        parts: [
            { id: "p1", partCode: "MB300SL-001", name: "Filtr oleju", category: "Silnik", notes: "Użyć oryginalnego zamiennika", status: "pending" },
            { id: "p2", partCode: "MB300SL-002", name: "Tarcza hamulcowa", category: "Układ hamulcowy", notes: "Lewa strona", status: "installed" }
        ],
    },
    mercedesw123: {
        id: "mercedesw123",
        name: "Mercedes W123",
        image: "/W123.jpg",
        startDate: "2024-02-01",
        endDate: "2025-05-01",
        status: "W toku",
        brand: "Mercedes",
        model: "W123",
        year: 1983,
        carId: "MB-W123-001",
        assignedTo: ["Lakiernik_Bartek", "Mechanik_Kuba"],
        parts: [
            { id: "p1", partCode: "MBW123-001", name: "Świeca", category: "Silnik", notes: "Zestaw 4 sztuki", status: "ready" }
        ],
    },

    mercedesw116: {
        id: "mercedesw116",
        name: "Mercedes W116",
        image: "/W116.jpg",
        startDate: "2024-04-10",
        endDate: "2025-08-30",
        status: "W przygotowaniu",
        brand: "Mercedes",
        model: "W116",
        year: 1978,
        carId: "MB-W116-001",
        assignedTo: ["Blacharz_Jan"],
        parts: [
            { id: "p1", partCode: "MBW116-001", name: "Zderzak przedni", category: "Karoseria", notes: "Z chromem", status: "pending" }
        ],
    },
    mercedesw201: {
        id: "mercedesw201",
        name: "Mercedes W201",
        image: "/W201.jpg",
        startDate: "2023-07-01",
        endDate: "2024-11-15",
        status: "W trakcie",
        brand: "Mercedes",
        model: "W201",
        year: 1989,
        carId: "MB-W201-001",
        assignedTo: ["Mechanik_Zbyszek"],
        parts: [
            { id: "p1", partCode: "MBW201-001", name: "Amortyzator tylny", category: "Zawieszenie", notes: "Lewy i prawy komplet", status: "ready" }
        ],
    },
    mercedesw124: {
        id: "mercedesw124",
        name: "Mercedes W124",
        image: "/w124.jpg",
        startDate: "2023-11-11",
        endDate: "2025-03-01",
        status: "W toku",
        brand: "Mercedes",
        model: "W124",
        year: 1990,
        carId: "MB-W124-001",
        assignedTo: ["Lakiernik_Adaś"],
        parts: [
            { id: "p1", partCode: "MBW124-001", name: "Lampy tylne", category: "Oświetlenie", notes: "Wymienić na nowe", status: "installed" }
        ],
    },
    mercedes600pullman: {
        id: "mercedes600pullman",
        name: "Mercedes 600 Pullman",
        image: "/600.jpg",
        startDate: "2023-10-15",
        endDate: "2025-01-15",
        status: "W trakcie",
        brand: "Mercedes",
        model: "600 Pullman",
        year: 1972,
        carId: "MB-600PULL-001",
        assignedTo: ["Elektryk_Karol"],
        parts: [
            { id: "p1", partCode: "MB600P-001", name: "Pompa hydrauliczna", category: "Zawieszenie", notes: "Do regeneracji", status: "pending" }
        ],
    },
};
