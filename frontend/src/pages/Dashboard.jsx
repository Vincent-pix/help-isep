import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Demandes from '../components/Demandes';
import Tuteurs from '../components/Tuteurs';
import Messages from '../components/Messages';
import { Evaluations, Certificat } from '../components/EvCert';
import Lea from '../components/Lea';
import api from '../services/api';
import './Dashboard.css';

const SCREENS = {
  demandes:    { title: "Demandes d'aide",     icon: '⏰', bg: 'var(--orange-light)', btn: '✏️ Nouvelle demande' },
  tuteurs:     { title: 'Tuteurs disponibles', icon: '🌟', bg: 'var(--orange-light)', btn: '🙋 Devenir tuteur' },
  messages:    { title: 'Messages',            icon: '💬', bg: 'var(--blue-light)',   btn: '✉️ Nouveau message' },
  evaluations: { title: 'Mes évaluations',     icon: '⭐', bg: '#FDF6E3',             btn: '📊 Voir stats' },
  certificat:  { title: 'Certificat Helper',   icon: '🏅', bg: 'var(--gold-light)',   btn: '📥 Télécharger' },
};

export default function Dashboard() {
  const [active, setActive]           = useState('demandes');
  const [toast, setToast]             = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [notifCount, setNotifCount]   = useState(0);
  const [subTitle, setSubTitle]       = useState('');
  const demandesRef = useRef(null);
  const tueursRef = useRef(null);

  const screen = SCREENS[active];

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
        } else if (active === 'evaluations') {
          const res = await api.get('/evaluations/mes');
          const moy = res.data.stats?.moyenne;
          setSubTitle(moy ? `Note moyenne ${parseFloat(moy).toFixed(1)} ⭐ · Continue comme ça 🔥` : 'Aucune évaluation pour l\'instant');
        } else if (active === 'certificat') {
          const res = await api.get('/sessions/mes');
          const pts = Math.min(res.data.length * 50, 1000);
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

  return (
    <div className="app">
      <Sidebar active={active} onNav={setActive} notifCount={notifCount} />

      <div className="main">
        <div className="topbar">
          <div className="topbar-left">
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
          {active === 'tuteurs'     && <Tuteurs     showToast={showToast} ref={tueursRef} />}
          {active === 'messages'    && <Messages    showToast={showToast} />}
          {active === 'evaluations' && <Evaluations showToast={showToast} />}
          {active === 'certificat'  && <Certificat  showToast={showToast} confetti={confetti} />}
        </div>
      </div>

      <Lea />
      <div className={`toast ${toastVisible ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}