import { Part } from "../components/PartsTable";

export interface Project {
    id: number;
    name: string;
    image: string;
    startDate: string;
    endDate: string;
    status: string;
    brand: string;
    model: string;
    year: number;
    carId: string;
    users?: { id: number; name: string; surname: string }[]; 
    parts: Part[];
    description?: string;
}
