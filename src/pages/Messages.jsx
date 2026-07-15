// src/pages/Messages.jsx  — DM inbox + conversation view
import authFetch from '../utils/authFetch';
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle, Send } from 'lucide-react';
import Navbar from '../components/NavBar';
import usePageTitle from '../hooks/usePageTitle';

const api = import.meta.env.VITE_API_URL;

function timeAgo(date) {
  const mins = Math.floor((Date.now() - new Date(date)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Avatar({ name, size = 'md' }) {
  const sz = size === 'sm' ? 'w-9 h-9 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold flex-shrink-0`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

export default function Messages() {
  usePageTitle('Messages');
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const bottomRef = useRef(null);

  const myId = Number(localStorage.getItem('userId'));
  const myRole = localStorage.getItem('userRole') || 'user';
  const myType = myRole === 'studio' ? 'studio' : 'user';

  // Active conversation from URL params
  const activeType = searchParams.get('type');
  const activeId = searchParams.get('id');
  const activeName = searchParams.get('name');

  useEffect(() => {
    authFetch(`${api}/messages/inbox`)
      .then(r => r.json())
      .then(d => setConversations(d.conversations || []));
  }, []);

  useEffect(() => {
    if (!activeType || !activeId) return;
    setPartnerName(activeName || '');
    setMessages([]);
    authFetch(`${api}/messages/${activeType}/${activeId}`)
      .then(r => r.json())
      .then(d => setMessages(d.messages || []));
  }, [activeType, activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || !activeType || !activeId) return;
    const res = await authFetch(`${api}/messages/${activeType}/${activeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessages(prev => [...prev, data.message]);
      setText('');
      // Update conversation list
      setConversations(prev => {
        const existing = prev.find(c => c.partner_type === activeType && c.partner_id === Number(activeId));
        const updated = { ...data.message, partner_type: activeType, partner_id: Number(activeId), partner_name: partnerName };
        if (existing) return prev.map(c => c.partner_type === activeType && c.partner_id === Number(activeId) ? updated : c);
        return [updated, ...prev];
      });
    }
  }

  function openConversation(type, id, name) {
    setSearchParams({ type, id: String(id), name });
  }

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-5xl mx-auto">
        <h1 className="font-display font-bold text-3xl text-ink-900 mb-6">Messages</h1>

        <div className="flex gap-4 h-[600px]">
          {/* Sidebar — conversations */}
          <div className="w-72 bg-white rounded-3xl shadow-card flex flex-col overflow-hidden flex-shrink-0">
            <div className="px-5 py-4 border-b border-ink-100 font-display font-bold text-ink-900 text-sm">Conversations</div>
            <div className="flex-1 overflow-y-auto divide-y divide-ink-50">
              {conversations.length === 0 ? (
                <p className="px-4 py-6 text-sm text-ink-400 text-center">No messages yet</p>
              ) : conversations.map(c => (
                <button
                  key={`${c.partner_type}-${c.partner_id}`}
                  onClick={() => openConversation(c.partner_type, c.partner_id, c.partner_name)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-paper transition ${activeType === c.partner_type && Number(activeId) === c.partner_id ? 'bg-brand-50' : ''}`}
                >
                  <Avatar name={c.partner_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-800 truncate">{c.partner_name}</p>
                    <p className="text-xs text-ink-400 truncate">{c.content}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-ink-400">{timeAgo(c.created_at)}</span>
                    {!c.read && c.recipient_type === myType && c.recipient_id === myId && (
                      <span className="w-2 h-2 bg-brand-500 rounded-full" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Conversation panel */}
          {activeType && activeId ? (
            <div className="flex-1 bg-white rounded-3xl shadow-card flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-ink-100">
                <Avatar name={partnerName} size="sm" />
                <span className="font-display font-bold text-ink-900">{partnerName}</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-paper/40">
                {messages.map(m => {
                  const isMine = m.sender_type === myType && m.sender_id === myId;
                  return (
                    <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMine ? 'bg-brand-500 text-white rounded-br-sm' : 'bg-white text-ink-800 rounded-bl-sm'}`}>
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        <p className={`text-xs mt-1 ${isMine ? 'text-brand-100' : 'text-ink-400'}`}>{timeAgo(m.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Compose */}
              <form onSubmit={sendMessage} className="px-4 py-3 border-t border-ink-100 flex gap-2">
                <input
                  className="flex-1 bg-paper border border-transparent rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 transition"
                  placeholder="Type a message…"
                  value={text}
                  onChange={e => setText(e.target.value)}
                />
                <button type="submit" disabled={!text.trim()}
                  className="inline-flex items-center gap-1.5 bg-brand-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-600 transition shadow-pill disabled:opacity-40">
                  <Send className="w-4 h-4" /> Send
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 bg-white rounded-3xl shadow-card flex items-center justify-center">
              <div className="text-center">
                <span className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-brand-50 text-brand-500 mx-auto mb-3">
                  <MessageCircle className="w-6 h-6" />
                </span>
                <p className="font-display font-bold text-ink-800">Select a conversation</p>
                <p className="text-sm text-ink-400 mt-1">or start one from a user or studio profile</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
