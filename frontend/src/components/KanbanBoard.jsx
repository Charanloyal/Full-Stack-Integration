import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { Plus, Trash2, Calendar, FileText, Upload, ArrowRight, ArrowLeft } from 'lucide-react';

// Helper to resolve absolute attachment URLs
const getAttachmentUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return window.location.hostname === 'localhost' ? `http://localhost:5000${url}` : url;
};

// Helper to extract sanitized original filename from the file URL
const getAttachmentName = (url) => {
  if (!url) return '';
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return filename.replace(/^attachment-\d+-\d+-/, '') || filename;
};

export default function KanbanBoard() {
  const { token, apiUrl } = useAuth();
  const { socket } = useSocket();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // New task form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Fetch initial tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`${apiUrl}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setTasks(data.tasks);
        }
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [token, apiUrl]);

  // WebSocket task syncing (real-time collaboration)
  useEffect(() => {
    if (!socket) return;

    socket.on('task_created', (newTask) => {
      setTasks((prev) => {
        // Prevent duplicate tasks
        if (prev.some((t) => t.id === newTask.id)) return prev;
        return [newTask, ...prev];
      });
    });

    socket.on('task_updated', (updatedTask) => {
      setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    });

    socket.on('task_deleted', (deletedId) => {
      setTasks((prev) => prev.filter((t) => t.id !== deletedId));
    });

    return () => {
      socket.off('task_created');
      socket.off('task_updated');
      socket.off('task_deleted');
    };
  }, [socket]);

  // Handle task status changes
  const updateStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(`${apiUrl}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
    } catch (err) {
      alert(`Error updating task status: ${err.message}`);
    }
  };

  // Handle task deletion
  const deleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const response = await fetch(`${apiUrl}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
    } catch (err) {
      alert(`Error deleting task: ${err.message}`);
    }
  };

  // Handle file uploads (Multer integration)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('attachment', file);

    try {
      const response = await fetch(`${apiUrl}/upload/attachment`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        // Save relative path (client will dynamically resolve the domain)
        setAttachmentUrl(data.fileUrl);
      } else {
        alert(data.message || 'File upload failed');
      }
    } catch (err) {
      alert(`Error uploading file: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle new task submissions
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const response = await fetch(`${apiUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          attachmentUrl: attachmentUrl || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      // Clear fields
      setTitle('');
      setDescription('');
      setDueDate('');
      setAttachmentUrl('');
      setShowAddForm(false);
    } catch (err) {
      alert(`Error creating task: ${err.message}`);
    }
  };

  // Columns layout setup
  const columns = [
    { id: 'TODO', title: 'To Do', badgeClass: 'badge-todo' },
    { id: 'IN_PROGRESS', title: 'In Progress', badgeClass: 'badge-inprogress' },
    { id: 'DONE', title: 'Done', badgeClass: 'badge-done' },
  ];

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Workspace Tasks...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Collaborative Task Board</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Real-time synched team dashboard</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={18} /> Add Task
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateTask} className="glass-panel animate-fade-in" style={{ padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '700' }}>Create Collaborative Task</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Task Title</label>
              <input type="text" className="input-field" placeholder="Enter task title..." value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Due Date</label>
              <input type="date" className="input-field" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Task Description</label>
            <textarea className="input-field" style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Task description and details..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Task Attachment (PDF, Images, Docx)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
                <Upload size={16} /> Choose File
                <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
              </label>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {uploading ? 'Uploading attachment...' : attachmentUrl ? 'File ready!' : 'No attachment uploaded'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>Create Task</button>
          </div>
        </form>
      )}

      <div className="kanban-grid">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="kanban-column">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span className={`badge ${col.badgeClass}`} style={{ letterSpacing: '0.05em' }}>{col.title}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>{colTasks.length} tasks</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
                {colTasks.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '30px 10px', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    No tasks in this list
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div key={task.id} className="glass-card animate-fade-in" style={{ padding: '16px', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{task.title}</h4>
                        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => deleteTask(task.id)}>
                          <Trash2 size={14} style={{ color: 'rgba(239, 68, 68, 0.7)' }} />
                        </button>
                      </div>

                      {task.description && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px', wordBreak: 'break-word' }}>
                          {task.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        {task.dueDate && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} />
                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {task.attachmentUrl && (
                          <a href={getAttachmentUrl(task.attachmentUrl)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', textDecoration: 'none' }}>
                            <FileText size={12} />
                            <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={getAttachmentName(task.attachmentUrl)}>
                              {getAttachmentName(task.attachmentUrl)}
                            </span>
                          </a>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {task.user.avatarUrl ? (
                            <img src={window.location.hostname === 'localhost' ? `http://localhost:5000${task.user.avatarUrl}` : task.user.avatarUrl} alt={task.user.name} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                              {task.user.name.charAt(0)}
                            </div>
                          )}
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{task.user.name}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          {col.id !== 'TODO' && (
                            <button style={{ padding: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => updateStatus(task.id, col.id === 'DONE' ? 'IN_PROGRESS' : 'TODO')}>
                              <ArrowLeft size={12} />
                            </button>
                          )}
                          {col.id !== 'DONE' && (
                            <button style={{ padding: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => updateStatus(task.id, col.id === 'TODO' ? 'IN_PROGRESS' : 'DONE')}>
                              <ArrowRight size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
