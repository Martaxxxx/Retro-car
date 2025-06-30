import React, { useState, useEffect } from "react";
import axios from "../axios";
import Navbar from "../components/Navbar";
import WheelSpinner from "../components/WheelSpinner";
import { useUser } from "../components/context/UserContext";

const UserSettings: React.FC = () => {
  const { setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string>("/user.jpg");
  const [user, setUserLocal] = useState<any>(null);
  const [editedUser, setEditedUser] = useState({
    name: "",
    surname: "",
    role: "",
    email: "",
    login: "",
    password: "",
    current_password: "",
    password_confirmation: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/user");
        const parsedUser = response.data;
        setUserLocal(parsedUser);
        setEditedUser((prev) => ({
          ...prev,
          name: parsedUser.name || "",
          surname: parsedUser.surname || "",
          role: parsedUser.roles?.[0] || "",
          email: parsedUser.email || "",
          login: parsedUser.login || "",
        }));
        setPreview(parsedUser.avatar || "/user.jpg");
      } catch (error) {
        console.error("Błąd ładowania użytkownika:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditedUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const formData = new FormData();
      Object.entries(editedUser).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const response = await axios.post("/user/settings", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedUser = response.data.user;
      setUserLocal(updatedUser);

      const formattedUser = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar || "/user.jpg",
        roles: updatedUser.role ? [updatedUser.role] : updatedUser.roles || ["user"],
      };

      setUser(formattedUser);
      localStorage.setItem("user", JSON.stringify(formattedUser));
      window.dispatchEvent(new Event("user:updated"));

      alert("Dane zapisane pomyślnie.");
    } catch (error: any) {
      console.error("Błąd zapisu danych użytkownika:", error);
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        const message = Object.values(validationErrors).flat().join("\n");
        alert("Błąd walidacji:\n" + message);
      } else {
        alert("Nie udało się zapisać zmian.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) return <WheelSpinner />;

  return (
    <>
      <Navbar />
      <div className="container" style={{ marginTop: "110px" }}>
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
                <tr>
                  <th>Imię</th>
                  <td>
                    <input
                      className="form-control"
                      value={editedUser.name}
                      onChange={(e) => handleFieldChange("name", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <th>Nazwisko</th>
                  <td>
                    <input
                      className="form-control"
                      value={editedUser.surname}
                      onChange={(e) => handleFieldChange("surname", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <th>Login</th>
                  <td>
                    <input
                      className="form-control"
                      value={editedUser.login}
                      onChange={(e) => handleFieldChange("login", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <th>Rola</th>
                  <td>
                    <input className="form-control" value={editedUser.role} disabled />
                  </td>
                </tr>
                <tr>
                  <th>Email</th>
                  <td>
                    <input
                      className="form-control"
                      value={editedUser.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <th>Obecne hasło</th>
                  <td>
                    <input
                      type="password"
                      className="form-control"
                      value={editedUser.current_password}
                      onChange={(e) => handleFieldChange("current_password", e.target.value)}
                      placeholder="Wprowadź obecne hasło"
                    />
                  </td>
                </tr>
                <tr>
                  <th>Nowe hasło</th>
                  <td>
                    <input
                      type="password"
                      className="form-control"
                      value={editedUser.password}
                      onChange={(e) => handleFieldChange("password", e.target.value)}
                      placeholder="Wprowadź nowe hasło"
                    />
                  </td>
                </tr>
                <tr>
                  <th>Powtórz hasło</th>
                  <td>
                    <input
                      type="password"
                      className="form-control"
                      value={editedUser.password_confirmation}
                      onChange={(e) => handleFieldChange("password_confirmation", e.target.value)}
                      placeholder="Powtórz nowe hasło"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            {user.roles?.includes("admin") ? (
              <button className="btn btn-custom mt-3" onClick={handleSave}>
                Zapisz zmiany
              </button>
            ) : (
              <button className="btn btn-secondary mt-3" disabled>
                🔒 Zmiana danych tylko przez admina
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserSettings;
