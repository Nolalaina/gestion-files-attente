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
import BankPage      from "./pages/BankPage";
import LoginPage     from "./pages/LoginPage";
import RegisterPage  from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import "./styles/global.css";

/**
 * Route protégée par rôle
 * @param {{ children: JSX.Element, allowedRoles: string[] }} props
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  
  // L'admin a accès à tout par défaut, mais on peut être plus restrictif
  if (!allowedRoles.includes(user.role)) {
    // Si l'usager tente d'aller sur une page admin/agent, redirection vers sa zone
    if (user.role === "usager") return <Navigate to="/dashboard" replace />;
    if (user.role === "agent")  return <Navigate to="/agent" replace />;
    if (user.role === "admin")  return <Navigate to="/admin" replace />;
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
                <ProtectedRoute allowedRoles={["usager", "admin"]}><UsagerDashboard /></ProtectedRoute>
              }/>
              <Route path="/bank" element={
                <ProtectedRoute allowedRoles={["usager", "admin"]}><BankPage /></ProtectedRoute>
              }/>
              <Route path="/agent"   element={
                <ProtectedRoute allowedRoles={["agent", "admin"]}><AgentPage /></ProtectedRoute>
              }/>
              <Route path="/admin"   element={
                <ProtectedRoute allowedRoles={["admin"]}><AdminPage /></ProtectedRoute>
              }/>
              <Route path="*"        element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
