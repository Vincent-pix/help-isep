import { useState, useEffect } from 'react';
import api from '../services/api';
import './Demandes.css';

// ── ÉVALUATIONS ───────────────────────────────────────────────────────────────
export function Evaluations({ showToast }) {
  const [data, setData]     = useState({ evaluations: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [evalForm, setEvalForm] = useState({ note: 5, commentaire: '' });

  useEffect(() => {
    api.get('/evaluations/mes')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    
    api.get('/sessions/mes')
      .then(res => {
        const terminated = res.data.filter(s => s.statut === 'terminee' && !s.note_evaluation);
        setSessions(terminated);
      })
      .catch(() => {});
  }, []);

  const { evaluations, stats } = data;

  const starsStr = (note) => '★'.repeat(Math.round(note || 0)) + '☆'.repeat(5 - Math.round(note || 0));

  const submitEvaluation = async () => {
    if (!selectedSession) return;
    try {
      await api.post('/evaluations', {
        session_id: selectedSession.id,
        note: evalForm.note,
        commentaire: evalForm.commentaire
      });
      showToast('⭐ Évaluation enregistrée !');
      setShowEvalModal(false);
      setSelectedSession(null);
      setEvalForm({ note: 5, commentaire: '' });
      
      // Rafraîchir les données
      api.get('/evaluations/mes').then(res => setData(res.data)).catch(() => {});
      api.get('/sessions/mes').then(res => {
        const terminated = res.data.filter(s => s.statut === 'terminee' && !s.note_evaluation);
        setSessions(terminated);
      }).catch(() => {});
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Erreur'}`);
    }
  };

  if (loading) return <div className="loading-state">Chargement…</div>;

  return (
    <div>
      <div className="stats-row">
        <div className="stat-card orange">
          <div className="stat-val">{stats.moyenne ? parseFloat(stats.moyenne).toFixed(1) : '—'}</div>
          <div className="stat-lbl">Note moyenne</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-val">{stats.total || 0}</div>
          <div className="stat-lbl">Sessions évaluées</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{stats.total > 0 ? '96%' : '—'}</div>
          <div className="stat-lbl">Taux de satisfaction</div>
        </div>
      </div>

      {sessions.length > 0 && (
        <>
          <div className="section-title">Sessions à évaluer ({sessions.length})</div>
          <div className="cards-list" style={{ marginBottom: 32 }}>
            {sessions.map((s, i) => (
              <div className="card" key={s.id} style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="card-head">
                  <span className="badge" style={{ background: '#FFD700', color: '#333' }}>⭐ À évaluer</span>
                  <span className="card-time">{s.matiere}</span>
                </div>
                <div className="card-title">{s.demande_titre}</div>
                <div className="card-desc">
                  Session avec {s.eleve_prenom} {s.eleve_nom}
                </div>
                <div className="card-foot">
                  <div className="card-author">
                    <div className="av av-sm av-o">{s.eleve_prenom?.[0]}{s.eleve_nom?.[0]}</div>
                    {s.eleve_prenom} {s.eleve_nom}
                  </div>
                  <button 
                    className="btn-help" 
                    onClick={() => {
                      setSelectedSession(s);
                      setShowEvalModal(true);
                    }}
                  >
                    Évaluer ⭐
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-title">Dernières évaluations</div>

      {evaluations.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 36 }}>⭐</div>
          <p>Aucune évaluation reçue pour l'instant.</p>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
            Aide un camarade et demande-lui de t'évaluer !
          </p>
        </div>
      ) : (
        <div className="eval-list">
          {evaluations.map((e, i) => (
            <div className="eval-card" key={i}>
              <div className="eval-head">
                <div>
                  <div className="eval-title">{e.session_titre}</div>
                  <div className="eval-sub">
                    avec {e.eleve_prenom} {e.eleve_nom} · {e.matiere} ·{' '}
                    {new Date(e.date_evaluation).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div className="eval-stars">{starsStr(e.note)}</div>
              </div>
              {e.commentaire && (
                <p style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', marginTop: 8 }}>
                  "{e.commentaire}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {showEvalModal && selectedSession && (
        <div className="overlay open" onClick={e => e.target === e.currentTarget && setShowEvalModal(false)}>
          <div className="modal">
            <h3>⭐ Évaluer {selectedSession.eleve_prenom}</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
              Session: {selectedSession.demande_titre}
            </p>
            
            <div className="form-row">
              <label>Note</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setEvalForm({ ...evalForm, note: n })}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 28,
                      cursor: 'pointer',
                      opacity: n <= evalForm.note ? 1 : 0.3,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row">
              <label>Commentaire (optionnel)</label>
              <textarea
                placeholder="Partage ton retour sur cette session…"
                value={evalForm.commentaire}
                onChange={e => setEvalForm({ ...evalForm, commentaire: e.target.value })}
                rows="4"
              />
            </div>

            <div className="modal-btns">
              <button className="btn-ghost" onClick={() => setShowEvalModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={submitEvaluation}>Soumettre l'évaluation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CERTIFICAT ────────────────────────────────────────────────────────────────
export function Certificat({ showToast, confetti }) {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats]       = useState({ total: 0, moyenne: null });

  useEffect(() => {
    api.get('/sessions/mes').then(res => setSessions(res.data)).catch(() => {});
    api.get('/evaluations/mes').then(res => setStats(res.data.stats || {})).catch(() => {});
  }, []);

  const pts = Math.min((sessions.length * 50), 1000);
  const pct = Math.round((pts / 1000) * 100);

  const levels = [
    { emoji: '🌱', name: 'Helper débutant', req: '100 pts · 2 sessions', threshold: 100 },
    { emoji: '⚡', name: 'Helper actif',    req: '500 pts · 8 sessions', threshold: 500 },
    { emoji: '🏅', name: 'Certifié ISEP',   req: '1000 pts · note ≥4.5', threshold: 1000 },
  ];

  const tasks = [
    { done: sessions.length > 0,  text: "S'inscrire comme tuteur",          pts: '+100 pts' },
    { done: sessions.length >= 5, text: 'Donner 5 sessions',                pts: '+250 pts' },
    { done: (stats.moyenne || 0) >= 4.5, text: 'Maintenir note ≥ 4.5',     pts: '+150 pts' },
    { done: false,                 text: 'Aider sur 3 matières différentes', pts: '+100 pts' },
  ];

  return (
    <div>
      <div className="cert-hero">
        <div>
          <h2>Certifié ISEP Helper 🏆</h2>
          <p>Démontre ton engagement envers la communauté et obtiens une reconnaissance officielle de l'ISEP sur ton CV !</p>
        </div>
      </div>

      <div className="progress-block">
        <div className="prog-head">
          <span className="prog-label">Progression vers le certificat</span>
          <span className="prog-pts">{pts} / 1000 pts</span>
        </div>
        <div className="prog-track">
          <div className="prog-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="prog-milestones">
          {[100, 250, 500, 750, 1000].map(m => (
            <div key={m} className={`milestone ${pts >= m ? 'reached' : ''}`}>{m}</div>
          ))}
        </div>
      </div>

      <div className="cert-levels">
        {levels.map(l => {
          const unlocked = pts >= l.threshold;
          const inprog   = pts > 0 && !unlocked;
          return (
            <div key={l.name} className={`cert-level ${unlocked ? 'unlocked' : 'locked'}`}>
              <span className={`cert-badge-lbl ${unlocked ? 'done' : inprog ? 'prog' : 'lock'}`}>
                {unlocked ? 'Obtenu ✓' : inprog ? 'En cours' : 'Verrouillé'}
              </span>
              <div className="cert-emoji">{l.emoji}</div>
              <div className="cert-name">{l.name}</div>
              <div className="cert-req">{l.req}</div>
            </div>
          );
        })}
      </div>

      <div className="tasks-grid">
        {tasks.map((t, i) => (
          <div key={i} className={`task-item ${t.done ? 'done' : ''}`}>
            <div className={`task-check ${t.done ? 'done-c' : 'todo-c'}`}>{t.done ? '✓' : ''}</div>
            <span className="task-text">{t.text}</span>
            <span className="task-pts">{t.pts}</span>
          </div>
        ))}
      </div>

      <div className="cert-actions">
        <h3>Ton certificat en aperçu</h3>
        <p>
          {pts < 1000
            ? `Plus que ${1000 - pts} pts — encore quelques sessions et il est à toi !`
            : '🎉 Félicitations ! Tu peux télécharger ton certificat.'}
        </p>
        <div className="cert-preview">
          <div className="cert-logo">🎓</div>
          <h4>ISEP · École d'ingénieurs du numérique</h4>
          <div className="cert-name2">{/* nom dynamique via AuthContext si besoin */}Étudiant ISEP</div>
          <div className="cert-detail">
            a contribué activement à la communauté Help'ISEP<br />
            en accompagnant ses pairs dans leur réussite académique.
          </div>
          <div className="cert-seal">★ Certifié Helper ISEP · 2024-2025 ★</div>
        </div>
        <button
          className="btn-download"
          disabled={pts < 1000}
          style={{ opacity: pts < 1000 ? 0.5 : 1 }}
          onClick={() => { if (pts >= 1000) { showToast('📥 Téléchargement en cours…'); confetti(); } else showToast('⏳ Atteins 1000 pts pour débloquer !'); }}
        >
          📥 Télécharger mon certificat
        </button>
      </div>
    </div>
  );
}