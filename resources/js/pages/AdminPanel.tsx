import React, { useEffect, useState } from "react";
import axios from "../axios";
import Navbar from "../components/Navbar";

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    created_at: string;
}

interface FormDataState {
    name: string;
    email: string;
    role: string;
    password?: string;
    avatar?: File;
}

const AdminPanel: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<FormDataState>({
        name: "",
        email: "",
        role: "user",
        password: "",
    });
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get("/api/users");
            setUsers(res.data);
        } catch (err) {
            console.error("Błąd pobierania użytkowników:", err);
        }
    };

    const openEditModal = (user: User) => {
        setIsCreating(false);
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role,
        });
    };

    const openCreateModal = () => {
        setIsCreating(true);
        setEditingUser({ id: 0, name: "", email: "", role: "user", created_at: "" });
        setFormData({
            name: "",
            email: "",
            role: "user",
            password: "",
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFormData((prev) => ({ ...prev, avatar: e.target.files![0] }));
        }
    };

    const buildFormData = () => {
        const data = new FormData();
        data.append("name", formData.name);
        data.append("email", formData.email);
        data.append("role", formData.role);
        if (formData.password) data.append("password", formData.password);
        if (formData.avatar) data.append("avatar", formData.avatar);
        return data;
    };

    const handleCreate = async () => {
        try {
            const data = buildFormData();



            const response = await axios.post("/api/users", data, {
                headers: { "Content-Type": "multipart/form-data" },
            });


            setEditingUser(null);
            fetchUsers();
        } catch (err: any) {
            console.error("❌ Błąd tworzenia użytkownika:", err.response?.data || err.message);
            alert("Błąd tworzenia użytkownika");
        }
    };

    const handleUpdate = async () => {
        if (!editingUser) return;
        try {
            const data = buildFormData();

            const response = await axios.post(`/api/users/${editingUser.id}?_method=PUT`, data, {
                headers: { "Content-Type": "multipart/form-data" },
            });


            setEditingUser(null);
            fetchUsers();
        } catch (err: any) {
            console.error("❌ Błąd zapisu zmian:", err.response?.data || err.message);
            alert("Błąd zapisu zmian");
        }
    };

    const handleDelete = async (userId: number) => {
        if (!window.confirm("Czy na pewno chcesz usunąć tego użytkownika?")) return;
        try {
            await axios.delete(`/users/${userId}`);
            setUsers((prev) => prev.filter((u) => u.id !== userId));
        } catch (err: any) {
            console.error("❌ Błąd usuwania użytkownika:", err.response?.data || err.message);
            alert("Błąd usuwania użytkownika");
        }
    };

    const filteredUsers = users.filter((user) => {
        const term = searchTerm.toLowerCase();
        return (
            (!filterRole || user.role === filterRole) &&
            (user.name.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term) ||
                user.role.toLowerCase().includes(term) ||
                user.id.toString().includes(term))
        );
    });

    return (
        <>
            <Navbar />
            <div className="container mt-5 pt-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>Użytkownicy</h2>
                    <button className="btn btn-dark rounded-pill px-4" onClick={openCreateModal}>
                        ➕ Dodaj użytkownika
                    </button>
                </div>

                <div className="row mb-3">
                    <div className="col-md-6">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Szukaj (ID, imię, email, rola...)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="col-md-4">
                        <select
                            className="form-select"
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                        >
                            <option value="">Wszystkie role</option>
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="user">User</option>
                            <option value="purchaser">Purchaser</option>
                        </select>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="table table-bordered table-striped align-middle rounded shadow overflow-hidden">
                        <thead className="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Avatar</th>
                                <th>Imię</th>
                                <th>Email</th>
                                <th>Rola</th>
                                <th>Utworzony</th>
                                <th>Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>
                                        <img
                                            src={user.avatar || "/default-avatar.png"}
                                            alt="avatar"
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: "50%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    </td>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.role}</td>
                                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => openEditModal(user)}
                                        >
                                            Edytuj
                                        </button>
                                        <button
                                            className="btn btn-sm btn-danger ms-2"
                                            onClick={() => handleDelete(user.id)}
                                        >
                                            Usuń
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingUser && (
                <div className="modal show fade d-block" tabIndex={-1}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {isCreating ? "Dodaj użytkownika" : "Edytuj użytkownika"}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setEditingUser(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <input
                                    type="text"
                                    name="name"
                                    className="form-control mb-2"
                                    placeholder="Imię"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                                <input
                                    type="email"
                                    name="email"
                                    className="form-control mb-2"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                                <select
                                    name="role"
                                    className="form-select mb-2"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="manager">Manager</option>
                                    <option value="user">User</option>
                                    <option value="purchaser">Purchaser</option>
                                </select>
                                <input
                                    type="password"
                                    name="password"
                                    className="form-control mb-2"
                                    placeholder="Hasło"
                                    onChange={handleInputChange}
                                />
                                <label className="form-label">Zdjęcie</label>
                                <input
                                    type="file"
                                    name="avatar"
                                    className="form-control"
                                    onChange={handleFileChange}
                                />
                            </div>
                            <div className="modal-footer d-flex justify-content-between">
                                <button
                                    className="btn btn-secondary w-50 me-2"
                                    onClick={() => setEditingUser(null)}
                                >
                                    Anuluj
                                </button>
                                <button
                                    className="btn btn-primary w-50"
                                    onClick={isCreating ? handleCreate : handleUpdate}
                                >
                                    Zapisz
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminPanel;