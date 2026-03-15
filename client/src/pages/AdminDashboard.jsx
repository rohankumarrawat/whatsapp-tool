import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Settings, LogOut } from 'lucide-react';
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
      setMsg(`User ${data.name} created successfully!`);
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error creating user');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="p-8 w-full max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Admin Control Panel</h2>
          <p className="text-slate-500">Manage marketers and settings</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-8">
          <div className="flex items-center gap-3 mb-6">
            <UserPlus className="text-indigo-500" size={24} />
            <h3 className="text-xl font-semibold text-slate-800">Create Sub-User</h3>
          </div>
          
          {msg && <div className="mb-4 p-3 bg-indigo-50 text-indigo-700 rounded-lg text-sm">{msg}</div>}

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text" required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={name} onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email" required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password" required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors mt-2"
            >
              Provision Account
            </button>
          </form>
        </div>

        <div className="glass-panel p-8 opacity-50 relative pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[2px] rounded-2xl z-10">
            <span className="font-semibold text-slate-600 bg-white px-4 py-2 rounded-full shadow-sm">Coming Soon</span>
          </div>
          <div className="flex items-center gap-3 mb-6">
            <Settings className="text-slate-500" size={24} />
            <h3 className="text-xl font-semibold text-slate-800">System Logs</h3>
          </div>
          <p className="text-slate-500 text-sm">Global campaign monitoring and analytics will appear here in the next update.</p>
        </div>
      </div>
    </div>
  );
}
