import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useSocket } from '../context/SocketContext.tsx';
import { useUIStore, PriorityFilterType } from '../store/useUIStore.ts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Calendar, FileText, Upload, ArrowRight, ArrowLeft, CheckSquare, Square, Filter, RefreshCw } from 'lucide-react';

interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string; // 'TODO' | 'IN_PROGRESS' | 'DONE'
  dueDate: string | null;
  attachmentUrl: string | null;
  priority: string; // 'LOW' | 'MEDIUM' | 'HIGH'
  subtasks: Subtask[];
  userId: string;
  user: User;
  createdAt: string;
}

// Helper to resolve absolute attachment URLs
const getAttachmentUrl = (url: string | null, host: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = host.replace('/api', '');
  return window.location.hostname === 'localhost' ? `http://localhost:5000${url}` : `${baseUrl}${url}`;
};

// Helper to extract sanitized original filename from the file URL
const getAttachmentName = (url: string | null) => {
  if (!url) return '';
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return filename.replace(/^attachment-\d+-\d+-/, '') || filename;
};

export default function KanbanBoard() {
  const { token, apiUrl } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // Zustand Store UI filters
  const { searchQuery, setSearchQuery, priorityFilter, setPriorityFilter, assigneeFilter, setAssigneeFilter, resetFilters } = useUIStore();

  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [subtaskInput, setSubtaskInput] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);

  // Fetch Tasks with React Query
  const { data: tasks = [], isLoading, refetch } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data.tasks;
    },
  });

  // Mutators using React Query
  const createTaskMutation = useMutation({
    mutationFn: async (newTask: Partial<Task>) => {
      const response = await fetch(`${apiUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTask),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const details = data.errors.map(err => `- ${err.field}: ${err.message}`).join('\n');
          throw new Error(`${data.message}\n\nDetails:\n${details}`);
        }
        throw new Error(data.message || 'Validation failed');
      }
      return data.task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: Partial<Task> }) => {
      const response = await fetch(`${apiUrl}/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fields),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const details = data.errors.map(err => `- ${err.field}: ${err.message}`).join('\n');
          throw new Error(`${data.message}\n\nDetails:\n${details}`);
        }
        throw new Error(data.message || 'Validation failed');
      }
      return data.task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${apiUrl}/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // WebSocket sync connection
  useEffect(() => {
    if (!socket) return;

    socket.on('task_created', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });

    socket.on('task_updated', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });

    socket.on('task_deleted', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });

    return () => {
      socket.off('task_created');
      socket.off('task_updated');
      socket.off('task_deleted');
    };
  }, [socket, queryClient]);

  // Handle task status changes
  const updateStatus = (taskId: string, newStatus: string) => {
    updateTaskMutation.mutate({ id: taskId, fields: { status: newStatus } });
  };

  // Handle task deletion
  const deleteTask = (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    deleteTaskMutation.mutate(taskId);
  };

  // Handle file uploads (Multer integration)
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
        setAttachmentUrl(data.fileUrl);
      } else {
        alert(data.message || 'File upload failed');
      }
    } catch (err: any) {
      alert(`Error uploading file: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Add subtask to checklist list
  const addSubtask = () => {
    if (!subtaskInput.trim()) return;
    const newSubtask: Subtask = {
      id: Math.random().toString(36).substring(2, 9),
      text: subtaskInput.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSubtask]);
    setSubtaskInput('');
  };

  // Remove subtask from creation checklist
  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  // Toggle subtask status in existing task card
  const toggleTaskSubtask = (task: Task, subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map(s => {
      if (s.id === subtaskId) return { ...s, completed: !s.completed };
      return s;
    });
    updateTaskMutation.mutate({ id: task.id, fields: { subtasks: updatedSubtasks } });
  };

  // Handle new task submissions
  const handleCreateTask = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTaskMutation.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        attachmentUrl: attachmentUrl || null,
        priority,
        subtasks,
      },
      {
        onSuccess: () => {
          setTitle('');
          setDescription('');
          setDueDate('');
          setPriority('MEDIUM');
          setSubtasks([]);
          setAttachmentUrl('');
          setShowAddForm(false);
        },
        onError: (err: any) => {
          alert(`Error creating task: ${err.message}`);
        },
      }
    );
  };

  // Filters calculation
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'ALL' || task.userId === assigneeFilter;
    return matchesSearch && matchesPriority && matchesAssignee;
  });

  // Extract unique assignees for filtering list
  const assigneesMap = new Map<string, User>();
  tasks.forEach(t => {
    if (t.user) assigneesMap.set(t.user.id, t.user);
  });
  const assignees = Array.from(assigneesMap.values());

  // Columns layout setup
  const columns = [
    { id: 'TODO', title: 'To Do', badgeClass: 'badge-todo' },
    { id: 'IN_PROGRESS', title: 'In Progress', badgeClass: 'badge-inprogress' },
    { id: 'DONE', title: 'Done', badgeClass: 'badge-done' },
  ];

  const getPriorityColor = (lvl: string) => {
    if (lvl === 'HIGH') return '#f43f5e';
    if (lvl === 'LOW') return '#38bdf8';
    return '#fbbf24';
  };

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Workspace Tasks...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', overflow: 'hidden' }}>
      
      {/* Upper header action area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Collaborative Task Board</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Real-time team task management with Zustand & React Query</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => refetch()} style={{ padding: '8px' }} title="Sync tasks">
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={18} /> Add Task
          </button>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '16px', marginBottom: '16px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
          <Filter size={14} /> FILTERS:
        </div>
        
        <input 
          type="text" 
          className="input-field" 
          placeholder="Search by title..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '200px', fontSize: '12px', padding: '6px 12px' }}
        />

        <select
          className="input-field"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as PriorityFilterType)}
          style={{ maxWidth: '140px', fontSize: '12px', padding: '6px 12px', cursor: 'pointer' }}
        >
          <option value="ALL">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>

        <select
          className="input-field"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          style={{ maxWidth: '160px', fontSize: '12px', padding: '6px 12px', cursor: 'pointer' }}
        >
          <option value="ALL">All Assignees</option>
          {assignees.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        {(searchQuery || priorityFilter !== 'ALL' || assigneeFilter !== 'ALL') && (
          <button className="btn btn-secondary" onClick={resetFilters} style={{ fontSize: '11px', padding: '6px 12px' }}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <form onSubmit={handleCreateTask} className="glass-panel animate-fade-in" style={{ padding: '20px', marginBottom: '20px', overflowY: 'auto', maxValueHeight: '360px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '700' }}>Create Collaborative Task</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 150px', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Task Title</label>
              <input type="text" className="input-field" placeholder="Enter task title..." value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Priority</label>
              <select className="input-field" value={priority} onChange={(e) => setPriority(e.target.value as any)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Due Date</label>
              <input type="date" className="input-field" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Task Description</label>
            <textarea className="input-field" style={{ minHeight: '60px', resize: 'vertical' }} placeholder="Task description and details..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* Subtasks Builder */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Subtask Checklist</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Add subtask text..."
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                style={{ fontSize: '13px' }}
              />
              <button type="button" className="btn btn-secondary" onClick={addSubtask}>Add</button>
            </div>
            
            {subtasks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', background: 'rgba(0,0,0,0.1)', borderRadius: '6px' }}>
                {subtasks.map((st) => (
                  <div key={st.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-primary)' }}>- {st.text}</span>
                    <button type="button" onClick={() => removeSubtask(st.id)} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: '11px' }}>Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Task Attachment (Max 100MB)</label>
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
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={uploading}>Create Task</button>
            </div>
          </div>
        </form>
      )}

      {/* Kanban Column Grid */}
      <div className="kanban-grid" style={{ flex: 1, overflow: 'hidden' }}>
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="kanban-column">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span className={`badge ${col.badgeClass}`} style={{ letterSpacing: '0.05em' }}>{col.title}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>{colTasks.length} tasks</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                {colTasks.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '30px 10px', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    No tasks in this list
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const completedSubtasks = task.subtasks.filter(s => s.completed).length;
                    const totalSubtasks = task.subtasks.length;
                    
                    return (
                      <div key={task.id} className="glass-card animate-fade-in" style={{ padding: '16px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        
                        {/* Upper card row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'white', padding: '2px 6px', borderRadius: '4px', backgroundColor: getPriorityColor(task.priority) }}>
                            {task.priority || 'MEDIUM'}
                          </span>
                          <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => deleteTask(task.id)}>
                            <Trash2 size={14} style={{ color: 'rgba(239, 68, 68, 0.7)' }} />
                          </button>
                        </div>

                        {/* Title and details */}
                        <div>
                          <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{task.title}</h4>
                          {task.description && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', wordBreak: 'break-word', margin: 0 }}>
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Subtasks checklist on Card */}
                        {totalSubtasks > 0 && (
                          <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '6px', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                              <span>Subtasks Checklist</span>
                              <span>{completedSubtasks}/{totalSubtasks}</span>
                            </div>
                            
                            {/* Checklist list */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                              {task.subtasks.map((st) => (
                                <div 
                                  key={st.id} 
                                  onClick={() => toggleTaskSubtask(task, st.id)}
                                  style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: st.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}
                                >
                                  {st.completed ? (
                                    <CheckSquare size={13} style={{ color: '#34d399' }} />
                                  ) : (
                                    <Square size={13} style={{ color: 'var(--text-secondary)' }} />
                                  )}
                                  <span style={{ textDecoration: st.completed ? 'line-through' : 'none' }}>
                                    {st.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Date and attachment details */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {task.dueDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={12} />
                              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {task.attachmentUrl && (
                            <a href={getAttachmentUrl(task.attachmentUrl, apiUrl)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', textDecoration: 'none' }}>
                              <FileText size={12} />
                              <span style={{ maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={getAttachmentName(task.attachmentUrl)}>
                                {getAttachmentName(task.attachmentUrl)}
                              </span>
                            </a>
                          )}
                        </div>

                        {/* Footer card row (Assignee and move buttons) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {task.user?.avatarUrl ? (
                              <img src={window.location.hostname === 'localhost' ? `http://localhost:5000${task.user.avatarUrl}` : task.user.avatarUrl} alt={task.user.name} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                                {task.user?.name ? task.user.name.charAt(0) : '?'}
                              </div>
                            )}
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{task.user?.name || 'Unknown'}</span>
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
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
