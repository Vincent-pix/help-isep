import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Demandes.css';

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState('');
  const [loading, setLoading]             = useState(true);
  const [showConvList, setShowConvList]   = useState(false); // Mobile: afficher/masquer liste
  const bottomRef = useRef(null);

  useEffect(() => { fetchConversations(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Rafraîchir les messages toutes les 5s si une conversation est ouverte
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => fetchMessages(activeSession), 5000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/messages/conversations');
      const list = res.data || [];
      // Regroupe par personne pour éviter plusieurs conversations dupliquées.
      const dedupedMap = new Map();
      list.forEach((conv) => {
        const current = dedupedMap.get(conv.interlocuteur_id);
        const convTs = conv.derniere_date ? new Date(conv.derniere_date).getTime() : 0;
        const currentTs = current?.derniere_date ? new Date(current.derniere_date).getTime() : 0;
        if (!current || convTs >= currentTs) {
          dedupedMap.set(conv.interlocuteur_id, conv);
        }
      });
      const dedupedList = Array.from(dedupedMap.values()).sort((a, b) => {
        const aTs = a.derniere_date ? new Date(a.derniere_date).getTime() : 0;
        const bTs = b.derniere_date ? new Date(b.derniere_date).getTime() : 0;
        return bTs - aTs;
      });
      setConversations(dedupedList);
      const preferredSessionId = Number(localStorage.getItem('preferredSessionId'));
      if (preferredSessionId) {
        const preferredConv = dedupedList.find((c) => c.session_id === preferredSessionId);
        if (preferredConv) {
          setActiveSession(preferredConv.session_id);
          fetchMessages(preferredConv.session_id);
        }
        localStorage.removeItem('preferredSessionId');
      }
    } catch {}
    finally { setLoading(false); }
  };

  const fetchMessages = async (sessionId) => {
    try {
      const res = await api.get(`/messages/${sessionId}`);
      setMessages(res.data);
    } catch {}
  };

  const selectConv = async (conv) => {
    setActiveSession(conv.session_id);
    await fetchMessages(conv.session_id);
    // Marquer comme lu localement
    setConversations(prev =>
      prev.map(c => c.session_id === conv.session_id ? { ...c, non_lus: 0 } : c)
    );
    // Sur mobile: masquer la liste après sélection
    setShowConvList(false);
  };

  const send = async () => {
    if (!input.trim() || !activeSession) return;
    const txt = input.trim();
    setInput('');
    try {
      await api.post(`/messages/${activeSession}`, { contenu: txt });
      await fetchMessages(activeSession);
      await fetchConversations();
    } catch {}
  };

  const activeConv = conversations.find(c => c.session_id === activeSession);
  const initials = (nom, prenom) => `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className={`msg-layout ${activeSession ? 'chat-active' : ''}`}>
      {/* Liste des conversations */}
      <div className="conv-list">
        {loading ? (
          <div className="loading-state">Chargement…</div>
        ) : conversations.length === 0 ? (
          <div style={{ padding: 16, fontSize: 13, color: 'var(--text3)' }}>
            Aucune conversation pour l'instant.
          </div>
        ) : (
          conversations.map(c => (
            <div
              key={c.session_id}
              className={`conv-item ${activeSession === c.session_id ? 'active' : ''}`}
              onClick={() => selectConv(c)}
            >
              <div className="av av-md av-b">{initials(c.interlocuteur_nom, c.interlocuteur_prenom)}</div>
              <div className="conv-meta">
                <div className="conv-from">{c.interlocuteur_prenom} {c.interlocuteur_nom}</div>
                <div className="conv-preview">{c.dernier_message || 'Nouvelle conversation'}</div>
              </div>
              <div className="conv-right">
                <span className="conv-time">{formatTime(c.derniere_date)}</span>
                {c.non_lus > 0 && <div className="unread-dot" />}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Panneau de chat */}
      <div className="chat-panel">
        {!activeConv ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text3)' }}>
            <div style={{ fontSize: 40 }}>💬</div>
            <p style={{ fontSize: 13 }}>Sélectionne une conversation pour commencer à échanger</p>
          </div>
        ) : (
          <>
            <div className="chat-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <button className="chat-back-btn" onClick={() => setActiveSession(null)} aria-label="Retour aux conversations">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 2L4 8l6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <div className="av av-md av-b">
                  {initials(activeConv.interlocuteur_nom, activeConv.interlocuteur_prenom)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="chat-name-el">
                    {activeConv.interlocuteur_prenom} {activeConv.interlocuteur_nom}
                  </div>
                  <div className="chat-sub-el" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeConv.demande_titre}
                  </div>
                </div>
              </div>
              <div className="online" />
            </div>

            <div className="chat-body">
              {messages.map((m, i) => (
                <div key={i}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>
                    {m.expediteur_id === user?.id ? 'Moi' : `${m.prenom} ${m.nom}`}
                  </div>
                  <div className={`bubble ${m.expediteur_id === activeConv.interlocuteur_id ? 'them' : 'me'}`}>
                    {m.contenu}
                  </div>
                  <div className={`btime ${m.expediteur_id !== activeConv.interlocuteur_id ? 'r' : ''}`}>
                    {formatTime(m.date_envoi)}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="chat-footer">
              <input
                className="chat-input"
                placeholder="Écris un message…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
              />
              <button className="send-btn" onClick={send}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M2 8h12" /><path d="M10 4l6 4-6 4" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}