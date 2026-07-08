import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Upload, Mail, Shield, User, Info } from 'lucide-react';

export default function ProfilePanel() {
  const { user, token, updateUser, apiUrl } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch(`${apiUrl}/upload/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        updateUser(data.user);
        alert('Profile picture uploaded successfully!');
      } else {
        alert(data.message || 'Avatar upload failed');
      }
    } catch (err) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleTriggerTestEmail = async () => {
    setEmailLoading(true);
    setEmailStatus('');
    try {
      const response = await fetch(`${apiUrl}/auth/test-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        setEmailStatus(data.message);
      } else {
        setEmailStatus(`Error: ${data.message}`);
      }
    } catch (err) {
      setEmailStatus(`Request error: ${err.message}`);
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Account Settings</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Manage profile picture and test notifications</p>
      </div>

      <div className="glass-panel animate-fade-in" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '160px 1fr', gap: '24px', alignItems: 'center' }}>
        {/* Avatar Area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            {user?.avatarUrl ? (
              <img
                src={`http://localhost:5000${user.avatarUrl}`}
                alt={user.name}
                style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }}
              />
            ) : (
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px dashed rgba(255,255,255,0.2)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  fontWeight: 'bold',
                }}
              >
                {user?.name.charAt(0)}
              </div>
            )}
          </div>

          <label className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: '12px', padding: '6px 12px' }}>
            <Upload size={12} /> {uploading ? 'Uploading...' : 'Upload Photo'}
            <input type="file" style={{ display: 'none' }} onChange={handleAvatarUpload} disabled={uploading} />
          </label>
        </div>

        {/* User Info Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={12} /> Full Name
            </span>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>{user?.name}</div>
          </div>
          
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mail size={12} /> Email Address
            </span>
            <div style={{ fontSize: '16px', color: 'var(--text-primary)', marginTop: '2px' }}>{user?.email}</div>
          </div>

          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={12} /> Role / Authorization Level
            </span>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>
              <span className={`badge ${user?.role === 'ADMIN' ? 'badge-inprogress' : 'badge-todo'}`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* NodeMailer Test Dispatcher (Day 45-46 Integration) */}
      <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={18} style={{ color: 'var(--primary)' }} />
          Nodemailer Integration Test
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
          Dispatch a simulated HTML welcome notification. If SMTP environment variables aren't set, the server falls back to logging the text to the backend command terminal console or generating an Ethereal mailbox test preview.
        </p>

        <button className="btn btn-primary" onClick={handleTriggerTestEmail} disabled={emailLoading}>
          {emailLoading ? 'Dispatching...' : 'Send Test Notification Email'}
        </button>

        {emailStatus && (
          <div className="glass-card" style={{ marginTop: '16px', padding: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start', borderLeft: '4px solid var(--primary)' }}>
            <Info size={18} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--primary)' }} />
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {emailStatus}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
