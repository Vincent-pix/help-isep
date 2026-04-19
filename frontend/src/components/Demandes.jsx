import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import api from '../services/api';
import './Demandes.css';

const BADGE_COLORS = {
  'Algorithmique':     'badge-algo',
  'Développement Web': 'badge-math',
  'Base de données':   'badge-signal',
  'Réseaux':           'badge-phys',
  'Systèmes':          'badge-algo',
  'Mathématiques':     'badge-math',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

const DemandesComponent = forwardRef(function Demandes({ showToast, confetti }, ref) {
  const [demandes, setDemandes]   = useState([]);
  const [matieres, setMatieres]   = useState([]);
  const [filter, setFilter]       = useState('all');
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ matiere_id: '', titre: '', description: '', urgence: 'normale' });

  useImperativeHandle(ref, () => ({
    openModal: () => setShowModal(true)
  }));

  const fetchDemandes = async (matiereId) => {
    setLoading(true);
    try {
      const params = matiereId && matiereId !== 'all' ? { matiere_id: matiereId } : {};
      const res = await api.get('/demandes', { params });
      setDemandes(res.data);
    } catch {
      showToast('❌ Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatieres = async () => {
    try {
      const res = await api.get('/matieres');
      setMatieres(res.data);
      if (res.data.length > 0) setForm(f => ({ ...f, matiere_id: res.data[0].id }));
    } catch {}
  };

  useEffect(() => { fetchDemandes(); fetchMatieres(); }, []);

  const handleFilter = (key) => {
    setFilter(key);
    fetchDemandes(key === 'all' ? null : key);
  };

  const handleProposer = async (d) => {
    try {
      await api.post('/sessions', { demande_id: d.id });
      showToast(`🎉 Aide proposée à ${d.eleve_prenom} ! +50 pts à venir`);
      confetti();
      fetchDemandes(filter === 'all' ? null : filter);
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Erreur'}`);
    }
  };

  const handleSubmit = async () => {
    if (!form.titre || !form.description || !form.matiere_id) {
      return showToast('❌ Remplis tous les champs');
    }
    try {
      await api.post('/demandes', form);
      showToast('✅ Demande publiée !');
      setShowModal(false);
      setForm({ matiere_id: matieres[0]?.id || '', titre: '', description: '', urgence: 'normale' });
      fetchDemandes();
    } catch {
      showToast('❌ Erreur lors de la création');
    }
  };

  return (
    <div>
      <div className="hero">
        <div className="hero-text">
          <h2>Quelqu'un a besoin de toi ! 🙌</h2>
          <p>Chaque aide que tu donnes, c'est +50 pts vers ton certificat. La communauté ISEP grandit grâce à toi.</p>
        </div>
        <div className="hero-stat">
          <div className="big">{demandes.length}</div>
          <div className="lbl">demandes actives</div>
        </div>
      </div>

      <div className="filters">
        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => handleFilter('all')}>Toutes</button>
        {matieres.map(m => (
          <button
            key={m.id}
            className={`filter-btn ${filter === String(m.id) ? 'active' : ''}`}
            onClick={() => handleFilter(String(m.id))}
          >
            {m.nom}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">Chargement…</div>
      ) : demandes.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 40 }}>🎉</div>
          <p>Aucune demande en attente pour le moment !</p>
        </div>
      ) : (
        <div className="cards-list">
          {demandes.map((d, i) => (
            <div className="card" key={d.id} style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="card-head">
                <span className={`badge ${BADGE_COLORS[d.matiere] || 'badge-math'}`}>{d.matiere}</span>
                {d.urgence === 'haute' && <span className="badge badge-urgent">🔥 Urgent</span>}
                <span className="card-time">{timeAgo(d.date_creation)}</span>
              </div>
              <div className="card-title">{d.titre}</div>
              <div className="card-desc">{d.description}</div>
              <div className="card-foot">
                <div className="card-author">
                  <div className="av av-sm av-o">{d.eleve_prenom?.[0]}{d.eleve_nom?.[0]}</div>
                  {d.eleve_prenom} {d.eleve_nom}
                </div>
                <button className="btn-help" onClick={() => handleProposer(d)}>
                  Proposer mon aide ✨
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="overlay open" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h3>✏️ Nouvelle demande d'aide</h3>
            <div className="form-row">
              <label>Matière</label>
              <select value={form.matiere_id} onChange={e => setForm({ ...form, matiere_id: e.target.value })}>
                {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Titre</label>
              <input placeholder="Ex: Aide sur les séries de Fourier" value={form.titre}
                onChange={e => setForm({ ...form, titre: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Description</label>
              <textarea placeholder="Décris ton problème en détail…" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Urgence</label>
              <select value={form.urgence} onChange={e => setForm({ ...form, urgence: e.target.value })}>
                <option value="faible">Faible</option>
                <option value="normale">Normale</option>
                <option value="haute">🔥 Haute</option>
              </select>
            </div>
            <div className="modal-btns">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={handleSubmit}>Publier</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default DemandesComponent;