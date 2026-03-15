import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { LogOut, Smartphone, CheckCircle, RefreshCw, MessageSquare } from 'lucide-react';
import api from '../utils/api';

export default function UserDashboard() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [qrCode, setQrCode] = useState(null);
  const [linked, setLinked] = useState(user?.whatsappLinked || false);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchQR = async () => {
    try {
      const { data } = await api.get(`/whatsapp/qr/${user._id}`);
      if (data.linked) {
        setLinked(true);
        setDetails(data.details);
        // Update local storage
        const updatedUser = { ...user, whatsappLinked: true };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else if (data.qr) {
        setQrCode(data.qr);
        setLinked(false);
      }
    } catch (err) {
      console.error('Error fetching QR', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQR();
    const interval = setInterval(() => {
      if (!linked) fetchQR();
    }, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, [linked]);

  const handleLogoutWhatsApp = async () => {
    try {
      await api.post('/whatsapp/logout', { userId: user._id });
      setLinked(false);
      setQrCode(null);
      const updatedUser = { ...user, whatsappLinked: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      fetchQR();
    } catch (err) {
      alert('Failed to logout');
    }
  };

  const handleAppLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="p-8 w-full max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-500 bg-clip-text text-transparent">
            Welcome, {user?.name}
          </h2>
          <p className="text-slate-500">Manage your WhatsApp marketing session</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/campaigns')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors font-medium"
          >
            <MessageSquare size={18} />
            Campaigns
          </button>
          <button
            onClick={handleAppLogout}
            className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      <div className="glass-panel p-8">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <Smartphone className="text-indigo-500" size={24} />
          <h3 className="text-xl font-semibold text-slate-800">WhatsApp Connection</h3>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <RefreshCw className="animate-spin mb-4" size={32} />
            <p>Initializing secure session...</p>
          </div>
        ) : linked ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-2 shadow-inner">
              <CheckCircle size={40} />
            </div>
            <h4 className="text-2xl font-bold text-slate-800">Device Connected</h4>
            <p className="text-slate-500 max-w-md">
              Your WhatsApp account is successfully linked and ready to send campaigns.
              <br/>
              <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded mt-2 inline-block">ID: {details}</span>
            </p>
            <button
              onClick={handleLogoutWhatsApp}
              className="mt-6 px-6 py-2 border-2 border-red-100 text-red-500 rounded-xl hover:bg-red-50 transition-colors font-medium"
            >
              Disconnect Device
            </button>
          </div>
        ) : qrCode ? (
          <div className="flex flex-col md:flex-row items-center gap-12 py-8 px-4">
            <div className="flex-1 space-y-6">
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-slate-800">1. Open WhatsApp on your phone</h4>
                <p className="text-sm text-slate-500">Tap Menu or Settings and select Linked Devices</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-slate-800">2. Tap on Link a Device</h4>
                <p className="text-sm text-slate-500">Point your phone to this screen to capture the code</p>
              </div>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
              <QRCodeSVG value={qrCode} size={250} level="H" includeMargin={true} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <RefreshCw className="animate-spin mb-4" size={32} />
            <p>Waiting for QR code generation...</p>
          </div>
        )}
      </div>
    </div>
  );
}
