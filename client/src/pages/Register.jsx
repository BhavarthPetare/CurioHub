import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }
        try {
            await register(name, email, password);
            navigate('/interests');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-primary/20 px-6 md:px-10 py-4 bg-background-light/50 dark:bg-background-dark/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="size-8 text-primary">
                        <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor"></path>
                        </svg>
                    </div>
                    <h2 className="text-slate-900 dark:text-white text-xl font-extrabold leading-tight tracking-tight">CurioHub</h2>
                </div>
                <div className="flex items-center gap-6">
                    <Link to="/login" className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-full h-10 px-5 bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-all shadow-lg shadow-primary/20">
                        Log In
                    </Link>
                </div>
            </header>
            <main className="flex-1 flex items-center justify-center p-4 sm:p-6 auth-gradient">
                <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-slate-900/40 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-primary/10 backdrop-blur-sm mx-auto">
                    <div className="hidden lg:block relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-background-dark/90 z-10"></div>
                        <div className="absolute inset-0 z-0 gradient-mesh"></div>
                        <div className="relative z-20 h-full flex flex-col justify-between p-12 text-white">
                            <div>
                                <h1 className="text-4xl font-bold mb-4">Find your people.</h1>
                                <p className="text-lg text-white/80 leading-relaxed">Live chat rooms for the topics you love, from cricket to AI to cooking.</p>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <span className="material-symbols-outlined text-primary bg-white rounded-full p-2">bolt</span>
                                    <p className="text-sm font-medium">Real-time messages, no refresh needed</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="material-symbols-outlined text-primary bg-white rounded-full p-2">interests</span>
                                    <p className="text-sm font-medium">Room picks based on your interests</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 sm:p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                        <div className="mb-10 text-center lg:text-left">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create an account</h2>
                            <p className="text-slate-500 dark:text-slate-400">Join our community and explore the curiosities.</p>
                        </div>
                        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div className="flex flex-col">
                                <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold mb-2 ml-1">Full Name</label>
                                <input 
                                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-background-dark/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" 
                                    placeholder="John Doe" 
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold mb-2 ml-1">Email Address</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">mail</span>
                                    <input 
                                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-background-dark/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" 
                                        placeholder="john@example.com" 
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold mb-2 ml-1">Password</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">lock</span>
                                    <input 
                                        className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-background-dark/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" 
                                        placeholder="Min. 8 characters" 
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        minLength={8}
                                        maxLength={72}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-slate-700 dark:text-slate-200 text-sm font-semibold mb-2 ml-1">Confirm Password</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">lock_reset</span>
                                    <input 
                                        className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-background-dark/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" 
                                        placeholder="Re-enter password" 
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <button className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-xl shadow-primary/25 active:scale-[0.98]" type="submit">
                                Create Account
                            </button>
                        </form>
                        <p className="mt-10 text-center text-slate-600 dark:text-slate-400 text-sm">
                            Already have an account? <Link className="text-primary font-bold hover:underline" to="/login">Log in</Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Register;
