import { useState, useEffect, useCallback } from 'react';
import { api } from './api/client';
import { format, formatDistanceToNow } from 'date-fns';
import { Mail, Clock, CheckCircle, AlertCircle, Play, Plus, X, RefreshCw, BarChart2, Eye, Link } from 'lucide-react';

export default function App() {
  const [emails, setEmails] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');

  const fetchData = useCallback(async () => {
    try {
      const [emailsData, metricsData] = await Promise.all([
        api.getEmails(),
        api.getQueueMetrics()
      ]);
      setEmails(emailsData);
      setMetrics(metricsData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Poll every 3 seconds for live updates
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleCancel = async (id) => {
    try {
      await api.cancelEmail(id);
      fetchData();
    } catch (error) {
      alert("Failed to cancel email");
    }
  };

  const handleBatchTest = async () => {
    try {
      await api.batchScheduleEmails(10, 0); // Schedule 10 emails immediately
      fetchData();
    } catch (error) {
      alert("Batch test failed");
    }
  };

  const filteredEmails = emails.filter(email => 
    activeTab === 'ALL' ? true : email.status === activeTab
  );

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Mail className="text-accent" size={32} />
            Email Flow
          </h1>
          <p>Production-grade scheduled email delivery platform</p>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-secondary" onClick={handleBatchTest}>
            <Play size={16} /> Load Test (10x)
          </button>
          <button className="btn btn-primary" onClick={() => setIsComposeOpen(true)}>
            <Plus size={16} /> Schedule Email
          </button>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="glass stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)' }}>
            <BarChart2 />
          </div>
          <div className="stat-info">
            <h3>Total Emails</h3>
            <p>{emails.length}</p>
          </div>
        </div>
        <div className="glass stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--info)' }}>
            <Clock />
          </div>
          <div className="stat-info">
            <h3>Queued (BullMQ)</h3>
            <p>{metrics?.delayed || 0}</p>
          </div>
        </div>
        <div className="glass stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <CheckCircle />
          </div>
          <div className="stat-info">
            <h3>Sent Successfully</h3>
            <p>{emails.filter(e => e.status === 'SENT').length}</p>
          </div>
        </div>
        <div className="glass stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
            <AlertCircle />
          </div>
          <div className="stat-info">
            <h3>Failed</h3>
            <p>{metrics?.failed || 0}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        {['ALL', 'SCHEDULED', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED'].map(tab => (
          <button 
            key={tab} 
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab(tab)}
            style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem' }}
          >
            {tab}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing...' : 'Live'}
        </div>
      </div>

      {/* Table */}
      <div className="glass glass-panel table-container">
        <table>
          <thead>
            <tr>
              <th>To</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Scheduled For</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmails.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No emails found in this category.
                </td>
              </tr>
            ) : filteredEmails.map(email => (
              <tr key={email.id}>
                <td>{email.to}</td>
                <td>{email.subject}</td>
                <td>
                  <span className={`badge badge-${email.status.toLowerCase()}`}>
                    {email.status}
                  </span>
                </td>
                <td>
                  <div style={{ fontSize: '0.9rem' }}>{format(new Date(email.scheduledAt), 'MMM d, yyyy HH:mm:ss')}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {email.status === 'SCHEDULED' ? `in ${formatDistanceToNow(new Date(email.scheduledAt))}` : ''}
                  </div>
                </td>
                <td>
                  <div className="flex gap-2 items-center">
                    {email.status === 'SCHEDULED' && (
                      <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleCancel(email.id)}>
                        <X size={14} /> Cancel
                      </button>
                    )}
                    {email.previewUrl && (
                      <a href={email.previewUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--info)' }}>
                        <Link size={14} /> View Ethereal
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Compose Modal */}
      {isComposeOpen && (
        <ComposeModal 
          onClose={() => setIsComposeOpen(false)} 
          onSuccess={() => { setIsComposeOpen(false); fetchData(); }} 
        />
      )}
    </div>
  );
}

function ComposeModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({ to: '', subject: '', body: '', delayMinutes: '0' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const scheduledAt = new Date(Date.now() + parseInt(formData.delayMinutes) * 60000);
      await api.scheduleEmail({
        to: formData.to,
        subject: formData.subject,
        body: formData.body,
        scheduledAt: scheduledAt.toISOString()
      });
      onSuccess();
    } catch (error) {
      alert('Failed to schedule email');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass glass-panel modal-content">
        <div className="flex justify-between items-center mb-6">
          <h2>Schedule Email</h2>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '6px' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Recipient (To)</label>
            <input type="email" required className="form-control" value={formData.to} onChange={e => setFormData({ ...formData, to: e.target.value })} placeholder="user@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <input type="text" required className="form-control" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder="Email Subject" />
          </div>
          <div className="form-group">
            <label className="form-label">HTML Body</label>
            <textarea required className="form-control" rows={5} value={formData.body} onChange={e => setFormData({ ...formData, body: e.target.value })} placeholder="<h1>Hello!</h1>" />
          </div>
          <div className="form-group">
            <label className="form-label">Schedule Time</label>
            <select className="form-control" value={formData.delayMinutes} onChange={e => setFormData({ ...formData, delayMinutes: e.target.value })}>
              <option value="0">Send Immediately</option>
              <option value="1">In 1 minute</option>
              <option value="5">In 5 minutes</option>
              <option value="60">In 1 hour</option>
              <option value="1440">Tomorrow (24 hours)</option>
            </select>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Scheduling...' : 'Schedule Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
