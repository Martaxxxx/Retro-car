import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem("accessToken");
            await axios.post("/api/register", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            alert("Użytkownik został dodany!");
            navigate("/"); // lub gdziekolwiek chcesz
        } catch (error: any) {
            alert(error.response?.data?.message || "Błąd rejestracji.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5 pt-5" style={{ maxWidth: "500px" }}>
            <h2 className="mb-4 text-center">Dodaj użytkownika</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="name"
                    placeholder="Imię i nazwisko"
                    className="form-control mb-3"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="form-control mb-3"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Hasło"
                    className="form-control mb-3"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
                <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                >
                    {loading ? "Rejestrowanie..." : "Dodaj użytkownika"}
                </button>
            </form>
        </div>
    );
};

export default Register;
