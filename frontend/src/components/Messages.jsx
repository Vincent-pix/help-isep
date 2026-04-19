import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import './Demandes.css';

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState('');
  const [loading, setLoading]             = useState(true);
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
      setConversations(res.data);
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
    <div className="msg-layout">
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
            <p style={{ fontSize: 13 }}>Sélectionne une conversation</p>
          </div>
        ) : (
          <>
            <div className="chat-top">
              <div className="av av-md av-b">
                {initials(activeConv.interlocuteur_nom, activeConv.interlocuteur_prenom)}
              </div>
              <div>
                <div className="chat-name-el">
                  {activeConv.interlocuteur_prenom} {activeConv.interlocuteur_nom}
                </div>
                <div className="chat-sub-el">{activeConv.demande_titre}</div>
              </div>
              <div className="online" />
            </div>

            <div className="chat-body">
              {messages.map((m, i) => (
                <div key={i}>
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