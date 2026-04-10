import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider }   from "./context/NotificationContext";
import Navbar        from "./components/Navbar";
import HomePage      from "./pages/HomePage";
import TicketPage    from "./pages/TicketPage";
import QueueDisplay  from "./pages/QueueDisplay";
import UsagerDashboard from "./pages/UsagerDashboard";
import AgentPage     from "./pages/AgentPage";
import AdminPage     from "./pages/AdminPage";
import LoginPage     from "./pages/LoginPage";
import RegisterPage  from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import "./styles/global.css";

/**
 * Route protégée par rôle
 * @param {{ children: JSX.Element, role?: string|string[] }} props
 */
function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(user.role) && user.role !== "admin")
      return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/"        element={<HomePage />} />
              <Route path="/ticket"  element={<TicketPage />} />
              <Route path="/display" element={<QueueDisplay />} />
              <Route path="/login"   element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/dashboard" element={
                <ProtectedRoute role="usager"><UsagerDashboard /></ProtectedRoute>
              }/>
              <Route path="/agent"   element={
                <ProtectedRoute role={["agent","admin"]}><AgentPage /></ProtectedRoute>
              }/>
              <Route path="/admin"   element={
                <ProtectedRoute role="admin"><AdminPage /></ProtectedRoute>
              }/>
              <Route path="*"        element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
