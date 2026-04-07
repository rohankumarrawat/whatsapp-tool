import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, CheckCircle, RefreshCw, Plus, Trash2 } from 'lucide-react';
import api from '../utils/api';

export default function UserDashboard() {
  const [user] = useState(JSON.parse(localStorage.getItem('user')));
  const [accounts, setAccounts] = useState([]);
  const [activeQrCode, setActiveQrCode] = useState(null);
  const [activeQrAccountId, setActiveQrAccountId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    try {
      const { data } = await api.get(`/whatsapp/accounts/${user._id}`);
      setAccounts(data);
    } catch (err) {
      console.error('Error fetching accounts', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQR = async (accountId) => {
    try {
      const { data } = await api.get(`/whatsapp/qr/${accountId}`);
      if (data.linked) {
        setActiveQrCode(null);
        setActiveQrAccountId(null);
        fetchAccounts();
      } else if (data.qr) {
        setActiveQrCode(data.qr);
      } else {
        setActiveQrCode(null);
      }
    } catch (err) {
      console.error('Error fetching QR', err);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  useEffect(() => {
    if (!activeQrAccountId) return;
    fetchQR(activeQrAccountId);
    const interval = setInterval(() => fetchQR(activeQrAccountId), 3000);
    return () => clearInterval(interval);
  }, [activeQrAccountId]);

  const handleAddAccount = async () => {
    const name = prompt('Enter a label for this WhatsApp number (e.g. "Business", "Support"):');
    if (!name) return;
    try {
      const { data } = await api.post('/whatsapp/accounts', { userId: user._id, name });
      setAccounts(prev => [...prev, data]);
      setActiveQrAccountId(data._id);
    } catch {
      alert('Failed to create account');
    }
  };

  const handleLogoutAccount = async (accountId, removeRecord = false) => {
    if (!confirm(removeRecord ? 'Delete this account permanently?' : 'Logout this WhatsApp session?')) return;
    try {
      await api.post('/whatsapp/logout', { accountId, removeRecord });
      if (activeQrAccountId === accountId) { setActiveQrAccountId(null); setActiveQrCode(null); }
      fetchAccounts();
    } catch {
      alert('Failed to logout');
    }
  };

  const linkedCount = accounts.filter(a => a.isLinked).length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Manage your WhatsApp connections and sessions</p>
      </div>

      <div className="page-body space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="stat-label">Total Accounts</div>
            <div className="stat-value">{accounts.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Linked</div>
            <div className="stat-value" style={{ color: '#25d366' }}>{linkedCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending</div>
            <div className="stat-value" style={{ color: '#fbbf24' }}>{accounts.length - linkedCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Status</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`status-dot ${linkedCount > 0 ? 'green' : 'amber'}`}></span>
              <span className="text-sm font-semibold" style={{ color: linkedCount > 0 ? '#25d366' : '#fbbf24' }}>
                {linkedCount > 0 ? 'Active' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Accounts Panel */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Smartphone size={20} style={{ color: '#25d366' }} />
              <h2 className="text-base font-semibold text-white">WhatsApp Accounts</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={fetchAccounts} className="btn btn-ghost p-2" title="Refresh">
                <RefreshCw size={15} />
              </button>
              <button onClick={handleAddAccount} className="btn btn-primary">
                <Plus size={15} /> Add Account
              </button>
            </div>
          </div>

          {loading ? (
            <div className="empty-state py-12">
              <RefreshCw size={28} className="animate-spin" />
              <span className="text-sm" style={{ color: '#475569' }}>Loading accounts...</span>
            </div>
          ) : accounts.length === 0 ? (
            <div className="empty-state">
              <Smartphone size={40} />
              <p className="font-medium" style={{ color: '#475569' }}>No accounts yet</p>
              <p className="text-sm" style={{ color: '#334155' }}>Click "Add Account" to link your first WhatsApp number</p>
              <button onClick={handleAddAccount} className="btn btn-primary mt-2">
                <Plus size={15} /> Add Account
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {accounts.map(acc => (
                <div key={acc._id} className={`account-card ${acc.isLinked ? 'linked' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                        style={{ background: acc.isLinked ? 'rgba(37,211,102,0.12)' : 'rgba(255,255,255,0.05)' }}>
                        📱
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{acc.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: '#475569' }}>{acc.number || 'Not connected'}</div>
                      </div>
                    </div>
                    {acc.isLinked
                      ? <span className="badge badge-green"><CheckCircle size={10} /> Linked</span>
                      : <span className="badge badge-amber">Pending</span>
                    }
                  </div>

                  <div className="flex gap-2 mt-4">
                    {acc.isLinked ? (
                      <button onClick={() => handleLogoutAccount(acc._id, false)} className="btn btn-secondary flex-1 justify-center text-xs py-1.5">
                        Logout Session
                      </button>
                    ) : activeQrAccountId === acc._id ? (
                      <button onClick={() => setActiveQrAccountId(null)} className="btn btn-secondary flex-1 justify-center text-xs py-1.5" style={{ color: '#818cf8' }}>
                        Hide QR
                      </button>
                    ) : (
                      <button onClick={() => setActiveQrAccountId(acc._id)} className="btn btn-primary flex-1 justify-center text-xs py-1.5">
                        Show QR
                      </button>
                    )}
                    <button onClick={() => handleLogoutAccount(acc._id, true)} className="btn btn-danger p-1.5" title="Delete account">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QR Panel */}
        {activeQrAccountId && (
          <div className="card animate-fade-in">
            <h3 className="text-base font-semibold text-white mb-4">Scan to Link WhatsApp</h3>
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="space-y-4 flex-1">
                {[
                  ['1', 'Open WhatsApp on your phone', 'Tap the three dots (⋮) or Settings'],
                  ['2', 'Tap "Linked Devices"', 'Then tap "Link a Device"'],
                  ['3', 'Scan the QR code', 'Point your camera at the code on the right'],
                ].map(([num, title, sub]) => (
                  <div key={num} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(37,211,102,0.15)', color: '#25d366' }}>
                      {num}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{title}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#475569' }}>{sub}</div>
                    </div>
                  </div>
                ))}
                <button onClick={() => { setActiveQrAccountId(null); setActiveQrCode(null); }} className="btn btn-ghost text-xs mt-2">
                  Cancel
                </button>
              </div>
              <div className="qr-container" style={{ minWidth: 220, minHeight: 220 }}>
                {activeQrCode ? (
                  <QRCodeSVG value={activeQrCode} size={200} level="H" includeMargin={true} />
                ) : (
                  <div className="flex flex-col items-center gap-3 p-8" style={{ color: '#334155' }}>
                    <RefreshCw size={28} className="animate-spin" />
                    <div className="text-center">
                      <div className="text-sm font-medium text-black">Generating QR...</div>
                      <div className="text-xs mt-1 text-gray-500">Takes ~20-30 seconds</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
