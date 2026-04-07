import { useState, useEffect } from 'react';
import { Bot, Plus, Trash2, RefreshCw, Edit2, Check, X, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../utils/api';

export default function AutoReplyManager() {
  const [rules, setRules] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    keyword: '', matchType: 'contains', replyText: '', accountId: ''
  });

  const user = JSON.parse(localStorage.getItem('user'));

  const fetchRules = async () => {
    try {
      const { data } = await api.get(`/autoreply/${user._id}`);
      setRules(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const { data } = await api.get(`/whatsapp/accounts/${user._id}`);
      setAccounts(data.filter(a => a.isLinked));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchRules(); fetchAccounts(); }, []);

  const resetForm = () => {
    setFormData({ keyword: '', matchType: 'contains', replyText: '', accountId: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.keyword || !formData.replyText) return alert('Keyword and reply text are required');
    try {
      const payload = { ...formData, userId: user._id, accountId: formData.accountId || null };
      if (editingId) {
        await api.put(`/autoreply/${editingId}`, payload);
      } else {
        await api.post('/autoreply', payload);
      }
      fetchRules();
      resetForm();
    } catch {
      alert('Failed to save rule');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this auto-reply rule?')) return;
    try { await api.delete(`/autoreply/${id}`); fetchRules(); } catch { alert('Failed to delete'); }
  };

  const handleToggle = async (rule) => {
    try {
      await api.put(`/autoreply/${rule._id}`, { ...rule, isActive: !rule.isActive });
      fetchRules();
    } catch { alert('Failed to toggle rule'); }
  };

  const startEdit = (rule) => {
    setFormData({ keyword: rule.keyword, matchType: rule.matchType, replyText: rule.replyText, accountId: rule.accountId || '' });
    setEditingId(rule._id);
    setShowForm(true);
  };

  const matchTypeBadge = { exact: 'badge-red', contains: 'badge-blue', startsWith: 'badge-amber' };

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Chatbot Rules</h1>
            <p className="page-subtitle">Auto-reply to incoming messages based on keywords</p>
          </div>
          <button onClick={() => { setShowForm(true); setEditingId(null); }} className="btn btn-primary">
            <Plus size={15} /> New Rule
          </button>
        </div>
      </div>

      <div className="page-body space-y-5">
        {/* Form */}
        {showForm && (
          <div className="card animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Bot size={16} style={{ color: '#25d366' }} /> {editingId ? 'Edit Rule' : 'New Auto-Reply Rule'}
              </h3>
              <button onClick={resetForm} className="btn btn-ghost p-1.5"><X size={14} /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Keyword</label>
                <input
                  className="form-input"
                  placeholder="e.g. hello, price, hi"
                  value={formData.keyword}
                  onChange={(e) => setFormData(f => ({ ...f, keyword: e.target.value.toLowerCase() }))}
                />
              </div>
              <div>
                <label className="form-label">Match Type</label>
                <select className="form-input" value={formData.matchType} onChange={(e) => setFormData(f => ({ ...f, matchType: e.target.value }))}>
                  <option value="exact">Exact Match</option>
                  <option value="contains">Contains Keyword</option>
                  <option value="startsWith">Starts With</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Reply Text</label>
                <textarea
                  rows={3}
                  className="form-input"
                  placeholder="Type the automated reply message..."
                  value={formData.replyText}
                  onChange={(e) => setFormData(f => ({ ...f, replyText: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label">WhatsApp Account (optional)</label>
                <select className="form-input" value={formData.accountId} onChange={(e) => setFormData(f => ({ ...f, accountId: e.target.value }))}>
                  <option value="">All Accounts</option>
                  {accounts.map(acc => <option key={acc._id} value={acc._id}>{acc.name} ({acc.number})</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <div className="flex gap-2 w-full">
                  <button type="submit" className="btn btn-primary flex-1 justify-center">
                    <Check size={15} /> {editingId ? 'Save Changes' : 'Create Rule'}
                  </button>
                  <button type="button" onClick={resetForm} className="btn btn-secondary">Cancel</button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Rules list */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Bot size={16} style={{ color: '#818cf8' }} /> Rules <span className="text-xs font-normal" style={{ color: '#475569' }}>({rules.length})</span>
            </h3>
            <button onClick={fetchRules} className="btn btn-ghost p-1.5"><RefreshCw size={14} /></button>
          </div>

          {loading ? (
            <div className="empty-state py-10"><RefreshCw size={24} className="animate-spin" /></div>
          ) : rules.length === 0 ? (
            <div className="empty-state py-12">
              <Bot size={40} />
              <p className="font-medium" style={{ color: '#334155' }}>No rules yet</p>
              <p className="text-sm" style={{ color: '#1e293b' }}>Create your first auto-reply rule to get started</p>
              <button onClick={() => setShowForm(true)} className="btn btn-primary mt-2">
                <Plus size={14} /> Create Rule
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map(rule => (
                <div key={rule._id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${rule.isActive ? 'border-white/8' : 'border-white/4 opacity-60'}`}
                  style={{ background: '#0d1117' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <code className="px-2 py-0.5 rounded text-xs font-mono font-semibold text-white"
                        style={{ background: 'rgba(255,255,255,0.08)' }}>
                        {rule.keyword}
                      </code>
                      <span className={`badge ${matchTypeBadge[rule.matchType] || 'badge-slate'}`}>{rule.matchType}</span>
                      {!rule.isActive && <span className="badge badge-slate">Paused</span>}
                      {rule.accountId
                        ? <span className="text-xs" style={{ color: '#475569' }}>{accounts.find(a => a._id === rule.accountId)?.name || 'Specific Account'}</span>
                        : <span className="text-xs" style={{ color: '#334155' }}>All accounts</span>}
                    </div>
                    <p className="text-sm" style={{ color: '#64748b' }}>{rule.replyText}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => handleToggle(rule)} className="btn btn-ghost p-1.5" title={rule.isActive ? 'Pause' : 'Activate'}
                      style={{ color: rule.isActive ? '#25d366' : '#475569' }}>
                      {rule.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    <button onClick={() => startEdit(rule)} className="btn btn-ghost p-1.5"><Edit2 size={13} /></button>
                    <button onClick={() => handleDelete(rule._id)} className="btn btn-ghost p-1.5" style={{ color: '#f87171' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tip */}
        <div className="p-4 rounded-xl text-xs" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', color: '#64748b' }}>
          <span style={{ color: '#818cf8' }} className="font-semibold">💡 Tip:</span> Auto-reply only triggers when a WhatsApp account is connected. Rules are checked in order and only the first match fires per message.
        </div>
      </div>
    </div>
  );
}
