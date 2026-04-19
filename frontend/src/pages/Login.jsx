import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Login.css';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', mot_de_passe: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await api.post('/auth/register', form);
        setMode('login');
        setError('');
        alert('Compte créé ! Tu peux maintenant te connecter.');
      } else {
        const res = await api.post('/auth/login', {
          email: form.email,
          mot_de_passe: form.mot_de_passe,
        });
        login(res.data.user, res.data.token);
        navigate('/app');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🎓</div>
          <div>
            <div className="login-appname">Help'ISEP</div>
            <div className="login-tagline">Entraide étudiante</div>
          </div>
        </div>

        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Connexion
          </button>
          <button
            className={`login-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Inscription
          </button>
        </div>

        <div className="login-form">
          {mode === 'register' && (
            <div className="login-row-double">
              <div className="form-row">
                <label>Nom</label>
                <input name="nom" placeholder="Dupont" value={form.nom} onChange={handle} />
              </div>
              <div className="form-row">
                <label>Prénom</label>
                <input name="prenom" placeholder="Alice" value={form.prenom} onChange={handle} />
              </div>
            </div>
          )}
          <div className="form-row">
            <label>Email</label>
            <input name="email" type="email" placeholder="alice@isep.fr" value={form.email} onChange={handle} />
          </div>
          <div className="form-row">
            <label>Mot de passe</label>
            <input name="mot_de_passe" type="password" placeholder="••••••••" value={form.mot_de_passe} onChange={handle}
              onKeyDown={(e) => e.key === 'Enter' && submit()} />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button className="btn-primary login-submit" onClick={submit} disabled={loading}>
            {loading ? 'Chargement…' : mode === 'login' ? '🚀 Se connecter' : '✨ Créer mon compte'}
          </button>
        </div>
      </div>
    </div>
  );
}