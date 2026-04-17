import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, mot_de_passe) => {
    const res = await authAPI.login(email, mot_de_passe);
    localStorage.setItem("helpIsepToken", res.data.token);
    const me = await authAPI.getMe();
    setUser(me.data);
    return me.data;
  };

  const register = async (nom, prenom, email, mot_de_passe) => {
    await authAPI.register(nom, prenom, email, mot_de_passe);
    // Après l'inscription, on peut se connecter automatiquement ou rediriger
    return true;
  };

  const logout = () => {
    localStorage.removeItem("helpIsepToken");
    setUser(null);
  };

  const checkAuth = async () => {
    try {
      const res = await authAPI.getMe();
      setUser(res.data);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};