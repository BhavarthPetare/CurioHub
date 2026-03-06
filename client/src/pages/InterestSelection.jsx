import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const InterestSelection = () => {
  const [selected, setSelected] = useState([]);
  const { updateInterests, user } = useAuth();
  const navigate = useNavigate();

  const interests = [
    'Cricket', 'Football', 'Technology', 'History', 'Music', 
    'Science', 'Gaming', 'Art', 'Travel', 'Photography', 
    'Culinary', 'Fitness'
  ];

  const toggleInterest = (interest) => {
    if (selected.includes(interest)) {
      setSelected(selected.filter(i => i !== interest));
    } else {
      setSelected([...selected, interest]);
    }
  };

  const handleContinue = async () => {
    if (selected.length < 3) return;
    try {
      await updateInterests(selected);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen font-display gradient-mesh">
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          <header className="flex items-center justify-between border-b border-primary/20 px-8 py-4 lg:px-20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
                <span className="material-symbols-outlined text-2xl">auto_awesome</span>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">CurioHub</h2>
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center justify-center p-2 rounded-full hover:bg-primary/10 text-slate-600 dark:text-slate-400">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <div 
                className="h-10 w-10 rounded-full border-2 border-primary/30 bg-cover bg-center" 
                style={{ backgroundImage: `url('https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=7311d4&color=fff')` }}
              ></div>
            </div>
          </header>
          <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <div className="max-w-4xl w-full flex flex-col items-center text-center">
              <div className="mb-12 space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white">
                  Select your interests
                </h1>
                <p className="text-lg text-slate-500 dark:text-primary/60 font-medium">
                  Pick <span className="text-primary font-bold">at least 3</span> to personalize your experience
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mb-16 max-w-3xl">
                {interests.map(interest => (
                  <div 
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full cursor-pointer transition-all ${
                      selected.includes(interest) 
                        ? 'bg-gradient-to-r from-primary to-[#9d4edd] text-white border-2 border-transparent shadow-lg shadow-primary/20' 
                        : 'border-2 border-primary/20 bg-background-light dark:bg-background-dark hover:border-primary/50 text-slate-700 dark:text-slate-300 group'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm font-bold">
                      {selected.includes(interest) ? 'check' : 'add'}
                    </span>
                    <span className={selected.includes(interest) ? 'font-bold' : 'font-semibold'}>{interest}</span>
                  </div>
                ))}
              </div>
              <div className="w-full flex flex-col items-center gap-6">
                <div className="flex items-center gap-2 text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  <span className="text-sm font-bold">{selected.length} selected</span>
                </div>
                <button 
                  onClick={handleContinue}
                  disabled={selected.length < 3}
                  className={`group relative flex w-full max-sm items-center justify-center overflow-hidden rounded-full h-14 text-white text-lg font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-2xl ${
                    selected.length >= 3 ? 'bg-primary shadow-primary/40' : 'bg-slate-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  <span>Continue</span>
                  <span className="material-symbols-outlined absolute right-6 transition-transform group-hover:translate-x-1">arrow_forward</span>
                </button>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="text-slate-500 dark:text-slate-400 font-semibold hover:text-primary dark:hover:text-primary transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </main>
          <footer className="py-8 text-center text-xs text-slate-500 dark:text-slate-600 uppercase tracking-widest font-bold">
            CurioHub © 2024 • Discover Your World
          </footer>
        </div>
      </div>
    </div>
  );
};

export default InterestSelection;
