import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sessionAPI, messageAPI } from '../../services/api';

export default function MessagesScreen() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await sessionAPI.getMesSessions();
      setSessions(res.data);
      if (res.data.length > 0) {
        await selectSession(res.data[0]);
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectSession = async (session) => {
    setActiveSession(session);
    try {
      const res = await messageAPI.get(session.id);
      setMessages(res.data);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !activeSession) return;

    try {
      await messageAPI.send(activeSession.id, messageInput);
      setMessageInput('');
      const res = await messageAPI.get(activeSession.id);
      setMessages(res.data);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  return (
    <div className="screen active">
      <div className="msg-layout">
        <div className="conv-list">
          {loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: '16px', fontSize: '13px', color: 'var(--text3)' }}>
              Aucune conversation
            </div>
          ) : (
            sessions.map((s, i) => {
              const other = s.mon_role === 'tuteur'
                ? `${s.eleve_prenom || 'Élève'} ${s.eleve_nom || ''}`.trim()
                : `${s.tuteur_prenom || 'Tuteur'} ${s.tuteur_nom || ''}`.trim();
              const initials = (other[0] || '?') + ((other.split(' ')[1]?.[0]) || '?');

              return (
                <div
                  key={s.id}
                  className={`conv-item ${activeSession?.id === s.id ? 'active' : ''}`}
                  onClick={() => selectSession(s)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="av av-o" style={{ width: '34px', height: '34px', fontSize: '12px', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div className="conv-meta">
                    <div className="conv-from">{other}</div>
                    <div className="conv-preview">{s.demande_titre || 'Session'}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="chat-panel">
          {activeSession ? (
            <>
              <div className="chat-top">
                <div className="av av-sm av-o" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                  {activeSession.tuteur_prenom?.[0] || '?'}
                </div>
                <div>
                  <div className="chat-name-el">{activeSession.demande_titre || 'Session'}</div>
                  <div className="chat-sub-el">Session #{activeSession.id}</div>
                </div>
              </div>
              <div className="chat-body" id="chat-body">
                {messages.map((m, i) => (
                  <React.Fragment key={i}>
                    <div className={`bubble ${m.expediteur_id === user?.id ? 'me' : 'them'}`}>
                      {m.contenu}
                    </div>
                    <div className={`btime ${m.expediteur_id === user?.id ? 'r' : ''}`}>
                      {new Date(m.date_envoi).toLocaleTimeString()}
                    </div>
                  </React.Fragment>
                ))}
              </div>
              <div className="chat-footer">
                <input
                  className="chat-input"
                  placeholder="Écrire un message…"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button className="send-btn" onClick={sendMessage}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2">
                    <path d="M2 8h12"/><path d="M10 4l6 4-6 4"/>
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="no-conv">
              <div style={{ fontSize: '24px' }}>💬</div>
              <div>Sélectionne une conversation</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
