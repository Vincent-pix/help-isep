import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001/api',
});

// Intercepteur pour injecter le token JWT
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('helpIsepToken');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Auth API
export const authAPI = {
  login: (email, mot_de_passe) => API.post('/auth/login', { email, mot_de_passe }),
  register: (nom, prenom, email, mot_de_passe) => 
    API.post('/auth/register', { nom, prenom, email, mot_de_passe }),
  getMe: () => API.get('/auth/me'),
};

// Matieres API
export const matiereAPI = {
  getAll: () => API.get('/matieres'),
};

// Demandes API
export const demandeAPI = {
  getAll: () => API.get('/demandes'),
  getOne: (id) => API.get(`/demandes/${id}`),
  create: (matiere_id, titre, description, urgence = 'normale') =>
    API.post('/demandes', { matiere_id, titre, description, urgence }),
};

// Tuteurs API
export const tuteurAPI = {
  getAll: () => API.get('/tuteurs'),
  getMonProfil: () => API.get('/tuteurs/mon-profil'),
  devenir: () => API.post('/tuteurs/devenir-tuteur'),
};

// Sessions API
export const sessionAPI = {
  create: (demande_id, message = '') =>
    API.post('/sessions', { demande_id, message }),
  getMesSessions: () => API.get('/sessions/mes-sessions'),
  getOne: (id) => API.get(`/sessions/${id}`),
  accepter: (id) => API.put(`/sessions/${id}/accepter`),
  refuser: (id) => API.put(`/sessions/${id}/refuser`),
};

// Messages API
export const messageAPI = {
  get: (session_id) => API.get(`/messages/${session_id}`),
  send: (session_id, contenu) =>
    API.post(`/messages/${session_id}`, { contenu }),
};

// Evaluations API
export const evaluationAPI = {
  getMesEvals: () => API.get('/evaluations/mes-evals'),
  get: (session_id) => API.get(`/evaluations/${session_id}`),
  create: (session_id, note, commentaire = '') =>
    API.post('/evaluations', { session_id, note, commentaire }),
};

export default API;