import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useLoading } from "../components/context/LoadingContext";

const UserSettings: React.FC = () => {
  const { setLoading } = useLoading();
  const [preview, setPreview] = useState<string>("/user.jpg");
  const [user, setUser] = useState<any>(null);
  const [editedUser, setEditedUser] = useState<any>(null);

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
      setEditedUser(userData);
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
        setEditedUser((prev: any) => ({ ...prev, avatar: result }));
        setPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditedUser((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setUser(editedUser);
    localStorage.setItem("user", JSON.stringify(editedUser));
    window.dispatchEvent(new Event("user:updated")); // dla Navbaru i innych
  };

  if (!user) return null;

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
                <tr>
                  <th>Imię</th>
                  <td>
                    <input
                      className="form-control"
                      value={editedUser?.name}
                      onChange={(e) => handleFieldChange("name", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <th>Nazwisko</th>
                  <td>
                    <input
                      className="form-control"
                      value={editedUser?.surname}
                      onChange={(e) => handleFieldChange("surname", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <th>Login</th>
                  <td>
                    <input
                      className="form-control"
                      value={editedUser?.login}
                      onChange={(e) => handleFieldChange("login", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <th>Rola</th>
                  <td>
                    <input
                      className="form-control"
                      value={editedUser?.role}
                      disabled
                    />
                  </td>
                </tr>
                <tr>
                  <th>Email</th>
                  <td>
                    <input
                      className="form-control"
                      value={editedUser?.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <th>Hasło</th>
                  <td>
                    <input
                      type="password"
                      className="form-control"
                      value={editedUser?.password}
                      onChange={(e) => handleFieldChange("password", e.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            {user.role === "admin" ? (
              <button className="btn btn-custom mt-3" onClick={handleSave}>
                💾 Zapisz zmiany
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
