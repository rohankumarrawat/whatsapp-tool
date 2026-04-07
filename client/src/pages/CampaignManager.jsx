import { useState, useEffect } from 'react';
import { Send, Upload, Users, Loader2, MessageSquare, X } from 'lucide-react';
import api from '../utils/api';

export default function CampaignManager() {
  const [contactsText, setContactsText] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: accountsData }, { data: groupsData }] = await Promise.all([
          api.get(`/whatsapp/accounts/${user._id}`),
          api.get(`/contacts/groups/${user._id}`)
        ]);
        const linked = accountsData.filter(a => a.isLinked);
        setAccounts(linked);
        if (linked.length > 0) setSelectedAccountId(linked[0]._id);
        setGroups(groupsData);
      } catch (err) {
        console.error('Failed to fetch data', err);
      }
    };
    fetchData();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() && !selectedFile) return alert('Message or media is required');
    if (!contactsText.trim() && !selectedGroupId) return alert('Please enter numbers or select a group');
    if (!selectedAccountId) return alert('Please select a WhatsApp account');

    const numbers = contactsText ? contactsText.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length > 5) : [];
    if (numbers.length === 0 && !selectedGroupId) return alert('No valid numbers found');

    setSending(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('accountId', selectedAccountId);
      formData.append('message', message);
      if (selectedGroupId) formData.append('groupId', selectedGroupId);
      if (numbers.length > 0) formData.append('numbers', JSON.stringify(numbers));
      if (selectedFile) formData.append('media', selectedFile);

      const { data } = await api.post('/whatsapp/send', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult({ success: true, message: data.message, totalTargets: data.campaign?.totalTargets });
      setContactsText(''); setMessage(''); setSelectedFile(null);
    } catch (err) {
      setResult({ success: false, error: err.response?.data?.message || 'Failed to send campaign' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">New Campaign</h1>
        <p className="page-subtitle">Send bulk messages to your contacts</p>
      </div>

      <div className="page-body">
        {/* No accounts warning */}
        {accounts.length === 0 && (
          <div className="mb-5 p-4 rounded-xl flex items-center gap-3"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
            <span>⚠️</span>
            <div>
              <div className="text-sm font-semibold">No linked WhatsApp account</div>
              <div className="text-xs opacity-80 mt-0.5">Go to Dashboard and connect a WhatsApp number first.</div>
            </div>
          </div>
        )}

        {result && (
          <div className={`mb-5 p-4 rounded-xl flex items-start gap-3 ${result.success ? '' : ''}`}
            style={{
              background: result.success ? 'rgba(37,211,102,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${result.success ? 'rgba(37,211,102,0.2)' : 'rgba(239,68,68,0.2)'}`,
              color: result.success ? '#25d366' : '#f87171'
            }}>
            <span>{result.success ? '✅' : '❌'}</span>
            <div className="text-sm">
              {result.success
                ? <><span className="font-semibold">Campaign launched!</span> Sending to {result.totalTargets} recipients in the background. Check Analytics for updates.</>
                : result.error}
            </div>
            <button onClick={() => setResult(null)} className="ml-auto opacity-60 hover:opacity-100"><X size={14} /></button>
          </div>
        )}

        <form onSubmit={handleSend}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Account + Audience */}
            <div className="lg:col-span-2 space-y-5">
              <div className="card">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageSquare size={16} style={{ color: '#25d366' }} /> Sender Account
                </h3>
                <label className="form-label">Send From</label>
                <select
                  className="form-input"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                >
                  {accounts.length === 0 && <option value="">No linked accounts</option>}
                  {accounts.map(acc => (
                    <option key={acc._id} value={acc._id}>{acc.name} ({acc.number})</option>
                  ))}
                </select>
              </div>

              <div className="card">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Users size={16} style={{ color: '#818cf8' }} /> Target Audience
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Contact Group</label>
                    <select className="form-input" value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}>
                      <option value="">-- Manual Numbers Only --</option>
                      {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div className="divider">or add manually</div>
                  <div>
                    <label className="form-label">Custom Numbers</label>
                    <p className="text-xs mb-2" style={{ color: '#475569' }}>With country code — comma or newline separated</p>
                    <textarea
                      rows={5}
                      className="form-input font-mono text-sm"
                      placeholder={"919876543210\n919988776655"}
                      value={contactsText}
                      onChange={(e) => setContactsText(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Message + Media */}
            <div className="lg:col-span-3 space-y-5">
              <div className="card flex flex-col" style={{ minHeight: 420 }}>
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Send size={16} style={{ color: '#25d366' }} /> Message Content
                </h3>
                <p className="text-xs mb-3" style={{ color: '#475569' }}>Tip: *bold*, _italics_, ~strike~ — Media sent as caption</p>
                <textarea
                  rows={8}
                  className="form-input flex-1"
                  placeholder="Hello! 👋 Check out our new amazing offer..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />

                {/* File upload */}
                <div className="relative mt-4 rounded-xl border-2 border-dashed transition-colors cursor-pointer"
                  style={{ borderColor: selectedFile ? 'rgba(37,211,102,0.4)' : 'rgba(255,255,255,0.08)' }}>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/*,video/*,application/pdf"
                  />
                  <div className="flex flex-col items-center justify-center py-5 gap-2 pointer-events-none">
                    <Upload size={20} style={{ color: selectedFile ? '#25d366' : '#334155' }} />
                    <span className="text-sm font-medium" style={{ color: selectedFile ? '#25d366' : '#475569' }}>
                      {selectedFile ? selectedFile.name : 'Click to attach Image / Video / PDF'}
                    </span>
                  </div>
                </div>
                {selectedFile && (
                  <button type="button" onClick={() => setSelectedFile(null)}
                    className="btn btn-ghost text-xs mt-2 self-start" style={{ color: '#f87171' }}>
                    <X size={12} /> Remove file
                  </button>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sending || accounts.length === 0}
                  className="btn btn-primary px-8 py-3"
                >
                  {sending ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <><Send size={16} /> Launch Campaign</>}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
