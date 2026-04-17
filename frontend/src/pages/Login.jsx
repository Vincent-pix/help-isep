import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password) {
        setError("Remplis tous les champs.");
        return;
      }

      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-box">
        <div className="auth-logo">
          <h1>Help'<span>ISEP</span></h1>
          <p>Tuteurs & Entraide</p>
        </div>

        {error && <div className="auth-err" style={{ display: "block" }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.isep.fr"
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>

          <button type="submit" className="btn-full" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "var(--text3)" }}>
            Pas de compte ?{" "}
            <Link to="/register" style={{ color: "var(--orange)", fontWeight: "600", textDecoration: "none" }}>
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}