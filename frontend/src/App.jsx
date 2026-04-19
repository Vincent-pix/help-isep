import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { useAuth } from './context/AuthContext'

function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/" />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/app" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
    </Routes>
  )
}