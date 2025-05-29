import React from "react";
import { projectMap, ProjectData } from "../pages/projectData";
import { useProjectContext } from "./context/ProjectContext";

interface Props {
    selectedProjectId: string;
    onChange: (id: string) => void;
    dynamicProjects?: ProjectData[]; // Możesz też przekazać ręcznie
}

const ProjectSelector: React.FC<Props> = ({
    selectedProjectId,
    onChange,
    dynamicProjects,
}) => {
    const { projects: contextProjects } = useProjectContext();

    // Łączymy projekty statyczne i dynamiczne (jeśli są)
    const allProjects: ProjectData[] = [
        ...Object.values(projectMap),
        ...(dynamicProjects ?? contextProjects ?? []),
    ];

    return (
        <div className="form-group mb-3">
            <label htmlFor="projectSelect" className="form-label">
                Wybierz projekt:
            </label>
            <select
                id="projectSelect"
                className="form-select"
                value={selectedProjectId}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="">-- wybierz --</option>
                {allProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                        {project.name} ({project.model}, {project.year})
                    </option>
                ))}
            </select>
        </div>
    );
};

export default ProjectSelector;
