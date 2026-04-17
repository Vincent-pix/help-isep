import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

export default function Register() {
  const navigate = useNavigate();
  const { register, login } = useAuth();
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!nom || !prenom || !email || !password) {
        setError("Remplis tous les champs.");
        return;
      }

      if (password.length < 6) {
        setError("Mot de passe trop court (min. 6 caractères).");
        return;
      }

      await register(nom, prenom, email, password);
      
      // Connexion automatique après inscription
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-box">
        <div className="auth-logo">
          <h1>Help'<span>ISEP</span></h1>
          <p>Créer ton compte</p>
        </div>

        {error && <div className="auth-err" style={{ display: "block" }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row-2">
            <div className="form-group">
              <label>Prénom</label>
              <input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Jean"
              />
            </div>
            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Dupont"
              />
            </div>
          </div>

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
            {loading ? "Inscription..." : "Créer mon compte"}
          </button>
        </form>

        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "var(--text3)" }}>
            Déjà un compte ?{" "}
            <Link to="/login" style={{ color: "var(--orange)", fontWeight: "600", textDecoration: "none" }}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}