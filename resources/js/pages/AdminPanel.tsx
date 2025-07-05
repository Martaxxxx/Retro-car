import React, { useEffect, useState } from "react";
import axios from "../axios";
import Navbar from "../components/Navbar";
import { useUser } from "../components/context/UserContext";
import WheelSpinner from "../components/WheelSpinner";
import { useNavigate } from "react-router-dom";
import Select from "react-select";

// Style identyczne jak w Renowacjach!
const customSelectStyles = {
  control: (base) => ({
    ...base,
    backgroundColor: "#fff",
    borderColor: "#9C2F3B",
    boxShadow: "none",
    "&:hover": { borderColor: "#9C2F3B" },
    textAlign: "center",        
  }),
  singleValue: (base) => ({
    ...base,
    textAlign: "center",         
    width: "100%",               
    margin: 0,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "#9C2F3B" : "#fff",
    color: state.isFocused ? "#fff" : "#000",
    cursor: "pointer",
    textAlign: "center",       
  }),
}

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "user", label: "User" },
  { value: "purchaser", label: "Purchaser" },
];

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  created_at: string;
  roles?: string[];
}

interface FormDataState {
  name: string;
  email: string;
  role: string;
  password?: string;
  avatar?: File;
}

const AdminPanel: React.FC = () => {
  const { user: currentUser, setUser } = useUser();
  const navigate = useNavigate();

  const handleViewLogs = (userId: number, userName: string) => {
    navigate(`/admin/users/${userId}/logs`, { state: { name: userName } });
  };

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
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Błąd pobierania użytkowników:", err);
    } finally {
      setIsLoading(false);
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

  // (nie potrzebujesz już obsługi <select>, tylko <input>)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setIsSaving(true);
      const data = buildFormData();
      await axios.post("/api/users", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEditingUser(null);
      fetchUsers();
      alert("Zmiany zapisane pomyślnie.");
    } catch (err: any) {
      console.error("Błąd tworzenia użytkownika:", err);
      alert("Błąd tworzenia użytkownika");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    try {
      setIsSaving(true);
      const data = buildFormData();
      await axios.post(`/api/users/${editingUser.id}?_method=PUT`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setEditingUser(null);
      fetchUsers();

      if (editingUser.id === currentUser?.id) {
        const refreshed = await axios.get("/api/user");
        const updatedUser = refreshed.data;
        const formatted = {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          avatar: updatedUser.avatar || "/user.jpg",
          roles: updatedUser.role ? [updatedUser.role] : updatedUser.roles || ["user"],
        };
        localStorage.setItem("user", JSON.stringify(formatted));
        setUser(formatted);
        window.dispatchEvent(new Event("user:updated"));
      }

      alert("Zmiany zapisane pomyślnie.");
    } catch (err: any) {
      console.error("Błąd zapisu zmian:", err);
      alert("Błąd zapisu zmian");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm("Czy na pewno chcesz usunąć tego użytkownika?")) return;
    try {
      await axios.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      console.error("Błąd usuwania użytkownika:", err);
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

  if (isLoading) return <WheelSpinner />;

  return (
    <>
      <Navbar />
      <div className="container mt-5 pt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Użytkownicy</h2>
          <button className="btn btn-dark rounded-pill px-4" onClick={openCreateModal}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus">
              <path d="M5 12h14" /><path d="M12 5v14" />
            </svg> Dodaj użytkownika
          </button>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <input type="text" className="form-control" placeholder="Szukaj (ID, imię, email, rola...)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="col-md-4">
            <select className="form-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="">Wszystkie role</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="user">User</option>
              <option value="purchaser">Purchaser</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-striped text-center align-middle">
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
                    <img src={user.avatar || "/default-avatar.png"} alt="avatar" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                  </td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="icon-actions d-flex gap-2 justify-content-center">
                    <button className="icon-view-btn" onClick={() => handleViewLogs(user.id, user.name)} title="Pokaż logi logowania">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-icon lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button className="icon-edit-btn" onClick={() => openEditModal(user)} title="Edytuj">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-round-pen">
                          <path d="M2 21a8 8 0 0 1 10.821-7.487" />
                          <path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />
                          <circle cx="10" cy="8" r="5" />
                        </svg>
                      </button>
                      <button className="icon-remove-btn" onClick={() => handleDelete(user.id)} title="Usuń">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-trash3" viewBox="0 0 16 16">
                                            <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5" />
                                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="modal show fade d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              {isSaving && <WheelSpinner />}
              <div className="modal-header">
                <h5 className="modal-title">{isCreating ? "Dodaj użytkownika" : "Edytuj użytkownika"}</h5>
                <button type="button" className="btn-close" onClick={() => setEditingUser(null)}></button>
              </div>
              <div className="modal-body">
                <input type="text" name="name" className="form-control mb-2" placeholder="Imię" value={formData.name} onChange={handleInputChange} />
                <input type="email" name="email" className="form-control mb-2" placeholder="Email" value={formData.email} onChange={handleInputChange} />
                {/* REACT-SELECT ZAMIENIA <select> */}
                <Select
                  styles={customSelectStyles}
                  options={roleOptions}
                  value={roleOptions.find(opt => opt.value === formData.role)}
                  onChange={option => setFormData(prev => ({ ...prev, role: option?.value || "user" }))}
                  className="mb-2"
                  placeholder="Rola"
                />
                <input type="password" name="password" className="form-control mb-2" placeholder="Hasło" onChange={handleInputChange} />
                <label className="form-label">Zdjęcie</label>
                <input type="file" name="avatar" className="form-control" onChange={handleFileChange} />
              </div>
              <div className="modal-footer d-flex flex-column align-items-center gap-2">
                <button className="btn btn-secondary w-75" onClick={() => setEditingUser(null)}>Anuluj</button>
                <button className="btn btn-primary w-75" onClick={isCreating ? handleCreate : handleUpdate}>Zapisz</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPanel;