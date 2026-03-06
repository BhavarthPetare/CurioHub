import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Chat = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [activeUsers, setActiveUsers] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchRoomData();
    
    socketRef.current = io('http://localhost:5000', {
      auth: { token: localStorage.getItem('token') }
    });

    socketRef.current.emit('joinRoom', { roomId, user: { name: user.name, id: user?.id || user?._id } });

    socketRef.current.on('message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socketRef.current.on('roomData', ({ users, activeCount }) => {
      setActiveUsers(activeCount);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchRoomData = async () => {
    try {
      const [roomRes, msgRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/rooms`),
        axios.get(`http://localhost:5000/api/rooms/${roomId}/messages`)
      ]);
      const currentRoom = roomRes.data.find(r => r._id === roomId);
      setRoom(currentRoom);
      setMessages(msgRes.data);
    } catch (err) {
      console.error(err);
      navigate('/dashboard');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socketRef.current.emit('chatMessage', { 
        roomId, 
        userId: user.id || user._id, 
        text: message, 
        userName: user.name 
      });
      setMessage('');
    }
  };

  if (!room) return <div className="h-screen flex items-center justify-center bg-background-dark text-white">Loading...</div>;

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <div className="relative flex h-screen w-full flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-primary/20 bg-background-light dark:bg-background-dark/80 backdrop-blur-md px-6 py-3 z-20">
          <div className="flex items-center gap-8">
            <div onClick={() => navigate('/dashboard')} className="flex items-center gap-3 text-primary cursor-pointer">
              <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-2xl">hub</span>
              </div>
              <h2 className="text-slate-900 dark:text-white text-xl font-extrabold tracking-tight">CurioHub</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 border-2 border-primary overflow-hidden">
              <img 
                className="w-full h-full object-cover" 
                src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=7311d4&color=fff`} 
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
                  <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider">Live</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{room.description} • {activeUsers} Online</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.map((msg, i) => {
                const currentUserId = user?.id || user?._id;
                const senderId = msg.sender?._id || msg.sender;
                const isMe = msg.type !== 'system' && senderId && currentUserId && senderId === currentUserId;
                
                const isSystem = msg.type === 'system';
                const senderName = isSystem ? 'System' : (msg.sender?.name || 'User');
                const timeStr = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

                // Debug alignment
                if (i === messages.length - 1) {
                  console.log('Alignment Check:', { senderId, currentUserId, isMe, type: msg.type });
                }

                return (
                  <div key={i} className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-start gap-3 max-w-2xl ${isMe ? 'ml-auto' : ''} ${isSystem ? 'max-w-full justify-center w-full' : ''}`}>
                    {!isSystem && (
                      <div className="h-10 w-10 rounded-full shrink-0 mt-1 overflow-hidden transition-all">
                        <img 
                          className="w-full h-full object-cover" 
                          src={`https://ui-avatars.com/api/?name=${senderName}&background=${isMe ? '7311d4' : '3c2a52'}&color=fff`} 
                        />
                      </div>
                    )}
                    <div className={`flex flex-col gap-1 ${isMe ? 'items-end text-right' : ''} ${isSystem ? 'items-center w-full' : ''}`}>
                      {!isSystem && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold dark:text-slate-200">{senderName}</span>
                          <span className="text-[11px] text-slate-500">{timeStr}</span>
                        </div>
                      )}
                      <div className={`px-4 py-3 rounded-2xl ${
                        isSystem 
                          ? 'bg-slate-500/10 text-slate-400 italic text-[11px] mx-auto rounded-full border border-slate-500/10' 
                          : isMe 
                            ? 'bg-primary text-white rounded-tr-none shadow-md shadow-primary/20' 
                            : 'bg-slate-100 dark:bg-primary/10 border border-slate-200 dark:border-primary/20 rounded-tl-none'
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                        {isSystem && <span className="ml-2 not-italic opacity-60">({timeStr})</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white/50 dark:bg-background-dark/40 border-t border-primary/10">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-slate-100 dark:bg-primary/5 rounded-2xl p-2 border border-slate-200 dark:border-primary/20">
                <input 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400" 
                  placeholder={`Message #${room.name}`} 
                  type="text"
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
