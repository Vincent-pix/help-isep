import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Demandes.css';

function getStatusLabel(statut) {
  if (statut === 'ouverte') return 'Ouverte';
  if (statut === 'en_cours') return 'En cours';
  if (statut === 'resolue') return 'Résolue';
  if (statut === 'annulee') return 'Annulée';
  return statut;
}

function getSessionStatusLabel(statut) {
  if (statut === 'proposee') return 'Proposée';
  if (statut === 'acceptee') return 'Acceptée';
  if (statut === 'en_cours') return 'En cours';
  if (statut === 'terminee') return 'Terminée';
  if (statut === 'refusee') return 'Refusée';
  return statut;
}

function Timeline({ steps }) {
  return (
    <div className="request-timeline" role="list">
      {steps.map((step, idx) => (
        <div key={step.id} className={`tl-item ${step.done ? 'done' : ''} ${step.active ? 'active' : ''}`} role="listitem">
          <div className="tl-dot">{step.done ? '✓' : idx + 1}</div>
          <div className="tl-meta">
            <div className="tl-title">{step.label}</div>
            {step.hint && <div className="tl-hint">{step.hint}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MesDemandes({ showToast }) {
  const { user } = useAuth();
  const [demandes, setDemandes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [evalForm, setEvalForm] = useState({ note: 5, commentaire: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [demandesRes, sessionsRes] = await Promise.all([
        api.get('/demandes/mes'),
        api.get('/sessions/mes'),
      ]);
      setDemandes(demandesRes.data || []);
      setSessions(sessionsRes.data || []);
    } catch {
      showToast('❌ Erreur lors du chargement de tes demandes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const validateHelp = async (sessionId) => {
    try {
      await api.patch(`/sessions/${sessionId}/valider`);
      showToast('✅ Aide validée, les points ont été attribués');
      loadData();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Impossible de valider'}`);
    }
  };

  const confirmHelpDoneAsTutor = async (sessionId) => {
    try {
      await api.patch(`/sessions/${sessionId}/terminer`);
      showToast('✅ Aide marquée comme réalisée. En attente de validation élève.');
      loadData();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Impossible de confirmer l\'aide'}`);
    }
  };

  const acceptHelpProposal = async (sessionId) => {
    try {
      await api.patch(`/sessions/${sessionId}/accepter`);
      showToast('✅ Proposition acceptée');
      loadData();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Impossible d\'accepter'}`);
    }
  };

  const rejectHelpProposal = async (sessionId) => {
    try {
      await api.patch(`/sessions/${sessionId}/refuser`);
      showToast('✅ Proposition refusée');
      loadData();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Impossible de refuser'}`);
    }
  };

  const submitEvaluation = async () => {
    if (!selectedSession) return;
    try {
      await api.post('/evaluations', {
        session_id: selectedSession.id,
        note: evalForm.note,
        commentaire: evalForm.commentaire,
      });
      showToast('⭐ Tuteur noté avec succès');
      setShowEvalModal(false);
      setSelectedSession(null);
      setEvalForm({ note: 5, commentaire: '' });
      loadData();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Impossible d\'envoyer la note'}`);
    }
  };

  const sessionsByDemande = sessions.reduce((acc, session) => {
    if (!acc[session.demande_id]) acc[session.demande_id] = [];
    acc[session.demande_id].push(session);
    return acc;
  }, {});

  const tutorSessions = useMemo(
    () => sessions.filter((s) => s.tuteur_id === user?.id),
    [sessions, user?.id]
  );

  if (loading) return <div className="loading-state">Chargement…</div>;

  return (
    <div>
      <div className="hero">
        <div className="hero-text">
          <h2>Suivi de tes demandes 📌</h2>
          <p>Retrouve l'historique de tes demandes et valide l'aide reçue pour attribuer les points.</p>
        </div>
        <div className="hero-stat">
          <div className="big">{demandes.length}</div>
          <div className="lbl">demandes publiées</div>
        </div>
      </div>

      {demandes.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 36 }}>📝</div>
          <p>Tu n'as pas encore publié de demande.</p>
        </div>
      ) : (
        <div className="cards-list">
          {demandes.map((demande) => {
            const demandeSessions = sessionsByDemande[demande.id] || [];
            const latestSession = demandeSessions[0];
            const canValidate = latestSession?.statut === 'terminee' && !latestSession?.aide_validee_par_eleve;
            const canAcceptOrReject = latestSession?.statut === 'proposee' && latestSession?.eleve_id === user?.id;
            const canRateTutor =
              latestSession?.statut === 'terminee' &&
              !latestSession?.note_evaluation &&
              latestSession?.eleve_id === user?.id;
            const eleveSteps = [
              {
                id: 'posted',
                label: 'Demande postée',
                hint: 'Ta demande est publiée',
                done: true,
                active: !latestSession,
              },
              {
                id: 'taken',
                label: 'Prise en charge',
                hint: latestSession ? `Par ${latestSession.tuteur_prenom} ${latestSession.tuteur_nom}` : 'En attente d’un tuteur',
                done: Boolean(latestSession),
                active: latestSession?.statut === 'proposee',
              },
              {
                id: 'done',
                label: 'Aide réalisée',
                hint: latestSession?.statut === 'terminee' ? 'Session terminée' : 'Le tuteur doit confirmer la fin',
                done: latestSession?.statut === 'terminee',
                active: ['acceptee', 'en_cours'].includes(latestSession?.statut),
              },
              {
                id: 'validated',
                label: 'Aide validée',
                hint: latestSession?.aide_validee_par_eleve ? 'Points attribués au tuteur' : 'Valide pour attribuer les points',
                done: Boolean(latestSession?.aide_validee_par_eleve),
                active: canValidate,
              },
              {
                id: 'rated',
                label: 'Tuteur noté',
                hint: latestSession?.note_evaluation ? `${latestSession.note_evaluation}/5` : 'Ajoute une note après la session',
                done: Boolean(latestSession?.note_evaluation),
                active: canRateTutor,
              },
            ];

            return (
              <div key={demande.id} className="card">
                <div className="card-head">
                  <span className="badge badge-math">{demande.matiere}</span>
                  <span className="card-time">{getStatusLabel(demande.statut)}</span>
                </div>
                <div className="card-title">{demande.titre}</div>
                <div className="card-desc">{demande.description}</div>

                {latestSession ? (
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text2)' }}>
                    Tuteur: {latestSession.tuteur_prenom} {latestSession.tuteur_nom} · Session {getSessionStatusLabel(latestSession.statut)}
                    {latestSession.aide_validee_par_eleve && ' · Aide validée ✅'}
                  </div>
                ) : (
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text3)' }}>
                    Aucune session associée pour l'instant.
                  </div>
                )}
                <Timeline steps={eleveSteps} />

                {canAcceptOrReject && (
                  <div className="card-foot" style={{ marginTop: 10, gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn-ghost" onClick={() => rejectHelpProposal(latestSession.id)}>
                      Refuser
                    </button>
                    <button className="btn-help" onClick={() => acceptHelpProposal(latestSession.id)}>
                      Accepter l'aide
                    </button>
                  </div>
                )}
                {canValidate && (
                  <div className="card-foot" style={{ marginTop: 10 }}>
                    <button className="btn-help" onClick={() => validateHelp(latestSession.id)}>
                      Valider l'aide (points selon ta note)
                    </button>
                  </div>
                )}
                {canRateTutor && (
                  <div className="card-foot" style={{ marginTop: 10 }}>
                    <button
                      className="btn-help"
                      onClick={() => {
                        setSelectedSession(latestSession);
                        setShowEvalModal(true);
                      }}
                    >
                      Noter le tuteur ⭐
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="section-title" style={{ marginTop: 30 }}>Mes aides en tant que tuteur</div>
      {tutorSessions.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 36 }}>🤝</div>
          <p>Tu n'as pas encore pris de demande en charge.</p>
        </div>
      ) : (
        <div className="cards-list">
          {tutorSessions.map((session) => {
            const canConfirm = ['acceptee', 'en_cours'].includes(session.statut);
            const tutorSteps = [
              {
                id: 'proposal',
                label: 'Aide proposée',
                hint: 'Tu as répondu à la demande',
                done: true,
                active: session.statut === 'proposee',
              },
              {
                id: 'accepted',
                label: 'Demande acceptée',
                hint: ['acceptee', 'en_cours', 'terminee'].includes(session.statut) ? 'Tu peux aider l’élève' : 'En attente de réponse élève',
                done: ['acceptee', 'en_cours', 'terminee'].includes(session.statut),
                active: session.statut === 'acceptee',
              },
              {
                id: 'done',
                label: 'Aide réalisée',
                hint: session.statut === 'terminee' ? 'Session terminée' : 'Confirme quand l’aide est finie',
                done: session.statut === 'terminee',
                active: session.statut === 'en_cours',
              },
              {
                id: 'studentValidation',
                label: 'Validation élève',
                hint: session.aide_validee_par_eleve ? 'Validée (points selon ta note)' : 'En attente de validation',
                done: Boolean(session.aide_validee_par_eleve),
                active: session.statut === 'terminee' && !session.aide_validee_par_eleve,
              },
              {
                id: 'rating',
                label: 'Note reçue',
                hint: session.note_evaluation ? `${session.note_evaluation}/5` : 'Pas encore noté',
                done: Boolean(session.note_evaluation),
                active: session.aide_validee_par_eleve && !session.note_evaluation,
              },
            ];
            return (
              <div key={session.id} className="card">
                <div className="card-head">
                  <span className="badge badge-algo">{session.matiere}</span>
                  <span className="card-time">{getSessionStatusLabel(session.statut)}</span>
                </div>
                <div className="card-title">{session.demande_titre}</div>
                <div className="card-desc">{session.demande_desc}</div>
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text2)' }}>
                  Élève: {session.eleve_prenom} {session.eleve_nom}
                  {session.aide_validee_par_eleve && ' · Validée par l\'élève ✅ (points selon ta note)'}
                </div>
                <Timeline steps={tutorSteps} />
                {canConfirm && (
                  <div className="card-foot" style={{ marginTop: 10 }}>
                    <button className="btn-help" onClick={() => confirmHelpDoneAsTutor(session.id)}>
                      Valider que l'aide a eu lieu
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showEvalModal && selectedSession && (
        <div className="overlay open" onClick={(e) => e.target === e.currentTarget && setShowEvalModal(false)}>
          <div className="modal">
            <h3>⭐ Noter le tuteur {selectedSession.tuteur_prenom}</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
              Session: {selectedSession.demande_titre}
            </p>
            <div className="form-row">
              <label>Note</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setEvalForm({ ...evalForm, note: n })}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 28,
                      cursor: 'pointer',
                      opacity: n <= evalForm.note ? 1 : 0.3,
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
                rows="4"
                placeholder="Décris ton retour sur l'aide reçue…"
                value={evalForm.commentaire}
                onChange={(e) => setEvalForm({ ...evalForm, commentaire: e.target.value })}
              />
            </div>
            <div className="modal-btns">
              <button className="btn-ghost" onClick={() => setShowEvalModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={submitEvaluation}>Envoyer la note</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
