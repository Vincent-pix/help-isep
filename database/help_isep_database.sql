-- =====================================================
-- Base de données : Help'ISEP
-- Application de mise en relation élèves / tuteurs
-- Bachelor ISEP B1 – Projet Dev Web
-- =====================================================

CREATE DATABASE IF NOT EXISTS help_isep
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE help_isep;

-- =====================================================
-- TABLE : utilisateurs
-- Contient tous les comptes (élèves + admins)
-- =====================================================
CREATE TABLE utilisateurs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nom             VARCHAR(100)        NOT NULL,
    prenom          VARCHAR(100)        NOT NULL,
    email           VARCHAR(150)        NOT NULL UNIQUE,
    mot_de_passe    VARCHAR(255)        NOT NULL,  -- hashé (bcrypt)
    role            ENUM('eleve', 'admin') NOT NULL DEFAULT 'eleve',
    photo_profil    VARCHAR(255)        DEFAULT NULL,
    bio             TEXT                DEFAULT NULL,
    date_inscription DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    derniere_connexion DATETIME         DEFAULT NULL,
    actif           BOOLEAN             NOT NULL DEFAULT TRUE
);

-- =====================================================
-- TABLE : matieres
-- Liste des matières disponibles (algo, réseau, etc.)
-- =====================================================
CREATE TABLE matieres (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nom             VARCHAR(100)        NOT NULL UNIQUE,
    description     TEXT                DEFAULT NULL,
    couleur         VARCHAR(7)          DEFAULT '#3498db'  -- code hex pour l'UI
);

-- =====================================================
-- TABLE : profils_tuteurs
-- Informations supplémentaires pour les élèves
-- qui proposent de l'aide (tuteurs)
-- =====================================================
CREATE TABLE profils_tuteurs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id  INT                 NOT NULL UNIQUE,
    disponible      BOOLEAN             NOT NULL DEFAULT TRUE,
    note_moyenne    DECIMAL(3,2)        DEFAULT NULL,  -- calculé automatiquement
    nb_sessions     INT                 NOT NULL DEFAULT 0,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE : competences_tuteurs
-- Matières maîtrisées par chaque tuteur + niveau
-- =====================================================
CREATE TABLE competences_tuteurs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    tuteur_id       INT                 NOT NULL,
    matiere_id      INT                 NOT NULL,
    niveau          ENUM('débutant', 'intermédiaire', 'avancé', 'expert') NOT NULL DEFAULT 'intermédiaire',
    FOREIGN KEY (tuteur_id)  REFERENCES profils_tuteurs(id) ON DELETE CASCADE,
    FOREIGN KEY (matiere_id) REFERENCES matieres(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tuteur_matiere (tuteur_id, matiere_id)
);

-- =====================================================
-- TABLE : demandes_aide
-- Demandes postées par les élèves en difficulté
-- =====================================================
CREATE TABLE demandes_aide (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    eleve_id        INT                 NOT NULL,
    matiere_id      INT                 NOT NULL,
    titre           VARCHAR(200)        NOT NULL,
    description     TEXT                NOT NULL,
    statut          ENUM('ouverte', 'en_cours', 'resolue', 'annulee') NOT NULL DEFAULT 'ouverte',
    urgence         ENUM('faible', 'normale', 'haute') NOT NULL DEFAULT 'normale',
    date_creation   DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_resolution DATETIME            DEFAULT NULL,
    FOREIGN KEY (eleve_id)   REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (matiere_id) REFERENCES matieres(id) ON DELETE RESTRICT
);

-- =====================================================
-- TABLE : sessions_aide
-- Mise en relation entre un élève et un tuteur
-- suite à une demande
-- =====================================================
CREATE TABLE sessions_aide (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    demande_id      INT                 NOT NULL,
    tuteur_id       INT                 NOT NULL,  -- utilisateur (rôle eleve avec profil tuteur)
    statut          ENUM('proposee', 'acceptee', 'en_cours', 'terminee', 'refusee') NOT NULL DEFAULT 'proposee',
    date_proposition DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_debut      DATETIME            DEFAULT NULL,
    date_fin        DATETIME            DEFAULT NULL,
    notes_tuteur    TEXT                DEFAULT NULL,
    FOREIGN KEY (demande_id) REFERENCES demandes_aide(id) ON DELETE CASCADE,
    FOREIGN KEY (tuteur_id)  REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE : messages
-- Chat entre élève et tuteur dans une session
-- =====================================================
CREATE TABLE messages (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    session_id      INT                 NOT NULL,
    expediteur_id   INT                 NOT NULL,
    contenu         TEXT                NOT NULL,
    date_envoi      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lu              BOOLEAN             NOT NULL DEFAULT FALSE,
    FOREIGN KEY (session_id)     REFERENCES sessions_aide(id) ON DELETE CASCADE,
    FOREIGN KEY (expediteur_id)  REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLE : evaluations
-- Note et commentaire laissés après une session
-- =====================================================
CREATE TABLE evaluations (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    session_id      INT                 NOT NULL UNIQUE,
    note            TINYINT UNSIGNED    NOT NULL,  -- 1 à 5
    commentaire     TEXT                DEFAULT NULL,
    date_evaluation DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions_aide(id) ON DELETE CASCADE,
    CONSTRAINT chk_note CHECK (note BETWEEN 1 AND 5)
);

-- =====================================================
-- TABLE : notifications
-- Alertes en temps réel pour les utilisateurs
-- =====================================================
CREATE TABLE notifications (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id  INT                 NOT NULL,
    type            VARCHAR(50)         NOT NULL,  -- ex: 'nouvelle_demande', 'session_acceptee'
    message         VARCHAR(255)        NOT NULL,
    lien            VARCHAR(255)        DEFAULT NULL,
    lue             BOOLEAN             NOT NULL DEFAULT FALSE,
    date_creation   DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- =====================================================
-- INDEX pour optimiser les requêtes fréquentes
-- =====================================================
CREATE INDEX idx_demandes_statut     ON demandes_aide(statut);
CREATE INDEX idx_demandes_matiere    ON demandes_aide(matiere_id);
CREATE INDEX idx_sessions_statut     ON sessions_aide(statut);
CREATE INDEX idx_messages_session    ON messages(session_id);
CREATE INDEX idx_notifs_utilisateur  ON notifications(utilisateur_id, lue);

-- =====================================================
-- DONNÉES DE BASE (jeu de test)
-- =====================================================

-- Matières
INSERT INTO matieres (nom, description, couleur) VALUES
('Algorithmique',     'Structures de données, complexité, tri',       '#e74c3c'),
('Développement Web', 'HTML, CSS, JS, React, Node.js',                '#3498db'),
('Base de données',   'SQL, modélisation, optimisation',              '#2ecc71'),
('Réseaux',           'TCP/IP, routage, protocoles',                  '#9b59b6'),
('Systèmes',          'Linux, shell, gestion des processus',          '#f39c12'),
('Mathématiques',     'Algèbre, analyse, probabilités',               '#1abc9c');

-- Compte admin
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) VALUES
('Admin', 'ISEP', 'admin@isep.fr', '$2b$10$placeholderHashAdmin', 'admin');

-- Élèves de test
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) VALUES
('Dupont',  'Alice',  'alice.dupont@isep.fr',  '$2b$10$placeholderHashAlice',  'eleve'),
('Martin',  'Bob',    'bob.martin@isep.fr',    '$2b$10$placeholderHashBob',    'eleve'),
('Leroy',   'Claire', 'claire.leroy@isep.fr',  '$2b$10$placeholderHashClaire', 'eleve');

-- Profil tuteur pour Bob (élève expérimenté)
INSERT INTO profils_tuteurs (utilisateur_id, disponible) VALUES (3, TRUE);

-- Compétences du tuteur Bob
INSERT INTO competences_tuteurs (tuteur_id, matiere_id, niveau) VALUES
(1, 1, 'avancé'),   -- Algorithmique
(1, 2, 'expert'),   -- Dev Web
(1, 3, 'intermédiaire'); -- BDD

-- Demande d'aide d'Alice
INSERT INTO demandes_aide (eleve_id, matiere_id, titre, description, urgence) VALUES
(2, 1, 'Aide pour les arbres binaires',
 'Je ne comprends pas comment implémenter un parcours en profondeur.',
 'normale');

-- =====================================================
-- VUES UTILES pour le back-end
-- =====================================================

-- Vue : liste des tuteurs disponibles avec leurs compétences
CREATE VIEW vue_tuteurs_disponibles AS
SELECT
    u.id,
    u.nom,
    u.prenom,
    u.email,
    u.photo_profil,
    pt.note_moyenne,
    pt.nb_sessions,
    GROUP_CONCAT(m.nom ORDER BY m.nom SEPARATOR ', ') AS matieres
FROM utilisateurs u
JOIN profils_tuteurs pt ON pt.utilisateur_id = u.id
JOIN competences_tuteurs ct ON ct.tuteur_id = pt.id
JOIN matieres m ON m.id = ct.matiere_id
WHERE u.actif = TRUE AND pt.disponible = TRUE
GROUP BY u.id, u.nom, u.prenom, u.email, u.photo_profil, pt.note_moyenne, pt.nb_sessions;

-- Vue : demandes ouvertes avec infos complètes
CREATE VIEW vue_demandes_ouvertes AS
SELECT
    d.id,
    d.titre,
    d.description,
    d.urgence,
    d.date_creation,
    d.statut,
    m.id AS matiere_id,
    m.nom AS matiere,
    u.nom AS eleve_nom,
    u.prenom AS eleve_prenom
FROM demandes_aide d
JOIN matieres m      ON m.id = d.matiere_id
JOIN utilisateurs u  ON u.id = d.eleve_id
WHERE d.statut = 'ouverte'
ORDER BY
    FIELD(d.urgence, 'haute', 'normale', 'faible'),
    d.date_creation ASC;
