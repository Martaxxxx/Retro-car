import React, { useEffect, useState } from "react";
import axios from "../axios";
import Navbar from "../components/Navbar";
import WheelSpinner from "../components/WheelSpinner";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";

interface LogEntry {
  id: number;
  created_at: string;
  ip_address: string;
  user_agent: string;
}

const UserLogs: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const userNameFromState = (location.state as { name?: string })?.name;

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/users/${id}/logs`, {
        params: {
          page: currentPage,
          from: fromDate || undefined,
          to: toDate || undefined,
        },
      });

      setLogs(res.data.data || []);
      setTotalPages(res.data.last_page || 1);
    } catch (err) {
      console.error("Błąd podczas pobierania logów", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, [id, currentPage]);

  const detectBrowser = (userAgent: string) => {
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
    if (userAgent.includes("Edg")) return "Edge";
    return "Nieznana";
  };

  const handleSearch = () => {
    setCurrentPage(1); // Zresetuj stronę przy wyszukiwaniu
    fetchLogs();
  };

  if (loading) return <WheelSpinner />;

  return (
    <>
      <Navbar />
      <div className="container mt-5 pt-5">
        {/* Link powrotu na górze */}
        <div className="mb-3">
          <Link
            to="/adminpanel"
            className="btn btn-outline-secondary rounded-pill px-4"
            style={{ textDecoration: "none", display: "inline-block" }}
          >
            ← Wróć do listy użytkowników
          </Link>
        </div>

        <h3 className="mb-4">Historia logowań – {userNameFromState || "Nieznany użytkownik"}</h3>

        {/* Filtry */}
        <div className="row mb-4">
          <div className="col-md-3">
            <input
              type="date"
              className="form-control"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <input
              type="date"
              className="form-control"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary w-100" onClick={handleSearch}>
              Szukaj
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div className="table-responsive">
          <table className="table table-bordered table-striped text-center align-middle">
            <thead className="table-dark">
              <tr>
                <th>Data</th>
                <th>Adres IP</th>
                <th>Przeglądarka</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.created_at).toLocaleString("pl-PL")}</td>
                    <td>{log.ip_address}</td>
                    <td>{detectBrowser(log.user_agent)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3}>Brak logowań.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginacja */}
        <div className="mt-3 text-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`btn btn-sm mx-1 ${page === currentPage ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default UserLogs;