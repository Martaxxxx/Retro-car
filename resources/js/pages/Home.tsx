import React from "react";
import Navbar from "../components/Navbar";
import ProjectSlider from "../components/ProjectSlider";
import { useProjectContext } from "../components/context/ProjectContext";

const Home: React.FC = () => {
    const { projects } = useProjectContext(); // ← tylko z kontekstu

    return (
        <>
            <Navbar />

            {/*Obraz główny – zabytkowy Mercedes */}
            <div style={{ width: "100%", overflow: "hidden", marginTop: "72px" }}>
                <img
                    src="/7.png"
                    alt="Zabytkowy Mercedes"
                    style={{
                        width: "100%",
                        height: "440px",
                        objectFit: "contain",
                        display: "block",
                        margin: "0 auto",
                    }}
                />
            </div>

            {/* Sekcja z projektami */}
            <div
                style={{
                    textAlign: "center",
                    marginTop: "0px",
                    padding: "15px 20px 40px",
                    backgroundColor: "#ffffff",
                    borderTop: "1px solid #e0e0e0",
                    borderRadius: "0",
                    boxShadow: "none",
                }}
            >
                <ProjectSlider projects={projects} />
            </div>
        </>
    );
};

export default Home;
