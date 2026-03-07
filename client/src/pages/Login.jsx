import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      if (data.user.interests && data.user.interests.length >= 3) {
        navigate('/dashboard');
      } else {
        navigate('/interests');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen selection:bg-primary/30">
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-background-dark via-[#2a1b3d] to-background-dark"></div>
      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center p-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-3xl">deployed_code</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white">CurioHub</h1>
        </div>
        <div className="w-full max-w-[440px] overflow-hidden rounded-2xl bg-white dark:bg-[#251b2e] shadow-2xl transition-all border border-white/5 mx-auto">
          <div className="px-6 sm:px-8 pt-10 pb-8">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Enter your credentials to access your account</p>
            </div>
            {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1" htmlFor="email">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                  <input 
                    className="w-full rounded-lg border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-primary/10 py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    id="email" 
                    placeholder="name@company.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="password">Password</label>
                  <a className="text-xs font-medium text-primary hover:underline" href="#">Forgot?</a>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                  <input 
                    className="w-full rounded-lg border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-primary/10 py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                    id="password" 
                    placeholder="••••••••" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center px-1">
                <input className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary dark:bg-primary/10 dark:border-primary/30" id="remember" type="checkbox"/>
                <label className="ml-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer" htmlFor="remember">Remember me on this device</label>
              </div>
              <button type="submit" className="w-full rounded-lg bg-gradient-to-r from-primary to-[#9333ea] py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90 active:scale-[0.98] transition-all">
                Log In to CurioHub
              </button>
            </form>
            <div className="relative my-8">
              <div aria-hidden="true" className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-[#251b2e] px-2 text-slate-500 dark:text-slate-400">Or continue with</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2a1f33] py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <img alt="Google" className="h-4 w-4" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqLGKvTCP7HCXPCTT3ZMBNqmVVH0awuKts8Dy_CCeGQGqxGOea_bCWx37UXxwBpRAR6zYuuINgJbTuR1ZCr_Mj3pe5x9K_GKN51whRGOd6-X5LezY-KKvlauqvV60rK14vGWImHxsbqMzjH7eNg-m4oYBsAolcYDR8eClK4FqkANWX0m2dGhWsHsqKyxeUnkUsSZHS3PaBM2KeToBmQFPLpqPWPEfu2MnQmBSqw3kuCOhcwA2nK9r6iFF_988JzKN8YpWlg1EOy-xM"/>
                Google
              </button>
              <button className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2a1f33] py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined text-lg">brand_awareness</span>
                SSO
              </button>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-primary/5 px-8 py-5 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Don't have an account? <Link className="font-bold text-primary hover:underline" to="/register">Sign up</Link>
            </p>
          </div>
        </div>
        <footer className="mt-12 flex gap-6 text-xs font-medium text-slate-500 dark:text-slate-500">
          <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
          <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-primary transition-colors" href="#">Help Center</a>
        </footer>
      </div>
      <div className="pointer-events-none fixed -left-24 -top-24 h-96 w-96 rounded-full bg-primary/10 blur-[100px]"></div>
      <div className="pointer-events-none fixed -bottom-24 -right-24 h-96 w-96 rounded-full bg-purple-600/10 blur-[100px]"></div>
    </div>
  );
};

export default Login;
