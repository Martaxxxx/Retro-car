import React, { useState, useEffect } from "react";
import axios from "../axios";
import Navbar from "../components/Navbar";
import WheelSpinner from "../components/WheelSpinner";

const UserSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string>("/user.jpg");
  const [user, setUser] = useState<any>(null);
  const [editedUser, setEditedUser] = useState({
    name: "",
    surname: "",
    role: "",
    email: "",
    login: "",
    avatar: "",
    password: "",
    current_password: "",
    password_confirmation: "",
  });

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      const stored = localStorage.getItem("user");

      if (stored) {
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
        setEditedUser((prev) => ({
          ...prev,
          name: parsedUser.name || "",
          surname: parsedUser.surname || "",
          role: parsedUser.role || "",
          email: parsedUser.email || "",
          login: parsedUser.login || "",
          avatar: parsedUser.avatar || "/user.jpg",
        }));
        setPreview(parsedUser.avatar || "/user.jpg");
      }

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
        setEditedUser((prev) => ({ ...prev, avatar: result }));
        setPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditedUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const cleanData = Object.fromEntries(
        Object.entries(editedUser).filter(
          ([_, value]) => value !== "" && value !== null && value !== undefined
        )
      );

      if (Object.keys(cleanData).length === 0) {
        alert("Nie dokonano żadnych zmian.");
        return;
      }

      const response = await axios.post("/user/settings", cleanData);
      const updatedUser = response.data.user;

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
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
                      onChange={(e) =>
                        handleFieldChange("password_confirmation", e.target.value)
                      }
                      placeholder="Powtórz nowe hasło"
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            {user.role === "admin" ? (
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
