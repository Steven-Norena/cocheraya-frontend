import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Send, X, MessageSquare } from 'lucide-react';

interface ChatMessage {
  id: number;
  reservationId: number;
  senderId: number;
  senderName: string;
  senderEmail: string;
  content: string;
  createdAt: string;
}

interface ChatModalProps {
  reservationId: number | null;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({ reservationId, isOpen, onClose, title }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (showLoading = false) => {
    if (!reservationId) return;
    if (showLoading) setLoading(true);
    try {
      const response = await api.get<ChatMessage[]>(`/reservations/${reservationId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Poll messages every 3 seconds when open
  useEffect(() => {
    if (!isOpen || !reservationId) return;

    fetchMessages(true);

    const interval = setInterval(() => {
      fetchMessages(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, reservationId]);

  // Scroll to bottom when messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !reservationId || sending) return;

    setSending(true);
    try {
      const response = await api.post<ChatMessage>(`/reservations/${reservationId}/messages`, {
        content: newMessage.trim(),
      });
      setMessages((prev) => [...prev, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('No se pudo enviar el mensaje.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '480px',
        height: '600px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{title}</h3>
          </div>
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ border: 'none', background: 'transparent', padding: '0.25rem', display: 'flex', alignItems: 'center' }} 
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '0.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          background: 'rgba(0,0,0,0.15)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem'
        }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', margin: 'auto' }}>Cargando chat...</p>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', margin: 'auto', padding: '1rem' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Bandeja vacía</p>
              <p>Envía un mensaje para coordinar la entrega de las llaves, clave de puerta o reportar tu llegada.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user?.userId;
              return (
                <div 
                  key={msg.id} 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    alignSelf: isMe ? 'flex-end' : 'flex-start'
                  }}
                >
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.15rem', marginLeft: isMe ? 0 : '0.25rem', marginRight: isMe ? '0.25rem' : 0 }}>
                    {isMe ? 'Tú' : msg.senderName}
                  </span>
                  <div 
                    style={{
                      background: isMe ? 'var(--primary)' : 'var(--input-bg)',
                      border: isMe ? 'none' : '1px solid var(--panel-border)',
                      padding: '0.6rem 0.9rem',
                      borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      wordBreak: 'break-word',
                      lineHeight: '1.4'
                    }}
                  >
                    {msg.content}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem', alignSelf: 'flex-end', opacity: 0.8 }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
          <input
            type="text"
            className="form-input"
            style={{ borderRadius: 'var(--radius-md)', padding: '0.7rem 1.0rem' }}
            placeholder="Escribe un mensaje para coordinar..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            maxLength={1000}
          />
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ borderRadius: 'var(--radius-md)', padding: '0.7rem 1.1rem', minWidth: '50px' }}
            disabled={!newMessage.trim() || sending}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
