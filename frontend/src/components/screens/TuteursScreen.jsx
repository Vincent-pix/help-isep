import React, { useState, useEffect } from 'react';
import { tuteurAPI } from '../../services/api';

export default function TuteursScreen() {
  const [tuteurs, setTuteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    loadTuteurs();
  }, []);

  const loadTuteurs = async () => {
    try {
      setLoading(true);
      const res = await tuteurAPI.getAll();
      setTuteurs(res.data);
    } catch (err) {
      console.error('Erreur:', err);
      setStatusMessage('Impossible de charger les tuteurs.');
    } finally {
      setLoading(false);
    }
  };

  const devenirTuteur = async () => {
    try {
      setActionLoading(true);
      const res = await tuteurAPI.devenir();
      setStatusMessage(res.data?.message || 'Votre profil tuteur a été créé.');
      await loadTuteurs();
    } catch (err) {
      console.error('Erreur devenir tuteur:', err);
      setStatusMessage(err.response?.data?.message || 'Impossible de devenir tuteur pour le moment.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="screen active">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <button className="btn-primary" onClick={devenirTuteur} disabled={actionLoading}>
          {actionLoading ? 'Patientez...' : '🙋 Devenir tuteur'}
        </button>
        {statusMessage && <div style={{ color: '#2e7d32', fontSize: '13px' }}>{statusMessage}</div>}
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          Chargement...
        </div>
      ) : tuteurs.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🔍</div>
          <div className="empty-text">Aucun tuteur disponible</div>
        </div>
      ) : (
        <div className="tutor-grid">
          {tuteurs.map((t) => {
            const initials = ((t.prenom || '?')[0] + (t.nom || '?')[0]).toUpperCase();
            const note = t.note_moyenne ? parseFloat(t.note_moyenne).toFixed(1) : '—';
            const stars = t.note_moyenne
              ? '★'.repeat(Math.round(t.note_moyenne)) + '☆'.repeat(5 - Math.round(t.note_moyenne))
              : '—';
            const matieres = (t.matieres || '').split(',').filter(Boolean);

            return (
              <div key={t.id} className="tutor-card">
                <div className="tutor-head">
                  <div className="av av-md av-o">{initials}</div>
                  <div className="tutor-info">
                    <div className="name">{t.prenom} {t.nom}</div>
                    <div className="promo">{t.nb_sessions || 0} sessions • {note} ⭐</div>
                  </div>
                </div>
                <div className="stars">
                  {stars} <span style={{ color: 'var(--text3)', fontSize: '11px' }}>({t.nb_sessions || 0})</span>
                </div>
                <div className="tags">
                  {matieres.length > 0
                    ? matieres.map((m, i) => <span key={i} className="tag">{m.trim()}</span>)
                    : <span className="tag">—</span>
                  }
                </div>
                <button className="btn-contact">Contacter</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
