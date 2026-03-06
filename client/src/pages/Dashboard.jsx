import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [recommendedRooms, setRecommendedRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [search, setSearch] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const [recRes, allRes] = await Promise.all([
        axios.get('http://localhost:5000/api/rooms/recommended'),
        axios.get('http://localhost:5000/api/rooms')
      ]);
      setRecommendedRooms(recRes.data);
      setAllRooms(allRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRooms = allRooms.filter(room => 
    room.name.toLowerCase().includes(search.toLowerCase()) || 
    room.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex font-display">
      <aside className="fixed left-0 top-0 h-screen w-72 bg-surface-dark border-r border-primary/10 flex flex-col p-6 z-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-white">explore</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-100">CurioHub</span>
        </div>
        <div className="flex flex-col gap-6 flex-1">
          <div className="flex items-center gap-3 p-2">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-primary/20 overflow-hidden border-2 border-primary/50">
                <img 
                  alt={user?.name} 
                  className="w-full h-full object-cover" 
                  src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=7311d4&color=fff`} 
                />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-surface-dark rounded-full"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-slate-100 text-base font-semibold">{user?.name}</h1>
              <p className="text-slate-400 text-xs font-medium">Explorer</p>
            </div>
          </div>
          <nav className="flex flex-col gap-2">
            <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-white transition-all">
              <span className="material-symbols-outlined">dashboard</span>
              <span className="text-sm font-semibold">Dashboard</span>
            </Link>
            <Link to="/interests" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-primary/10 hover:text-primary transition-all">
              <span className="material-symbols-outlined">favorite</span>
              <span className="text-sm font-semibold">My Interests</span>
            </Link>
            <button 
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all text-left w-full"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="text-sm font-semibold">Logout</span>
            </button>
          </nav>
        </div>
        <div className="mt-auto p-4 bg-primary/10 rounded-2xl border border-primary/20">
          <p className="text-xs text-primary font-bold uppercase tracking-wider mb-2">Pro Tip</p>
          <p className="text-xs text-slate-300 leading-relaxed">Join 5 rooms to unlock the 'Curious Explorer' badge!</p>
        </div>
      </aside>

      <main className="ml-72 flex-1 p-8 custom-scrollbar overflow-y-auto">
        <header className="mb-10">
          <div className="max-w-3xl">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">search</span>
              </div>
              <input 
                className="block w-full pl-12 pr-4 py-4 bg-surface-dark border border-primary/10 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" 
                placeholder="Search for CurioHub rooms, interests, or friends..." 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </header>

        {recommendedRooms.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Recommended for You</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedRooms.map(room => (
                <RoomCard key={room._id} room={room} navigate={navigate} />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Explore All Rooms</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map(room => (
              <RoomCard key={room._id} room={room} navigate={navigate} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

const RoomCard = ({ room, navigate }) => (
  <div className="bg-surface-dark p-6 rounded-2xl border border-primary/10 hover:border-primary/40 hover:-translate-y-1 transition-all group">
    <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mb-4">
      <span className="text-3xl">{room.icon || '💬'}</span>
    </div>
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-lg font-bold text-slate-100">{room.name}</h3>
      <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold rounded-full uppercase tracking-widest">Active</span>
    </div>
    <p className="text-slate-400 text-sm mb-6 line-clamp-2">{room.description}</p>
    <div className="flex items-center justify-between mt-auto">
      <div className="flex items-center gap-1 text-slate-400">
        <span className="material-symbols-outlined text-sm">groups</span>
        <span className="text-xs font-medium">{room.activeUsers || 0} Online</span>
      </div>
      <button 
        onClick={() => navigate(`/chat/${room._id}`)}
        className="bg-primary hover:bg-primary/80 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors"
      >
        Join
      </button>
    </div>
  </div>
);

export default Dashboard;
