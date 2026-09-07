import React, { useState } from 'react';
import { ShieldCheck, Lock, Fingerprint, ChevronRight } from 'lucide-react';
import { ROLES } from '../utils';

export default function Login({ onLogin, isDarkMode }) {
  const [selectedRole, setSelectedRole] = useState('collector');
  const [email, setEmail] = useState('collector.indore@nic.in');
  const [password, setPassword] = useState('GovTech@2026');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsAuthenticating(true);
    // Simulate network delay and 2FA
    setTimeout(() => {
      onLogin(selectedRole);
    }, 1500);
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      {/* Government Header */}
      <div className="bg-slate-900 border-b-4 border-[#FF9933] px-8 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
            <ShieldCheck size={24} className="text-[#138808]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Jan Parichay</h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">National Single Sign-On (NSSO)</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 font-mono">
          <Lock size={14} className="text-emerald-400" /> 256-bit AES Encrypted
        </div>
      </div>

      {/* Login Box */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
          
          <div className="px-8 py-10">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shadow-inner">
                <Fingerprint size={32} strokeWidth={1.5} />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">LA-EWS Portal Access</h2>
            <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-8">
              Authenticate using your official government credentials.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                  Official Email Address
                </label>
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gov.in or name@nic.in"
                  disabled={isAuthenticating}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                  Password
                </label>
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isAuthenticating}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                  Prototype Role Selection
                </label>
                <div className="relative">
                  <select 
                    value={selectedRole} 
                    onChange={(e) => setSelectedRole(e.target.value)}
                    disabled={isAuthenticating}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none disabled:opacity-50 transition-colors"
                  >
                    {Object.entries(ROLES).map(([key, role]) => (
                      <option key={key} value={key}>{role.label}</option>
                    ))}
                  </select>
                  <ChevronRight size={16} className="absolute right-4 top-3.5 text-slate-400 pointer-events-none rotate-90" />
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  Simulating active directory lookup for {ROLES[selectedRole].label}
                </p>
              </div>

              <button 
                type="submit" 
                disabled={isAuthenticating}
                className="w-full relative bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md disabled:opacity-70 transition-all overflow-hidden flex justify-center items-center gap-2"
              >
                {isAuthenticating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Authenticating via NIC...
                  </>
                ) : (
                  <>
                    Sign In Securely
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 px-8 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-center items-center text-xs text-slate-500">
            <span>Ministry of Rural Development</span>
          </div>
        </div>
      </div>
    </div>
  );
}
