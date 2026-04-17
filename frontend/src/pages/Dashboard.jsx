import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import DemandesScreen from '../components/screens/DemandesScreen';
import TuteursScreen from '../components/screens/TuteursScreen';
import MessagesScreen from '../components/screens/MessagesScreen';
import EvaluationsScreen from '../components/screens/EvaluationsScreen';
import ProfilScreen from '../components/screens/ProfilScreen';
import '../styles/dashboard.css';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeScreen, setActiveScreen] = useState('demandes');

  if (!user) return <div>Chargement...</div>;

  const renderScreen = () => {
    switch (activeScreen) {
      case 'demandes':
        return <DemandesScreen />;
      case 'tuteurs':
        return <TuteursScreen />;
      case 'messages':
        return <MessagesScreen />;
      case 'evaluations':
        return <EvaluationsScreen />;
      case 'profil':
        return <ProfilScreen />;
      default:
        return <DemandesScreen />;
    }
  };

  return (
    <div className="app">
      <Sidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} logout={logout} />
      <div className="main">
        <Topbar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
        <div className="content">
          {renderScreen()}
        </div>
      </div>
    </div>
  );
}
