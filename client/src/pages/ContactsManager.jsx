import { useState, useEffect, useRef } from 'react';
import { Users, UserPlus, Upload, Trash2, RefreshCw, Plus, FolderOpen } from 'lucide-react';
import api from '../utils/api';

export default function ContactsManager() {
  const [groups, setGroups] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState(null);
  const fileRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user'));

  const fetchGroups = async () => {
    try {
      const { data } = await api.get(`/contacts/groups/${user._id}`);
      setGroups(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchContacts = async () => {
    try {
      const { data } = await api.get(`/contacts/${user._id}`);
      setContacts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchGroups(); fetchContacts(); }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      await api.post('/contacts/groups', { userId: user._id, name: newGroupName });
      setNewGroupName('');
      fetchGroups();
      setMessage({ type: 'success', text: `Group "${newGroupName}" created!` });
    } catch {
      setMessage({ type: 'error', text: 'Failed to create group' });
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user._id);
      if (selectedGroupId) formData.append('groupId', selectedGroupId);
      const { data } = await api.post('/contacts/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage({ type: 'success', text: `✅ Imported ${data.count} contacts successfully!` });
      fetchContacts();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Import failed' });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDeleteContact = async (id) => {
    if (!confirm('Delete this contact?')) return;
    try {
      await api.delete(`/contacts/${id}`);
      fetchContacts();
    } catch {
      alert('Failed to delete');
    }
  };

  const filteredContacts = selectedGroupId
    ? contacts.filter(c => c.groupId === selectedGroupId)
    : contacts;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Contacts</h1>
        <p className="page-subtitle">Manage groups and import contacts from CSV</p>
      </div>

      <div className="page-body space-y-6">
        {message && (
          <div className="p-4 rounded-xl text-sm"
            style={{
              background: message.type === 'success' ? 'rgba(37,211,102,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${message.type === 'success' ? 'rgba(37,211,102,0.2)' : 'rgba(239,68,68,0.2)'}`,
              color: message.type === 'success' ? '#25d366' : '#f87171'
            }}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar: Groups + Import */}
          <div className="space-y-5">
            {/* Create Group */}
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <UserPlus size={16} style={{ color: '#25d366' }} /> New Group
              </h3>
              <form onSubmit={handleCreateGroup} className="space-y-3">
                <input
                  className="form-input"
                  placeholder="e.g. Students, Customers..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
                <button type="submit" className="btn btn-primary w-full justify-center">
                  <Plus size={14} /> Create Group
                </button>
              </form>
            </div>

            {/* Import CSV */}
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Upload size={16} style={{ color: '#818cf8' }} /> Import CSV
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="form-label">Add to Group (optional)</label>
                  <select className="form-input" value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}>
                    <option value="">-- No Group --</option>
                    {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                  </select>
                </div>
                <p className="text-xs" style={{ color: '#475569' }}>CSV must have <code className="px-1 rounded" style={{ background: 'rgba(255,255,255,0.06)' }}>name</code> and <code className="px-1 rounded" style={{ background: 'rgba(255,255,255,0.06)' }}>number</code> columns</p>
                <div className="relative rounded-xl border-2 border-dashed transition-colors"
                  style={{ borderColor: importing ? 'rgba(37,211,102,0.4)' : 'rgba(255,255,255,0.08)' }}>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleImport}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center py-6 gap-2 pointer-events-none">
                    {importing
                      ? <RefreshCw size={22} className="animate-spin" style={{ color: '#25d366' }} />
                      : <Upload size={22} style={{ color: '#334155' }} />}
                    <span className="text-xs font-medium" style={{ color: '#475569' }}>
                      {importing ? 'Importing...' : 'CSV / Excel file'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Groups List */}
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <FolderOpen size={16} style={{ color: '#fbbf24' }} /> Groups
              </h3>
              {groups.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: '#334155' }}>No groups yet</p>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedGroupId('')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedGroupId ? 'text-white' : ''}`}
                    style={{
                      background: !selectedGroupId ? 'rgba(37,211,102,0.1)' : 'transparent',
                      color: !selectedGroupId ? '#25d366' : '#64748b'
                    }}>
                    All Contacts ({contacts.length})
                  </button>
                  {groups.map(g => {
                    const count = contacts.filter(c => c.groupId === g._id).length;
                    return (
                      <button
                        key={g._id}
                        onClick={() => setSelectedGroupId(g._id)}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                        style={{
                          background: selectedGroupId === g._id ? 'rgba(37,211,102,0.1)' : 'transparent',
                          color: selectedGroupId === g._id ? '#25d366' : '#64748b'
                        }}>
                        📁 {g.name} <span className="float-right opacity-60">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Contacts Table */}
          <div className="lg:col-span-2 card overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users size={16} style={{ color: '#818cf8' }} />
                {selectedGroupId ? groups.find(g => g._id === selectedGroupId)?.name : 'All Contacts'}
                <span className="text-xs font-normal" style={{ color: '#475569' }}>({filteredContacts.length})</span>
              </h3>
              <button onClick={() => { fetchContacts(); fetchGroups(); }} className="btn btn-ghost p-1.5">
                <RefreshCw size={14} />
              </button>
            </div>

            {filteredContacts.length === 0 ? (
              <div className="empty-state flex-1">
                <Users size={36} />
                <p className="text-sm" style={{ color: '#334155' }}>No contacts found</p>
                <p className="text-xs" style={{ color: '#1e293b' }}>Import a CSV file to get started</p>
              </div>
            ) : (
              <div className="overflow-auto flex-1 -mx-1.5 px-1.5">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Number</th>
                      <th>Group</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map(c => (
                      <tr key={c._id}>
                        <td className="font-medium" style={{ color: '#e2e8f0' }}>{c.name || '—'}</td>
                        <td className="font-mono text-xs">{c.number}</td>
                        <td>
                          {c.groupId
                            ? <span className="badge badge-slate">{groups.find(g => g._id === c.groupId)?.name || 'Group'}</span>
                            : <span style={{ color: '#334155' }}>—</span>}
                        </td>
                        <td>
                          <button onClick={() => handleDeleteContact(c._id)} className="btn btn-ghost p-1" style={{ color: '#475569' }}>
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
