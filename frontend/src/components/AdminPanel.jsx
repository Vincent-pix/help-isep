import { useState, useEffect } from 'react';
import api from '../services/api';
import './AdminPanel.css';

export default function AdminPanel({ showToast }) {
  const [matieres, setMatieres] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matieres'); // 'matieres' | 'moderation'
  
  // Formulaire nouvelle matière
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [couleur, setCouleur] = useState('#F5700A');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [matieresRes, demandesRes] = await Promise.all([
        api.get('/matieres'),
        api.get('/demandes')
      ]);
      setMatieres(matieresRes.data || []);
      setDemandes(demandesRes.data || []);
    } catch (err) {
      showToast('❌ Erreur lors du chargement des données admin');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatiere = async (e) => {
    e.preventDefault();
    if (!nom.trim()) return showToast('❌ Nom de matière requis');
    try {
      await api.post('/matieres', { nom: nom.trim(), description: description.trim(), couleur });
      showToast('✅ Matière créée avec succès !');
      setNom('');
      setDescription('');
      setCouleur('#F5700A');
      // Rafraîchir
      const res = await api.get('/matieres');
      setMatieres(res.data);
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Erreur de création'}`);
    }
  };

  const handleCancelDemande = async (id) => {
    if (!window.confirm('Es-tu sûr de vouloir annuler cette demande ?')) return;
    try {
      await api.patch(`/demandes/${id}/statut`, { statut: 'annulee' });
      showToast('🗑️ Demande annulée par l\'admin');
      // Rafraîchir les demandes
      const res = await api.get('/demandes');
      setDemandes(res.data);
    } catch (err) {
      showToast('❌ Impossible d\'annuler la demande');
    }
  };

  if (loading) return <div className="loading-state">Chargement du panel admin…</div>;

  return (
    <div className="admin-panel">
      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === 'matieres' ? 'active' : ''}`}
          onClick={() => setActiveTab('matieres')}
        >
          📚 Matières ({matieres.length})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'moderation' ? 'active' : ''}`}
          onClick={() => setActiveTab('moderation')}
        >
          🛡️ Modération Demandes ({demandes.length})
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'matieres' && (
          <div className="admin-section-grid">
            {/* Formulaire de création */}
            <div className="admin-card-form">
              <h3>Créer une nouvelle matière</h3>
              <form onSubmit={handleCreateMatiere}>
                <div className="form-row">
                  <label>Nom de la matière</label>
                  <input
                    placeholder="Ex: Électronique de puissance"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <label>Description (optionnel)</label>
                  <textarea
                    placeholder="Description succincte du cours..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="3"
                  />
                </div>
                <div className="form-row">
                  <label>Couleur du Badge</label>
                  <div className="color-selector">
                    <input
                      type="color"
                      value={couleur}
                      onChange={(e) => setCouleur(e.target.value)}
                    />
                    <span>{couleur}</span>
                  </div>
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
                  ➕ Ajouter la matière
                </button>
              </form>
            </div>

            {/* Liste des matières */}
            <div className="admin-list-card">
              <h3>Matières enregistrées</h3>
              <div className="admin-items-list">
                {matieres.map((m) => (
                  <div key={m.id} className="admin-item">
                    <div className="admin-item-color" style={{ backgroundColor: m.couleur || '#1A5FA8' }} />
                    <div className="admin-item-info">
                      <div className="admin-item-title">{m.nom}</div>
                      {m.description && <div className="admin-item-sub">{m.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'moderation' && (
          <div className="admin-list-card full-width">
            <h3>Demandes d'aide actives</h3>
            {demandes.length === 0 ? (
              <p className="no-items">Aucune demande active en attente de modération.</p>
            ) : (
              <div className="admin-items-list">
                {demandes.map((d) => (
                  <div key={d.id} className="admin-item row-layout">
                    <div className="admin-item-info">
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span className="badge badge-math" style={{ backgroundColor: d.couleur + '20', color: d.couleur }}>
                          {d.matiere}
                        </span>
                        {d.urgence === 'haute' && <span className="badge badge-urgent">🔥 Urgent</span>}
                      </div>
                      <div className="admin-item-title">{d.titre}</div>
                      <div className="admin-item-sub">Postée par: {d.eleve_prenom} {d.eleve_nom}</div>
                      <div className="admin-item-desc" style={{ marginTop: 6, fontSize: 13, color: 'var(--text2)' }}>
                        {d.description}
                      </div>
                    </div>
                    <button
                      className="btn-cancel-admin"
                      onClick={() => handleCancelDemande(d.id)}
                    >
                      Annuler la demande 🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
