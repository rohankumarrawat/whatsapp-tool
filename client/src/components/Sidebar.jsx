import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Users, BarChart3, Bot, LogOut, Smartphone, Home } from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: MessageSquare, label: 'Campaigns', path: '/campaigns' },
    { icon: Users, label: 'Contacts', path: '/contacts' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Bot, label: 'Chatbot', path: '/autoreply' },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">💬</div>
        <div>
          <div className="sidebar-logo-text">WA Marketing</div>
          <div className="sidebar-logo-sub">Pro Dashboard</div>
        </div>
      </div>

      {/* Nav */}
      <div className="sidebar-section-label">Navigation</div>
      {navItems.map(({ icon: Icon, label, path }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          className={`nav-item w-full text-left ${location.pathname === path ? 'active' : ''}`}
        >
          <Icon size={17} />
          {label}
        </button>
      ))}

      {/* Bottom section */}
      <div className="mt-auto space-y-1 pt-4 border-t border-white/5">
        <div className="px-3 py-2 rounded-xl bg-white/3">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-300 truncate">{user.name || 'User'}</div>
              <div className="text-[10px] text-slate-500 truncate">{user.email || ''}</div>
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="nav-item danger w-full text-left mt-1">
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
