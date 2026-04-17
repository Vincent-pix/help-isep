import React, { useState, useEffect } from 'react';
import { demandeAPI, matiereAPI, sessionAPI } from '../../services/api';

export default function DemandesScreen() {
  const [demandes, setDemandes] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [creating, setCreating] = useState(false);
  const [newDemande, setNewDemande] = useState({
    matiere_id: '',
    titre: '',
    description: '',
    urgence: 'normale',
  });
  const [actionMessage, setActionMessage] = useState('');
  const [proposingId, setProposingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [demandesRes, matieresRes] = await Promise.all([
        demandeAPI.getAll(),
        matiereAPI.getAll(),
      ]);
      setDemandes(demandesRes.data);
      setMatieres(matieresRes.data);
    } catch (err) {
      console.error('Erreur:', err);
      setActionMessage('Impossible de charger les demandes.');
    } finally {
      setLoading(false);
    }
  };

  const getMatiereNom = (id) => {
    const m = matieres.find((m) => m.id == id);
    return m ? m.nom : 'Matière';
  };

  const filterDemandes = () => {
    if (filter === 'all') return demandes;
    if (filter === 'haute') return demandes.filter((d) => d.urgence === 'haute');
    return demandes.filter((d) => d.statut === filter);
  };

  const filtered = filterDemandes();

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setNewDemande((prev) => ({ ...prev, [name]: value }));
  };

  const createDemande = async (e) => {
    e.preventDefault();
    const { matiere_id, titre, description, urgence } = newDemande;
    if (!matiere_id || !titre.trim() || !description.trim()) {
      setActionMessage('Veuillez renseigner tous les champs.');
      return;
    }

    try {
      setLoading(true);
      await demandeAPI.create(matiere_id, titre.trim(), description.trim(), urgence);
      setActionMessage('Demande créée avec succès.');
      setNewDemande({ matiere_id: '', titre: '', description: '', urgence: 'normale' });
      setCreating(false);
      await loadData();
    } catch (err) {
      console.error('Erreur création demande:', err);
      setActionMessage('Impossible de créer la demande.');
    } finally {
      setLoading(false);
    }
  };

  const proposerAide = async (demande) => {
    try {
      setProposingId(demande.id);
      await sessionAPI.create(demande.id);
      setActionMessage('Votre aide a été proposée.');
      await loadData();
    } catch (err) {
      console.error('Erreur proposition aide:', err);
      setActionMessage('Impossible de proposer votre aide pour le moment.');
    } finally {
      setProposingId(null);
    }
  };

  return (
    <div className="screen active">
      <div className="hero">
        <div className="hero-text">
          <h2>Bienvenue sur Help'ISEP 🚀</h2>
          <p>Trouve des tuteurs, propose ton aide, ou crée une demande pour avancer ensemble</p>
        </div>
        <div className="hero-stat">
          <div className="big" id="demandes-count">
            {demandes.filter((d) => d.statut === 'ouverte').length}
          </div>
          <div className="lbl">Demandes ouvertes</div>
        </div>
      </div>

      <div className="action-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button className="btn-primary" onClick={() => setCreating((prev) => !prev)}>
          ✏️ Nouvelle demande
        </button>
        {actionMessage && (
          <div style={{ color: '#2e7d32', fontSize: '13px' }}>{actionMessage}</div>
        )}
      </div>

      {creating && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-head">
            <div className="card-title">Créer une nouvelle demande</div>
          </div>
          <form onSubmit={createDemande} style={{ display: 'grid', gap: '12px' }}>
            <select name="matiere_id" value={newDemande.matiere_id} onChange={handleCreateChange}>
              <option value="">Sélectionner une matière</option>
              {matieres.map((matiere) => (
                <option key={matiere.id} value={matiere.id}>
                  {matiere.nom}
                </option>
              ))}
            </select>
            <input
              name="titre"
              value={newDemande.titre}
              onChange={handleCreateChange}
              placeholder="Titre de la demande"
            />
            <textarea
              name="description"
              value={newDemande.description}
              onChange={handleCreateChange}
              placeholder="Description de la demande"
              rows="4"
            />
            <select name="urgence" value={newDemande.urgence} onChange={handleCreateChange}>
              <option value="normale">Normale</option>
              <option value="haute">Haute</option>
              <option value="faible">Faible</option>
            </select>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setCreating(false)}>
                Annuler
              </button>
              <button type="submit" className="btn-primary">
                Créer la demande
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Toutes
        </button>
        <button
          className={`filter-btn ${filter === 'haute' ? 'active' : ''}`}
          onClick={() => setFilter('haute')}
        >
          🔥 Urgent
        </button>
        <button
          className={`filter-btn ${filter === 'ouverte' ? 'active' : ''}`}
          onClick={() => setFilter('ouverte')}
        >
          Ouvertes
        </button>
        <button
          className={`filter-btn ${filter === 'en_cours' ? 'active' : ''}`}
          onClick={() => setFilter('en_cours')}
        >
          En cours
        </button>
      </div>

      <div className="cards-list">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🎉</div>
            <div className="empty-text">Aucune demande pour le moment !</div>
          </div>
        ) : (
          filtered.map((d) => (
            <div key={d.id} className="card">
              <div className="card-head">
                <span className={`badge badge-${d.statut}`}>
                  {d.statut.replace('_', ' ')}
                </span>
                <span className={`badge badge-${d.urgence}`} style={{ marginLeft: '4px' }}>
                  {d.urgence === 'haute' ? '🔥 Urgent' : d.urgence === 'normale' ? '🟡 Modéré' : '🟢 Faible'}
                </span>
                <span
                  style={{
                    background: 'var(--bg2)',
                    color: 'var(--text2)',
                    fontSize: '11.5px',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontWeight: '600',
                  }}
                >
                  {getMatiereNom(d.matiere_id)}
                </span>
                <span className="card-time">
                  {new Date(d.date_creation).toLocaleDateString()}
                </span>
              </div>
              <div className="card-title">{d.titre}</div>
              <div className="card-desc">{d.description}</div>
              <div className="card-foot">
                <div className="card-author">
                  <div className="av av-sm av-o">
                    {(d.eleve_prenom?.[0] || '?') + (d.eleve_nom?.[0] || '?')}
                  </div>
                  {d.eleve_prenom} {d.eleve_nom}
                </div>
                {d.statut === 'ouverte' && (
                  <button
                    className="btn-help"
                    disabled={proposingId === d.id}
                    onClick={() => proposerAide(d)}
                  >
                    {proposingId === d.id ? 'En cours...' : '🙋 Proposer mon aide'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
