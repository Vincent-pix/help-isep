import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

const NAV = [
  {
    id: 'demandes', label: "Demandes d'aide", section: 'Explorer',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 2" strokeLinecap="round" /></svg>
  },
  {
    id: 'tuteurs', label: 'Tuteurs', section: null,
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="6" cy="5" r="2.5" /><path d="M2 14c0-2.8 1.8-5 4-5s4 2.2 4 5" strokeLinecap="round" /></svg>
  },
  {
    id: 'messages', label: 'Messages', section: 'Communauté',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="3" width="12" height="8" rx="1.5" /><path d="M2 5l6 4 6-4" strokeLinecap="round" /></svg>
  },
  {
    id: 'evaluations', label: 'Évaluations', section: null,
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><polygon points="8,2 10,6 14,6.5 11,9.5 11.8,14 8,12 4.2,14 5,9.5 2,6.5 6,6" /></svg>
  },
  {
    id: 'certificat', label: 'Certificat Helper', section: 'Récompenses',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="5" width="12" height="9" rx="1.5" /><path d="M5 5V3.5a3 3 0 016 0V5" strokeLinecap="round" /><circle cx="8" cy="10" r="1.5" /></svg>
  },
];

export default function Sidebar({ active, onNav, notifCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user
    ? `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase()
    : '?';

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <div className="sb-logo-icon">🎓</div>
        <div>
          <div className="sb-app-name">Help'ISEP</div>
          <div className="sb-tagline">Entraide étudiante 🚀</div>
        </div>
      </div>

      <div className="sb-user">
        <div className="sb-av">{initials}</div>
        <div>
          <div className="sb-uname">{user?.prenom} {user?.nom}</div>
          <div className="sb-upromo">{user?.role === 'admin' ? '👑 Admin' : 'ISEP'}</div>
        </div>
      </div>

      <div className="xp-block">
        <div className="xp-head">
          <span className="xp-label">⚡ Points Helper</span>
          <span className="xp-pts">En cours…</span>
        </div>
        <div className="xp-track"><div className="xp-fill" style={{ width: '20%' }} /></div>
        <div className="xp-sub">Complète des sessions pour gagner des pts 🏅</div>
      </div>

      <nav>
        {NAV.map(item => (
          <div key={item.id}>
            {item.section && <div className="nav-sec">{item.section}</div>}
            <div
              className={`nav-item ${active === item.id ? 'active' : ''}`}
              onClick={() => onNav(item.id)}
            >
              <span className="nav-ico">{item.icon}</span>
              {item.label}
              {item.id === 'messages' && notifCount > 0 && (
                <span className="nav-badge">{notifCount}</span>
              )}
            </div>
          </div>
        ))}
      </nav>

      <div className="sb-bottom">
        <div className="mood">
          <div className="mood-emoji">☀️</div>
          <div className="mood-text">
            <strong>Continue comme ça !</strong>
            Aide tes camarades et progresse.
          </div>
        </div>
        <button className="btn-logout" onClick={() => { logout(); navigate('/'); }}>
          🚪 Déconnexion
        </button>
      </div>
    </aside>
  );
}