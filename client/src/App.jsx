import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import CampaignManager from './pages/CampaignManager';
import ContactsManager from './pages/ContactsManager';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import AutoReplyManager from './pages/AutoReplyManager';
import Sidebar from './components/Sidebar';

const ProtectedRoute = ({ children, role }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || !user.token) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;
  return children;
};

function AppLayout({ children }) {
  const location = useLocation();
  const isAuth = ['/login'].includes(location.pathname);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const showSidebar = !isAuth && user.token && user.role !== 'admin';

  return (
    <div className="app-shell">
      {showSidebar && <Sidebar />}
      <div className={showSidebar ? 'main-content' : 'flex-1'}>
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute role="user"><UserDashboard /></ProtectedRoute>} />
          <Route path="/campaigns" element={<ProtectedRoute role="user"><CampaignManager /></ProtectedRoute>} />
          <Route path="/contacts" element={<ProtectedRoute role="user"><ContactsManager /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute role="user"><AnalyticsDashboard /></ProtectedRoute>} />
          <Route path="/autoreply" element={<ProtectedRoute role="user"><AutoReplyManager /></ProtectedRoute>} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
