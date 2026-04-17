export default function DemandeCard({ demande }) {
  return (
    <div>
      <h3>{demande.titre}</h3>
      <p>{demande.description}</p>
      <span>{demande.urgence}</span>
    </div>
  );
}