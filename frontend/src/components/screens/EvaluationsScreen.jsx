import React, { useState, useEffect } from 'react';
import { evaluationAPI } from '../../services/api';

export default function EvaluationsScreen() {
  const [evals, setEvals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvals();
  }, []);

  const loadEvals = async () => {
    try {
      setLoading(true);
      const res = await evaluationAPI.getMesEvals();
      setEvals(res.data);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const avg = evals.length > 0 
    ? (evals.reduce((s, e) => s + e.note, 0) / evals.length).toFixed(1)
    : '—';

  return (
    <div className="screen active">
      <div className="stats-row">
        <div className="stat-card orange">
          <div className="stat-val">{avg}</div>
          <div className="stat-lbl">Note moyenne</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-val">{evals.length}</div>
          <div className="stat-lbl">Évaluations reçues</div>
        </div>
      </div>

      <div className="section-title">Mes évaluations</div>
      <div className="eval-list">
        {loading ? (
          <div className="loading"><div className="spinner"></div>Chargement...</div>
        ) : evals.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">⭐</div>
            <div className="empty-text">Pas encore d'évaluations reçues</div>
          </div>
        ) : (
          evals.map((e, i) => {
            const stars = '★'.repeat(e.note) + '☆'.repeat(5 - e.note);
            return (
              <div key={i} className="eval-card">
                <div className="eval-head">
                  <div>
                    <div className="eval-title">Session #{e.session_id}</div>
                    <div className="eval-sub">{new Date(e.date_evaluation).toLocaleDateString()}</div>
                  </div>
                  <div className="eval-stars">{stars}</div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text2)' }}>
                  {e.commentaire || 'Aucun commentaire'}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
