import { useEffect, useState } from "react";
import API from "../services/api";
import DemandeCard from "../components/DemandeCard";

export default function Demandes() {
  const [demandes, setDemandes] = useState([]);

  useEffect(() => {
    API.get("/demandes")
      .then(res => setDemandes(res.data.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>Demandes</h1>
      {demandes.map(d => (
        <DemandeCard key={d.id} demande={d} />
      ))}
    </div>
  );
}