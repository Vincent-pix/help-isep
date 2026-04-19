import { useState } from 'react';
import './Lea.css';

const REPLIES = {
  'comment gagner des points ?': "Chaque session d'aide = +50 pts ⚡ Reçois des avis 5★ pour des bonus ! Tu peux aussi gagner des points en t'inscrivant tuteur (+100 pts) 🔥",
  'comment obtenir le certificat ?': "Le certificat se débloque à 1000 pts avec une note moyenne ≥ 4.5 ⭐ Tu es à 680 pts, encore 320 à aller ! À ce rythme, tu l'auras dans environ 6 sessions 🎓",
  'trouver un tuteur en maths': "Il y a 3 tuteurs dispo en maths : Alex Lefebvre (5★), Sara Amara (4.8★) et Marc Dupont (4.6★). Alex est le mieux noté ! 📐",
};
const DEFAULTS = [
  "Bonne question ! 😊 En attendant, tu peux aller voir la section concernée dans l'appli !",
  "Je ne suis pas encore sûre à 100%, mais la section Tuteurs ou Certificat devrait répondre à ça ! 💡",
  "Hmm, tu peux aussi poser la question directement à un tuteur via les messages ! 💬",
];

export default function Lea() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ me:false, t:"Salut ! Moi c'est Léa 👋 Je suis ton assistante Help'ISEP. Je peux t'aider à trouver un tuteur, comprendre comment gagner des points ou répondre à tes questions !" }]);
  const [input, setInput] = useState('');
  const [defIdx, setDefIdx] = useState(0);

  const reply = (txt) => {
    const key = txt.toLowerCase().replace(/[?!]/g,'');
    const rep = REPLIES[key] || DEFAULTS[defIdx % DEFAULTS.length];
    if (!REPLIES[key]) setDefIdx(i => i+1);
    setTimeout(() => setMsgs(m => [...m, { me:false, t:rep }]), 600);
  };

  const send = (txt) => {
    if (!txt.trim()) return;
    setMsgs(m => [...m, { me:true, t:txt }]);
    setInput('');
    reply(txt);
  };

  return (
    <div className="lea-bubble">
      <button className="lea-btn" onClick={() => setOpen(o => !o)}>🤖</button>
      {open && (
        <div className="lea-panel">
          <div className="lea-head">
            <div className="lea-av">🤖</div>
            <div>
              <div className="lea-hname">Léa</div>
              <div className="lea-hsub">Assistante Help'ISEP · toujours là 💪</div>
            </div>
            <button className="lea-close" onClick={() => setOpen(false)}>×</button>
          </div>
          <div className="lea-msgs">
            {msgs.map((m,i) => (
              <div key={i} className={`lea-msg ${m.me?'me':''}`}><p>{m.t}</p></div>
            ))}
          </div>
          <div className="lea-suggestions">
            {['⚡ Points ?','🎓 Certificat','📐 Tuteur maths'].map((s,i) => (
              <button key={i} className="lea-sug" onClick={() => send(s.replace(/^[^ ]+ /,''))}>
                {s}
              </button>
            ))}
          </div>
          <div className="lea-footer">
            <input
              className="lea-input"
              placeholder="Pose ta question…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send(input)}
            />
            <button className="lea-send" onClick={() => send(input)}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M2 8h12"/><path d="M10 4l6 4-6 4"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
