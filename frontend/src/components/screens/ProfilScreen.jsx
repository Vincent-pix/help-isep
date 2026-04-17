import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ProfilScreen() {
  const { user } = useAuth();

  if (!user) return <div>Chargement...</div>;

  const initials = (user.prenom[0] + user.nom[0]).toUpperCase();

  return (
    <div className="screen active">
      <div className="profile-header">
        <div className="profile-av">{initials}</div>
        <div>
          <div className="profile-name">{user.prenom} {user.nom}</div>
          <div className="profile-email">{user.email}</div>
          <div className="profile-role">{user.role}</div>
        </div>
      </div>

      <div className="section-title">À propos</div>
      <div style={{
        background: 'var(--white)',
        border: '1.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <p style={{ color: 'var(--text2)', lineHeight: '1.6' }}>
          {user.bio || 'Aucune bio renseignée.'}
        </p>
      </div>

      <div className="section-title">Informations personnelles</div>
      <div style={{
        background: 'var(--white)',
        border: '1.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        marginBottom: '20px'
      }}>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: '600' }}>
            Prénom
          </div>
          <div style={{ fontSize: '14px', marginTop: '4px' }}>{user.prenom}</div>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: '600' }}>
            Nom
          </div>
          <div style={{ fontSize: '14px', marginTop: '4px' }}>{user.nom}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: '600' }}>
            Email
          </div>
          <div style={{ fontSize: '14px', marginTop: '4px' }}>{user.email}</div>
        </div>
      </div>
    </div>
  );
}
