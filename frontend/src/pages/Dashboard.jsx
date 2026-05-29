import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Demandes from '../components/Demandes';
import Tuteurs from '../components/Tuteurs';
import Messages from '../components/Messages';
import MesDemandes from '../components/MesDemandes';
import { Evaluations, Certificat } from '../components/EvCert';
import Profile from './Profile';
import api from '../services/api';
import './Dashboard.css';

const SCREENS = {
  demandes:    { title: "Demandes d'aide",     icon: '⏰', bg: 'var(--orange-light)', btn: '✏️ Nouvelle demande' },
  tuteurs:     { title: 'Tuteurs disponibles', icon: '🌟', bg: 'var(--orange-light)', btn: '🙋 Devenir tuteur' },
  messages:    { title: 'Messages',            icon: '💬', bg: 'var(--blue-light)',   btn: '✉️ Nouveau message' },
  'mes-demandes': { title: 'Mes demandes',     icon: '📌', bg: 'var(--blue-light)',   btn: null },
  evaluations: { title: 'Mes évaluations',     icon: '⭐', bg: '#FDF6E3',             btn: '📊 Voir stats' },
  certificat:  { title: 'Certificat Helper',   icon: '🏅', bg: 'var(--gold-light)',   btn: '📥 Télécharger' },
  profil:      { title: 'Mon Profil',          icon: '👤', bg: 'var(--bg)',           btn: null },
};

export default function Dashboard() {
  const [active, setActive]           = useState('demandes');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast]             = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [notifCount, setNotifCount]   = useState(0);
  const [subTitle, setSubTitle]       = useState('');
  const demandesRef = useRef(null);
  const tueursRef = useRef(null);

  const screen = SCREENS[active];

  // handleNav ferme automatiquement le menu tiroir sur mobile
  const handleNav = (id) => {
    setActive(id);
    setIsSidebarOpen(false);
  };

  // Charger le nombre de notifications non lues
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifCount(res.data.non_lues || 0);
      } catch {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sous-titres dynamiques selon l'écran
  useEffect(() => {
    const fetchSub = async () => {
      try {
        if (active === 'demandes') {
          const res = await api.get('/demandes');
          setSubTitle(`${res.data.length} demandes en attente · Sois le héros de quelqu'un aujourd'hui 🦸`);
        } else if (active === 'tuteurs') {
          const res = await api.get('/tuteurs');
          setSubTitle(`${res.data.length} helpers prêts à t'aider · Tous évalués par la communauté 🌟`);
        } else if (active === 'messages') {
          const res = await api.get('/messages/conversations');
          const nonLus = res.data.reduce((acc, c) => acc + (c.non_lus || 0), 0);
          setSubTitle(nonLus > 0 ? `${nonLus} message(s) non lu(s) 💬` : 'Toutes tes conversations 💬');
        } else if (active === 'mes-demandes') {
          const res = await api.get('/demandes/mes');
          setSubTitle(`${res.data.length} demande(s) publiée(s) · Suis les réponses et valide l'aide reçue`);
        } else if (active === 'evaluations') {
          const res = await api.get('/evaluations/mes');
          const moy = res.data.stats?.moyenne;
          setSubTitle(moy ? `Note moyenne ${parseFloat(moy).toFixed(1)} ⭐ · Continue comme ça 🔥` : 'Aucune évaluation pour l\'instant');
        } else if (active === 'certificat') {
          const res = await api.get('/sessions/mes');
          const validated = res.data.filter((s) => s.aide_validee_par_eleve);
          const pts = Math.min(validated.length * 50, 1000);
          setSubTitle(`${pts} / 1000 pts · Plus que ${1000 - pts} pts pour le certif officiel 🏅`);
        }
      } catch {
        setSubTitle('');
      }
    };
    fetchSub();
  }, [active]);

  const showToast = (msg) => {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const confetti = () => {
    const colors = ['#F5700A', '#1A5FA8', '#FFD166', '#06D6A0', '#FF6B9D'];
    for (let i = 0; i < 28; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.cssText = `left:${Math.random() * 100}vw;top:-10px;background:${colors[i % colors.length]};transform:rotate(${Math.random() * 360}deg);animation-delay:${Math.random() * 0.5}s;animation-duration:${1.2 + Math.random() * 0.8}s;`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    }
  };

  const openMessagesForTutor = (sessionId) => {
    localStorage.setItem('preferredSessionId', String(sessionId));
    handleNav('messages');
    showToast('💬 Conversation ouverte');
  };

  return (
    <div className="app">
      <Sidebar active={active} onNav={handleNav} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} notifCount={notifCount} />

      <div className="main">
        <div className="topbar">
          <div className="topbar-left">
            <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Ouvrir le menu">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4h12M2 8h12M2 12h12" strokeLinecap="round" /></svg>
            </button>
            <div className="page-icon" style={{ background: screen.bg }}>{screen.icon}</div>
            <div>
              <div className="page-title">{screen.title}</div>
              <div className="page-sub">{subTitle || '…'}</div>
            </div>
          </div>
        <div className="topbar-right">
          {screen.btn && (
            <button 
              className="btn-primary" 
              onClick={() => {
                if (active === 'demandes' && demandesRef.current) demandesRef.current.openModal();
                if (active === 'tuteurs' && tueursRef.current) tueursRef.current.openModal();
                if (active === 'messages') setActive('tuteurs'); // Nouveau message = voir tuteurs dispo
              }}
              style={{ padding: '8px 16px', borderRadius: '8px', fontSize: 14 }}
            >
              {screen.btn}
            </button>
          )}
          {notifCount > 0 && (
            <div style={{ fontSize: 13, color: 'var(--orange)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              🔔 {notifCount}
            </div>
          )}
        </div>
        </div>

        <div className="content">
          {active === 'demandes'    && <Demandes    showToast={showToast} confetti={confetti} ref={demandesRef} />}
          {active === 'tuteurs'     && <Tuteurs     showToast={showToast} openMessagesForTutor={openMessagesForTutor} ref={tueursRef} />}
          {active === 'messages'    && <Messages    showToast={showToast} />}
          {active === 'mes-demandes' && <MesDemandes showToast={showToast} />}
          {active === 'evaluations' && <Evaluations showToast={showToast} />}
          {active === 'certificat'  && <Certificat  showToast={showToast} confetti={confetti} />}
          {active === 'profil'      && <Profile     onNavigate={setActive} />}
        </div>
      </div>

      <div className={`toast ${toastVisible ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}