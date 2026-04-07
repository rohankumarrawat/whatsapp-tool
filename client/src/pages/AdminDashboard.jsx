import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Settings, LogOut, Shield } from 'lucide-react';
import api from '../utils/api';

export default function AdminDashboard() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/register', { name, email, password, role: 'user' });
      setMsg({ type: 'success', text: `✅ User "${data.name}" created successfully!` });
      setName(''); setEmail(''); setPassword('');
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error creating user' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="login-bg p-6" style={{ alignItems: 'flex-start', paddingTop: '4rem' }}>
      <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Control Panel</h1>
              <p className="text-xs" style={{ color: '#475569' }}>Manage users and system settings</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary">
            <LogOut size={15} /> Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create User */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
              <UserPlus size={16} style={{ color: '#25d366' }} /> Create Sub-User
            </h3>

            {msg && (
              <div className="mb-4 p-3 rounded-xl text-sm"
                style={{
                  background: msg.type === 'success' ? 'rgba(37,211,102,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${msg.type === 'success' ? 'rgba(37,211,102,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  color: msg.type === 'success' ? '#25d366' : '#f87171'
                }}>
                {msg.text}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="form-label">Full Name</label>
                <input type="text" required className="form-input" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Email Address</label>
                <input type="email" required className="form-input" placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Password</label>
                <input type="password" required className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary w-full justify-center py-2.5 mt-1">
                <UserPlus size={15} /> Provision Account
              </button>
            </form>
          </div>

          {/* Coming Soon */}
          <div className="card relative overflow-hidden" style={{ opacity: 0.5, pointerEvents: 'none' }}>
            <div className="absolute inset-0 flex items-center justify-center z-10 rounded-2xl"
              style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}>
              <span className="px-4 py-2 rounded-full text-sm font-semibold text-white"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                Coming Soon
              </span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
              <Settings size={16} style={{ color: '#64748b' }} /> System Logs
            </h3>
            <p className="text-sm" style={{ color: '#475569' }}>Global campaign monitoring and analytics will appear here in the next update.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
