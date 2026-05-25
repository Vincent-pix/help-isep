import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Profile.css';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchContacts();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/profile');
      setProfile(data);
      setFormData({
        nom: data.nom || '',
        prenom: data.prenom || '',
        email: data.email || '',
        bio: data.bio || '',
        telephone: data.telephone || ''
      });
    } catch (err) {
      console.error('Erreur chargement profil:', err);
    }
  };

  const fetchContacts = async () => {
    try {
      const { data } = await api.get('/messages/contacts');
      setContacts(data);
    } catch (err) {
      console.error('Erreur chargement contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const { data } = await api.put('/auth/profile', formData);
      setProfile(data);
      setEditing(false);
      setMessage('✅ Profil mis à jour!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Erreur lors de la mise à jour');
    }
  };

  if (loading) return <div className="profile-container">Chargement...</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="avatar-section">
          <div className="avatar-large">
            {profile?.prenom?.charAt(0).toUpperCase()}
          </div>
          <h1>{profile?.prenom} {profile?.nom}</h1>
          <p className="role">{profile?.role === 'tuteur' ? '👨‍🏫 Tuteur' : '👨‍🎓 Élève'}</p>
        </div>
      </div>

      {message && <div className="message-box">{message}</div>}

      <div className="profile-content">
        {/* Section Infos */}
        <section className="profile-section">
          <div className="section-header">
            <h2>📋 Informations Personnelles</h2>
            {!editing && (
              <button className="btn-edit" onClick={() => setEditing(true)}>
                ✏️ Modifier
              </button>
            )}
          </div>

          {editing ? (
            <div className="form-group">
              <input
                type="text"
                name="prenom"
                placeholder="Prénom"
                value={formData.prenom}
                onChange={handleChange}
              />
              <input
                type="text"
                name="nom"
                placeholder="Nom"
                value={formData.nom}
                onChange={handleChange}
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
              <input
                type="tel"
                name="telephone"
                placeholder="Téléphone"
                value={formData.telephone}
                onChange={handleChange}
              />
              <textarea
                name="bio"
                placeholder="Biographie"
                rows="4"
                value={formData.bio}
                onChange={handleChange}
              />
              <div className="form-buttons">
                <button className="btn-save" onClick={handleSave}>💾 Enregistrer</button>
                <button className="btn-cancel" onClick={() => setEditing(false)}>❌ Annuler</button>
              </div>
            </div>
          ) : (
            <div className="info-grid">
              <div className="info-item">
                <label>Prénom:</label>
                <p>{profile?.prenom}</p>
              </div>
              <div className="info-item">
                <label>Nom:</label>
                <p>{profile?.nom}</p>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <p>{profile?.email}</p>
              </div>
              <div className="info-item">
                <label>Téléphone:</label>
                <p>{profile?.telephone || 'Non renseigné'}</p>
              </div>
              {profile?.bio && (
                <div className="info-item full-width">
                  <label>Biographie:</label>
                  <p>{profile.bio}</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Section Statistiques */}
        {profile?.role === 'tuteur' && (
          <section className="profile-section">
            <h2>⭐ Statistiques</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Points</span>
                <span className="stat-value">{profile?.points_total || 0}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Note Moyenne</span>
                <span className="stat-value">{(profile?.note_moyenne || 0).toFixed(1)}/5 ⭐</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Sessions</span>
                <span className="stat-value">{profile?.sessions_count || 0}</span>
              </div>
            </div>
          </section>
        )}

        {/* Section Contacts */}
        <section className="profile-section">
          <h2>💬 Personnes Contactées</h2>
          {contacts.length === 0 ? (
            <p className="no-contacts">Aucun contact pour le moment</p>
          ) : (
            <div className="contacts-list">
              {contacts.map((contact) => (
                <div key={contact.utilisateur_id} className="contact-item">
                  <div className="contact-avatar">
                    {contact.prenom?.charAt(0).toUpperCase()}
                  </div>
                  <div className="contact-info">
                    <p className="contact-name">{contact.prenom} {contact.nom}</p>
                    <p className="contact-last">Dernier message: {new Date(contact.dernier_message).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <button className="btn-message">💬</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
