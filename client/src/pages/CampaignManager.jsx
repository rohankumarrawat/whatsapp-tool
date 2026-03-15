import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Upload, Users, ArrowLeft, Loader2, MessageSquare } from 'lucide-react';
import api from '../utils/api';

export default function CampaignManager() {
  const [contactsText, setContactsText] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !contactsText.trim()) return alert('Message and contacts are required');
    
    // Parse contacts (comma separated or newline)
    const numbers = contactsText.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length > 5);
    
    if (numbers.length === 0) return alert('No valid numbers found');
    
    setSending(true);
    setResult(null);
    try {
      const { data } = await api.post('/whatsapp/send', {
        userId: user._id,
        numbers,
        message
      });
      setResult({
        success: true,
        successCount: data.successCount,
        failCount: data.failCount
      });
      setContactsText('');
      setMessage('');
    } catch (err) {
      setResult({
        success: false,
        error: err.response?.data?.message || 'Failed to send campaign'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-8 w-full max-w-5xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium mb-4"
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <div className="glass-panel p-8">
        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
          <Send className="text-indigo-500" size={24} />
          <h3 className="text-xl font-semibold text-slate-800">New Campaign</h3>
        </div>

        {result && (
          <div className={`mb-6 p-4 rounded-xl border ${result.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {result.success ? (
              <p className="font-medium">Campaign finished! Successfully sent: {result.successCount}, Failed: {result.failCount}</p>
            ) : (
              <p className="font-medium">Error: {result.error}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="flex items-center gap-2 font-medium text-slate-700">
                <Users size={18} className="text-slate-400" />
                Target Audience (Phone Numbers)
              </label>
              <p className="text-xs text-slate-500">Enter numbers with country code (e.g. 919876543210), separated by commas or newlines.</p>
              <textarea
                required
                rows={8}
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm resize-none font-mono text-sm"
                placeholder="919876543210&#10;919988776655"
                value={contactsText}
                onChange={(e) => setContactsText(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 font-medium text-slate-700">
                <MessageSquare size={18} className="text-slate-400" />
                Message Content
              </label>
              <p className="text-xs text-slate-500">Tip: Use *bold*, _italics_, and ~strikethrough~ for formatting.</p>
              <textarea
                required
                rows={8}
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm resize-none"
                placeholder="Hello! Check out our new amazing offer..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={sending || !user.whatsappLinked}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
            >
              {sending ? (
                <><Loader2 size={18} className="animate-spin" /> Sending...</>
              ) : (
                <><Send size={18} /> Launch Campaign</>
              )}
            </button>
          </div>
          {!user.whatsappLinked && (
            <p className="text-right text-sm text-red-500 mt-2">You must connect your WhatsApp device first.</p>
          )}
        </form>
      </div>
    </div>
  );
}
