import React from "react";
import { Project } from "../types/Project";
import { useProjectContext } from "./context/ProjectContext";

interface Props {
    selectedProjectId: string;
    onChange: (id: string) => void;
    dynamicProjects?: Project[];
}

const ProjectSelector: React.FC<Props> = ({
    selectedProjectId,
    onChange,
    dynamicProjects,
}) => {
    const { projects: contextProjects } = useProjectContext();

const allProjects: Project[] = dynamicProjects ?? contextProjects ?? [];

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
