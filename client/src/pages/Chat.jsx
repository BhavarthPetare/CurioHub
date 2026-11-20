import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../context/useAuth';
import { avatarUrl } from '../utils/avatar';

const API = API_URL;

const Chat = () => {
  const { roomId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [activeUsers, setActiveUsers] = useState(0);
  const [connected, setConnected] = useState(false);
  const [sendError, setSendError] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setRoom(null);
    setMessages([]);
    setActiveUsers(0);

    // The server identifies the user from this token; it ignores any client-sent identity.
    const socket = io(API, { auth: { token: localStorage.getItem('token') } });
    socketRef.current = socket;

    // Join on every (re)connect so a dropped connection restores presence.
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('joinRoom', { roomId });
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => {
      if (err.message === 'Unauthorized') logout();
    });
    socket.on('joinError', () => navigate('/dashboard', { replace: true }));
    socket.on('message', (msg) => setMessages((prev) => [...prev, msg]));
    socket.on('roomData', ({ activeCount }) => setActiveUsers(activeCount));
    socket.on('messageError', (text) => setSendError(text));

    (async () => {
      try {
        const [roomRes, msgRes] = await Promise.all([
          axios.get(`${API}/api/rooms`),
          axios.get(`${API}/api/rooms/${roomId}/messages`)
        ]);
        if (cancelled) return;
        const currentRoom = roomRes.data.find((r) => r._id === roomId);
        if (!currentRoom) return navigate('/dashboard', { replace: true });

        setRoom(currentRoom);
        // Merge instead of overwrite: live messages may have arrived while history loaded.
        setMessages((live) => {
          const seen = new Set(msgRes.data.map((m) => m._id));
          return [...msgRes.data, ...live.filter((m) => !m._id || !seen.has(m._id))];
        });
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        navigate('/dashboard', { replace: true });
      }
    })();

    return () => {
      cancelled = true;
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    // Scroll only the message list; scrollIntoView would also scroll the page and clip the header.
    const list = messagesEndRef.current?.parentElement;
    list?.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Auto-dismiss send errors.
  useEffect(() => {
    if (!sendError) return;
    const t = setTimeout(() => setSendError(''), 4000);
    return () => clearTimeout(t);
  }, [sendError]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    if (!connected) return setSendError('Reconnecting... try again in a moment');
    socketRef.current.emit('chatMessage', { text });
    setMessage('');
  };

  if (!room) return <div className="h-screen flex items-center justify-center bg-background-dark text-white">Loading...</div>;

  const currentUserId = user?.id || user?._id;

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <div className="relative flex h-screen w-full flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-primary/20 bg-background-light dark:bg-background-dark/80 backdrop-blur-md px-4 sm:px-6 py-3 z-20">
          <div className="flex items-center gap-3 md:gap-8">
            <button
              type="button"
              aria-label="Back to dashboard"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 sm:gap-3 text-primary cursor-pointer active:scale-95 transition-all"
            >
              <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white shrink-0">
                <span className="material-symbols-outlined text-xl sm:text-2xl">arrow_back</span>
              </div>
              <h2 className="hidden sm:block text-slate-900 dark:text-white text-lg sm:text-xl font-extrabold tracking-tight">CurioHub</h2>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/20 border-2 border-primary overflow-hidden shrink-0">
              <img
                className="w-full h-full object-cover"
                alt={user?.name || 'You'}
                src={avatarUrl(user?.name)}
              />
            </div>
          </div>
        </header>

        <main className="flex flex-1 overflow-hidden">
          <section className="flex-1 flex flex-col bg-white dark:bg-background-dark/20 relative">
            <div className="px-6 py-4 border-b border-primary/10 flex items-center justify-between bg-white/50 dark:bg-background-dark/60 backdrop-blur-sm">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold dark:text-white"># {room.name}</h1>
                  {connected ? (
                    <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider">Live</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider">Reconnecting</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{room.description} • {activeUsers} Online</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.map((msg, i) => {
                const senderId = msg.sender?._id || msg.sender;
                const isSystem = msg.type === 'system';
                const isMe = !isSystem && senderId && currentUserId && senderId === currentUserId;
                const senderName = isSystem ? 'System' : (msg.sender?.name || 'User');
                const timeStr = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

                return (
                  <div key={msg._id || `system-${i}`} className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 sm:gap-3 max-w-[95%] sm:max-w-2xl ${isMe ? 'ml-auto' : ''} ${isSystem ? 'max-w-full justify-center w-full' : ''}`}>
                    {!isSystem && (
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full shrink-0 mt-1 overflow-hidden transition-all">
                        <img
                          className="w-full h-full object-cover"
                          alt={senderName}
                          src={avatarUrl(senderName, isMe ? '7311d4' : '3c2a52')}
                        />
                      </div>
                    )}
                    <div className={`flex flex-col gap-0.5 sm:gap-1 ${isMe ? 'items-end text-right' : ''} ${isSystem ? 'items-center w-full' : ''}`}>
                      {!isSystem && (
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] sm:text-sm font-bold dark:text-slate-200">{senderName}</span>
                          <span className="text-[10px] text-slate-500">{timeStr}</span>
                        </div>
                      )}
                      <div className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${
                        isSystem
                          ? 'bg-slate-500/10 text-slate-400 italic text-[10px] sm:text-[11px] mx-auto rounded-full border border-slate-500/10'
                          : isMe
                            ? 'bg-primary text-white rounded-tr-none shadow-md shadow-primary/20'
                            : 'bg-slate-100 dark:bg-primary/10 border border-slate-200 dark:border-primary/20 rounded-tl-none'
                      }`}>
                        <p className="text-[13px] sm:text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                        {isSystem && <span className="ml-2 not-italic opacity-60">({timeStr})</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white/50 dark:bg-background-dark/40 border-t border-primary/10">
              {sendError && <p className="text-red-400 text-xs font-semibold mb-2 px-2" role="alert">{sendError}</p>}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-slate-100 dark:bg-primary/5 rounded-2xl p-2 border border-slate-200 dark:border-primary/20">
                <input
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  placeholder={`Message #${room.name}`}
                  type="text"
                  maxLength={2000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/30">
                  <span>Send</span>
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </form>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Chat;
