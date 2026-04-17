import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeScreen, setActiveScreen, logout }) {
  const { user } = useAuth();
  
  const initials = user ? ((user.prenom?.[0] || '?') + (user.nom?.[0] || '?')).toUpperCase() : '??';

  const navItems = [
    { id: 'demandes', label: "Demandes d'aide", icon: '⏰', badge: true },
    { id: 'tuteurs', label: 'Tuteurs disponibles', icon: '🌟' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'evaluations', label: 'Mes évaluations', icon: '⭐' },
    { id: 'profil', label: 'Mon profil', icon: '👤' },
  ];

  return (
    <div className="sidebar">
      <div className="sb-logo">
        <div style={{ fontSize: '18px' }}>🎓</div>
        <div>
          <div className="sb-app-name">Help'ISEP</div>
          <div className="sb-tagline">Tuteurs & Entraide</div>
        </div>
      </div>

      <div className="sb-user">
        <div className="sb-av">{initials}</div>
        <div>
          <div className="sb-uname">{user?.prenom} {user?.nom}</div>
          <div className="sb-upromo">{user?.role}</div>
        </div>
      </div>

      <nav>
        <div className="nav-sec">Navigation</div>
        {navItems.map((item) => (
          <div
            key={item.id}
            className={`nav-item ${activeScreen === item.id ? 'active' : ''}`}
            onClick={() => setActiveScreen(item.id)}
            style={{ cursor: 'pointer' }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && <span className="nav-badge">5</span>}
          </div>
        ))}
      </nav>

      <div className="sb-bottom">
        <button
          className="sb-logout"
          onClick={logout}
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
