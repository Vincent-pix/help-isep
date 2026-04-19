import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import api from '../services/api';
import './Demandes.css';

const TueursComponent = forwardRef(function Tuteurs({ showToast }, ref) {
  const [tuteurs, setTuteurs]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [matieres, setMatieres]   = useState([]);
  const [competences, setCompetences] = useState([{ matiere_id: '', niveau: 'intermédiaire' }]);

  useImperativeHandle(ref, () => ({
    openModal: () => setShowModal(true)
  }));

  useEffect(() => {
    fetchTuteurs();
    fetchMatieres();
  }, []);

  const fetchTuteurs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tuteurs');
      setTuteurs(res.data);
    } catch {
      showToast('❌ Erreur lors du chargement des tuteurs');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatieres = async () => {
    try {
      const res = await api.get('/matieres');
      setMatieres(res.data);
      if (res.data.length > 0) {
        setCompetences([{ matiere_id: res.data[0].id, niveau: 'intermédiaire' }]);
      }
    } catch {}
  };

  const handleDevenirTuteur = async () => {
    const valid = competences.filter(c => c.matiere_id);
    if (valid.length === 0) return showToast('❌ Ajoute au moins une compétence');
    try {
      await api.post('/tuteurs', { competences: valid });
      showToast('🎉 Profil tuteur créé !');
      setShowModal(false);
      fetchTuteurs();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Erreur'}`);
    }
  };

  const addCompetence = () => {
    if (matieres.length === 0) return;
    setCompetences([...competences, { matiere_id: matieres[0].id, niveau: 'intermédiaire' }]);
  };

  const updateComp = (i, field, val) => {
    const updated = [...competences];
    updated[i][field] = val;
    setCompetences(updated);
  };

  const removeComp = (i) => setCompetences(competences.filter((_, idx) => idx !== i));

  const starsFromNote = (note) => {
    if (!note) return '☆☆☆☆☆';
    const full = Math.round(note);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  };

  const initials = (nom, prenom) =>
    `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();

  const avColors = ['av-b', 'av-o', 'av-g'];

  return (
    <div>
      <div className="hero">
        <div className="hero-text">
          <h2>Trouve ton helper idéal 🌟</h2>
          <p>Tous nos tuteurs sont des étudiants ISEP évalués par la communauté.</p>
        </div>
        <div className="hero-stat">
          <div className="big">{tuteurs.length}</div>
          <div className="lbl">tuteurs disponibles</div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Chargement…</div>
      ) : (
        <div className="tutor-grid">
          {tuteurs.map((t, i) => (
            <div className="tutor-card" key={t.id} style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="tutor-head">
                <div className={`av av-md ${avColors[i % 3]}`}>{initials(t.nom, t.prenom)}</div>
                <div className="tutor-info">
                  <div className="name">{t.prenom} {t.nom}</div>
                  <div className="promo">{t.nb_sessions} sessions</div>
                </div>
              </div>
              <div className="stars">
                {starsFromNote(t.note_moyenne)}
                <span className="stars-count">
                  {t.note_moyenne ? ` (${parseFloat(t.note_moyenne).toFixed(1)}/5)` : ' Nouveau'}
                </span>
              </div>
              <div className="tags">
                {t.matieres?.split(',').map(m => (
                  <span key={m} className="tag">{m.trim()}</span>
                ))}
              </div>
              <button className="btn-contact" onClick={() => showToast(`💬 Fonctionnalité messages bientôt disponible !`)}>
                Contacter
              </button>
            </div>
          ))}

          <div className="add-card" onClick={() => setShowModal(true)}>
            <div className="add-card-icon">➕</div>
            <div className="add-card-label">Devenir tuteur</div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="overlay open" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h3>🙋 Devenir tuteur</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
              Ajoute les matières dans lesquelles tu peux aider tes camarades.
            </p>
            {competences.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                <div className="form-row" style={{ flex: 2, margin: 0 }}>
                  <select value={c.matiere_id} onChange={e => updateComp(i, 'matiere_id', e.target.value)}>
                    {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                  </select>
                </div>
                <div className="form-row" style={{ flex: 1, margin: 0 }}>
                  <select value={c.niveau} onChange={e => updateComp(i, 'niveau', e.target.value)}>
                    <option value="débutant">Débutant</option>
                    <option value="intermédiaire">Intermédiaire</option>
                    <option value="avancé">Avancé</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                {competences.length > 1 && (
                  <button onClick={() => removeComp(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 18 }}>×</button>
                )}
              </div>
            ))}
            <button onClick={addCompetence} style={{ fontSize: 13, color: 'var(--orange)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
              + Ajouter une matière
            </button>
            <div className="modal-btns">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={handleDevenirTuteur}>Créer mon profil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default TueursComponent;