import React from 'react';

const screensMeta = {
  demandes: { title: "Demandes d'aide", icon: '⏰', bg: 'var(--orange-light)', btn: '✏️ Nouvelle demande' },
  tuteurs: { title: 'Tuteurs disponibles', icon: '🌟', bg: 'var(--green-light)', btn: '🙋 Devenir tuteur' },
  messages: { title: 'Messages', icon: '💬', bg: 'var(--blue-light)', btn: '✉️ Nouveau message' },
  evaluations: { title: 'Mes évaluations', icon: '⭐', bg: '#FDF6E3', btn: '📊 Voir stats' },
  profil: { title: 'Mon profil', icon: '👤', bg: 'var(--bg2)', btn: '✏️ Modifier' },
};

export default function Topbar({ activeScreen, setActiveScreen }) {
  const meta = screensMeta[activeScreen] || screensMeta.demandes;

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="page-icon" style={{ background: meta.bg }}>
          {meta.icon}
        </div>
        <div>
          <div className="page-title">{meta.title}</div>
          <div className="page-sub" id="page-sub">Explore et aide tes camarades 🚀</div>
        </div>
      </div>
      <div className="topbar-right">
        <button className="btn-primary">{meta.btn}</button>
      </div>
    </div>
  );
}
