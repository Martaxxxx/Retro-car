import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
// Jeśli chcesz zostawić kontekst użytkownika, może być aktywny:
import { useUser } from "../components/context/UserContext";

export default function Login() {
    const navigate = useNavigate();
    const { fetchUser } = useUser(); // zostawiamy, jeśli potrzebne
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 🔧 Tymczasowa symulacja logowania
            console.log("🔐 Email:", email);
            console.log("🔐 Hasło:", password);

            // Tu możesz dodać lokalne przechowywanie danych testowych
            localStorage.setItem("accessToken", "FAKE_TOKEN");
            await fetchUser(); // Jeśli nie działa, zakomentuj

            navigate("/", { replace: true });
        } catch (err) {
            alert("Coś poszło nie tak przy logowaniu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="d-flex flex-column align-items-center min-vh-100 p-4"
            style={{
                backgroundImage: "url('/4.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundColor: "#fff",
            }}
        >
            <div
                className="d-flex flex-column justify-content-between position-relative w-100 p-5"
                style={{
                    maxWidth: "500px",
                    minHeight: "550px",
                    marginTop: "40px",
                    borderRadius: "40px",
                    backdropFilter: "blur(10px)",
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                    border: "2px solid rgba(0, 0, 0, 0.2)",
                    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
                }}
            >
                <button
                    onClick={() => navigate("/")}
                    className="btn btn-link position-absolute top-0 start-0 mt-3 ms-3 d-flex align-items-center text-dark"
                    style={{ fontSize: "44px", textDecoration: "none" }}
                >
                    <ArrowLeft size={20} className="me-1" />
                </button>

                <h1 className="fs-3 fw-bold mb-5 mt-4 text-center">LOGOWANIE</h1>

                <form onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="E-mail"
                        className="form-control mb-4"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                            borderRadius: "999px",
                            padding: "15px",
                            border: "2px solid rgba(0,0,0,0.2)",
                            fontSize: "1rem",
                        }}
                    />
                    <input
                        type="password"
                        placeholder="Hasło"
                        className="form-control mb-4"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                            borderRadius: "999px",
                            padding: "15px",
                            border: "2px solid rgba(0,0,0,0.2)",
                            fontSize: "1rem",
                        }}
                    />

                    <div className="mb-4 text-center">
                        <button
                            type="button"
                            className="btn btn-link text-dark text-decoration-none"
                            onClick={() => alert("Skontaktuj się z administratorem.")}
                            style={{ fontSize: "0.9rem" }}
                        >
                            Nie pamiętasz hasła?
                        </button>
                    </div>

                    <div className="mb-3 mt-auto text-center">
                        <button
                            type="submit"
                            className="btn fw-bold px-5 py-3"
                            disabled={loading}
                            style={{
                                backgroundColor: "#9C2F3B",
                                borderRadius: "999px",
                                border: "2px solid black",
                                color: "white",
                                fontSize: "1rem",
                                transition: "all 0.2s ease",
                                opacity: loading ? 0.6 : 1,
                            }}
                        >
                            {loading ? "Logowanie..." : "ZALOGUJ"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
