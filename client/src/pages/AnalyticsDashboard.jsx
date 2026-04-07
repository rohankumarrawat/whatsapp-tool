import { useState, useEffect } from 'react';
import { BarChart3, Clock, CheckCircle, CheckCircle2, XCircle, RefreshCw, Users, TrendingUp } from 'lucide-react';
import api from '../utils/api';

export default function AnalyticsDashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user'));

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/campaigns/${user._id}`);
      setCampaigns(data);
    } catch (err) {
      console.error('Error fetching campaigns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const fetchDetails = async (id) => {
    setDetailsLoading(true);
    try {
      const { data } = await api.get(`/campaigns/details/${id}`);
      setSelectedCampaign(data);
    } catch {
      alert('Failed to fetch details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const totalSent = campaigns.reduce((s, c) => s + c.sentCount, 0);
  const totalDelivered = campaigns.reduce((s, c) => s + c.deliveredCount, 0);
  const totalRead = campaigns.reduce((s, c) => s + c.readCount, 0);
  const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Analytics</h1>
            <p className="page-subtitle">Campaign performance and delivery reports</p>
          </div>
          <button onClick={selectedCampaign ? () => fetchDetails(selectedCampaign._id) : fetchCampaigns}
            className="btn btn-secondary">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="page-body space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Campaigns', value: campaigns.length, color: '#818cf8', icon: BarChart3 },
            { label: 'Total Sent', value: totalSent, color: '#25d366', icon: TrendingUp },
            { label: 'Delivered', value: totalDelivered, color: '#34d399', icon: CheckCircle },
            { label: 'Read', value: totalRead, color: '#60a5fa', icon: CheckCircle2 },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="stat-card">
              <div className="flex items-center justify-between">
                <div className="stat-label">{label}</div>
                <Icon size={16} style={{ color }} />
              </div>
              <div className="stat-value" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: '60vh' }}>
          {/* Campaign List */}
          <div className="card overflow-hidden flex flex-col">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 flex-shrink-0">
              <BarChart3 size={16} style={{ color: '#818cf8' }} /> All Campaigns
            </h3>
            <div className="overflow-y-auto flex-1 -mx-1.5 px-1.5 space-y-2">
              {loading ? (
                <div className="empty-state py-8"><RefreshCw size={24} className="animate-spin" /></div>
              ) : campaigns.length === 0 ? (
                <div className="empty-state py-8">
                  <BarChart3 size={32} />
                  <p className="text-sm" style={{ color: '#334155' }}>No campaigns yet</p>
                </div>
              ) : campaigns.map(c => (
                <div
                  key={c._id}
                  onClick={() => fetchDetails(c._id)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                    selectedCampaign?._id === c._id
                      ? 'border-indigo-500/40 bg-indigo-500/8'
                      : 'border-white/5 hover:border-white/10 hover:bg-white/2'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-xs font-semibold text-white/90 truncate">{c.name}</h4>
                    <span className={`badge flex-shrink-0 ${c.status === 'Completed' ? 'badge-green' : 'badge-blue'}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3" style={{ fontSize: '0.7rem', color: '#475569' }}>
                    <span className="flex items-center gap-1"><Users size={10} /> {c.totalTargets}</span>
                    <span className="flex items-center gap-1" style={{ color: '#25d366' }}><CheckCircle size={10} /> {c.deliveredCount}</span>
                    <span className="flex items-center gap-1" style={{ color: '#60a5fa' }}><CheckCircle2 size={10} /> {c.readCount}</span>
                    <span className="flex items-center gap-1" style={{ color: '#f87171' }}><XCircle size={10} /> {c.failCount}</span>
                  </div>
                  <div className="mt-2 text-[10px]" style={{ color: '#334155' }}>
                    <Clock size={9} className="inline mr-1" />{new Date(c.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-2 card flex flex-col overflow-hidden">
            {detailsLoading ? (
              <div className="empty-state flex-1"><RefreshCw size={28} className="animate-spin" /></div>
            ) : !selectedCampaign ? (
              <div className="empty-state flex-1">
                <BarChart3 size={40} />
                <p style={{ color: '#334155' }}>Select a campaign to view details</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="mb-5 flex-shrink-0">
                  <h2 className="text-lg font-bold text-white">{selectedCampaign.name}</h2>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: '#475569' }}>
                    <span className="flex items-center gap-1"><Clock size={12} />{new Date(selectedCampaign.createdAt).toLocaleString()}</span>
                    <span>{selectedCampaign.hasMedia ? '📸 Includes Media' : '📄 Text Only'}</span>
                  </div>
                </div>

                {/* Mini stats */}
                <div className="grid grid-cols-4 gap-3 mb-5 flex-shrink-0">
                  {[
                    { label: 'Targets', value: selectedCampaign.totalTargets, color: '#e2e8f0' },
                    { label: 'Sent', value: selectedCampaign.sentCount, color: '#818cf8' },
                    { label: 'Delivered', value: selectedCampaign.deliveredCount, color: '#25d366' },
                    { label: 'Read', value: selectedCampaign.readCount, color: '#60a5fa' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center py-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-xs" style={{ color: '#475569' }}>{label}</div>
                      <div className="text-xl font-bold mt-1" style={{ color }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Number</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCampaign.recipients.length === 0 && (
                        <tr><td colSpan={2} className="text-center py-6" style={{ color: '#334155' }}>Processing...</td></tr>
                      )}
                      {selectedCampaign.recipients.map((r, i) => (
                        <tr key={i}>
                          <td className="font-mono text-xs">{r.number}</td>
                          <td>
                            <span className={`badge ${
                              r.status === 'read' ? 'badge-blue' :
                              r.status === 'delivered' ? 'badge-green' :
                              r.status === 'sent' ? 'badge-slate' : 'badge-red'
                            }`}>
                              {r.status === 'read' && <CheckCircle2 size={9} />}
                              {r.status === 'delivered' && <CheckCircle size={9} />}
                              {r.status === 'failed' && <XCircle size={9} />}
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
