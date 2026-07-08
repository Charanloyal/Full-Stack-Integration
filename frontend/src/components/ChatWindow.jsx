import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { Send, MessageSquare, Users, ShieldAlert } from 'lucide-react';

export default function ChatWindow() {
  const { user, token, apiUrl } = useAuth();
  const { socket, onlineUsers } = useSocket();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Load chat history from MongoDB (Mongoose)
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${apiUrl}/chats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok && data.status === 'success') {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };
    fetchHistory();
  }, [token, apiUrl]);

  // Subscribe to real-time chat messages via Socket.io (WebSocket)
  useEffect(() => {
    if (!socket) return;

    socket.on('chat_message', (message) => {
      setMessages((prev) => {
        // Prevent duplicate messages
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    });

    return () => {
      socket.off('chat_message');
    };
  }, [socket]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    // Send via socket connection (saves to MongoDB on backend and broadcasts to everyone)
    socket.emit('chat_message', inputText.trim());
    setInputText('');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', height: '100%', overflow: 'hidden' }}>
      
      {/* Main Chat Interface */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid rgba(255, 255, 255, 0.05)' }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} style={{ color: 'var(--primary)' }} />
            Workspace Chat Room
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Messages are persisted to MongoDB & broadcast in real-time</p>
        </div>

        {/* Message Logs */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <MessageSquare size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
              <p style={{ fontSize: '13px' }}>No messages yet. Send a message to start collaboration!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.senderId === user?.id;
              return (
                <div
                  key={msg._id || msg.id || Math.random()}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                    flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                  }}
                >
                  {/* User Avatar */}
                  {msg.senderAvatarUrl ? (
                    <img
                      src={window.location.hostname === 'localhost' ? `http://localhost:5000${msg.senderAvatarUrl}` : msg.senderAvatarUrl}
                      alt={msg.senderName}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', marginTop: '4px' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isOwnMessage ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        marginTop: '4px',
                      }}
                    >
                      {msg.senderName.charAt(0)}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '2px', justifyContent: isOwnMessage ? 'flex-end' : 'flex-start', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <span style={{ fontWeight: '700' }}>{msg.senderName}</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div
                      style={{
                        padding: '10px 16px',
                        borderRadius: '12px',
                        borderTopLeftRadius: !isOwnMessage ? '2px' : '12px',
                        borderTopRightRadius: isOwnMessage ? '2px' : '12px',
                        background: isOwnMessage ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                        border: isOwnMessage ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                        color: 'white',
                        fontSize: '14px',
                        wordBreak: 'break-word',
                        boxShadow: isOwnMessage ? '0 4px 12px rgba(99, 102, 241, 0.2)' : 'none',
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Type your message here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0 16px' }} disabled={!inputText.trim()}>
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Sidebar: Online Teammates */}
      <div style={{ padding: '20px', overflowY: 'auto' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={14} />
          Online ({onlineUsers.length})
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {onlineUsers.map((u) => (
            <div key={u.socketId} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                {u.avatarUrl ? (
                  <img
                    src={window.location.hostname === 'localhost' ? `http://localhost:5000${u.avatarUrl}` : u.avatarUrl}
                    alt={u.name}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}
                  >
                    {u.name.charAt(0)}
                  </div>
                )}
                {/* Active Indicator dot */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--success)',
                    border: '2px solid #0f172a',
                  }}
                />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  {u.name}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {u.role === 'ADMIN' && <ShieldAlert size={10} style={{ color: 'var(--warning)' }} />}
                  <span>{u.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
