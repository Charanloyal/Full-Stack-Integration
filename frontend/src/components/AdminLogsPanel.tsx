import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ShieldAlert, RefreshCw, AlertTriangle, UserCheck, ShieldClose, Bug } from 'lucide-react';

interface LogItem {
  _id?: string;
  id?: string;
  eventType: string;
  ip: string;
  details: string;
  createdAt: string;
}

export default function AdminLogsPanel() {
  const { token, apiUrl } = useAuth();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/admin/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token, apiUrl]);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'AUTH_FAILURE':
        return <ShieldClose size={18} style={{ color: 'var(--danger)' }} />;
      case 'AUTH_SUCCESS':
        return <UserCheck size={18} style={{ color: 'var(--success)' }} />;
      case 'RATE_LIMIT_ALERT':
        return <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />;
      case 'UNAUTHORIZED_ACCESS':
        return <ShieldAlert size={18} style={{ color: 'var(--danger)' }} />;
      case 'SERVER_ERROR':
        return <Bug size={18} style={{ color: 'var(--danger)' }} />;
      default:
        return <ShieldAlert size={18} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  const getLogLabel = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Admin Security Logs</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Real-time audit trails loaded from MongoDB Mongoose schemas</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchLogs} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="glass-panel animate-fade-in" style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading security logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs found. Try logging in or breaching rate limit.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', fontWeight: '600' }}>Event</th>
                <th style={{ padding: '12px 8px', fontWeight: '600' }}>IP Address</th>
                <th style={{ padding: '12px 8px', fontWeight: '600' }}>Details</th>
                <th style={{ padding: '12px 8px', fontWeight: '600' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id || log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', color: 'var(--text-primary)', verticalAlign: 'top' }}>
                  <td style={{ padding: '14px 8px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getLogIcon(log.eventType)}
                    <span style={{ fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>
                      {getLogLabel(log.eventType)}
                    </span>
                  </td>
                  <td style={{ padding: '14px 8px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                    {log.ip}
                  </td>
                  <td style={{ padding: '14px 8px', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
                    {log.details}
                  </td>
                  <td style={{ padding: '14px 8px', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
