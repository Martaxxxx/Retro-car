import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "../../axios";
import { ProjectData } from "../../pages/projectData";

interface ProjectContextType {
    projects: ProjectData[];
    fetchProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [projects, setProjects] = useState<ProjectData[]>([]);

    const fetchProjects = async () => {
        try {
            const response = await axios.get("/projects");
            setProjects(response.data);
        } catch (error) {
            console.error("❌ Błąd pobierania projektów:", error);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    return (
        <ProjectContext.Provider value={{ projects, fetchProjects }}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProjectContext = () => {
    const context = useContext(ProjectContext);
    if (!context) throw new Error("useProjectContext must be used within a ProjectProvider");
    return context;
};
