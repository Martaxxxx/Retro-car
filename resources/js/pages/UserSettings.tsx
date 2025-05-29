import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useLoading } from "../components/context/LoadingContext"; // ścieżkę dopasuj do siebie

const UserSettings: React.FC = () => {
    const { setLoading } = useLoading();

    const [preview, setPreview] = useState<string>("/user.jpg");
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const loadUser = async () => {
            setLoading(true);


            const stored = localStorage.getItem("user");
            const userData = stored
                ? JSON.parse(stored)
                : {
                    name: "Arek",
                    surname: "Kowalski",
                    role: "admin",
                    email: "arek@firma.pl",
                    login: "arek_blacharz",
                    password: "********",
                    projects: ["Mercedes 300SL", "Mercedes Pagoda"],
                    avatar: "/user.jpg",
                };

            setUser(userData);
            setPreview(userData.avatar);
            setLoading(false);
        };

        loadUser();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                const updatedUser = { ...user, avatar: result };
                setUser(updatedUser);
                setPreview(result);
                localStorage.setItem("user", JSON.stringify(updatedUser));
                window.location.reload(); // odśwież Navbar
            };
            reader.readAsDataURL(file);
        }
    };

    if (!user) return null; // czekamy na załadowanie danych

    return (
        <>
            <Navbar />
            <div className="container" style={{ marginTop: "200px" }}>
                <div className="row">
                    <div className="col-md-4 text-center">
                        <img
                            src={preview}
                            alt="Avatar"
                            className="avatar-large rounded-circle"
                            style={{ width: "160px", height: "160px", objectFit: "cover" }}
                        />
                        <p className="text-muted mt-2">Zdjęcie profilowe</p>
                        <input
                            type="file"
                            accept="image/*"
                            className="form-control mt-2"
                            onChange={handleImageChange}
                        />
                    </div>

                    <div className="col-md-8">
                        <table className="custom-table w-100">
                            <tbody>
                                <tr><th>Imię</th><td>{user.name}</td></tr>
                                <tr><th>Nazwisko</th><td>{user.surname}</td></tr>
                                <tr><th>Login</th><td>{user.login}</td></tr>
                                <tr><th>Rola</th><td>{user.role}</td></tr>
                                <tr><th>E-mail</th><td>{user.email}</td></tr>
                                <tr><th>Hasło</th><td>{user.password}</td></tr>
                            </tbody>
                        </table>

                        <button className="btn btn-secondary mt-3" disabled>
                            🔒 Zmiana danych tylko przez admina
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UserSettings;
