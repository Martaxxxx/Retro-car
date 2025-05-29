import React, { createContext, useContext, useState, ReactNode } from "react";
import { ProjectData, projectMap } from "../../pages/projectData";

interface ProjectContextType {
    projects: ProjectData[];
    addProject: (project: ProjectData) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [projects, setProjects] = useState<ProjectData[]>(Object.values(projectMap));

    const addProject = (project: ProjectData) => {
        setProjects((prev) =>
            prev.some(p => p.id === project.id) ? prev : [...prev, project]
        );
    };

    return (
        <ProjectContext.Provider value={{ projects, addProject }}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProjectContext = () => {
    const context = useContext(ProjectContext);
    if (!context) throw new Error("useProjectContext must be used within a ProjectProvider");
    return context;
};
