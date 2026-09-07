import React, { useRef, useEffect, useState } from 'react';
import { Search, Clock, UserCircle, Layers, Sun, Moon, Mic } from 'lucide-react';
import { ROLES } from '../utils';

export default function HeaderNav({
  isDarkMode = false,
  setIsDarkMode = () => {},
  activeView = 'dashboard',
  setActiveView = () => {},
  activeRole = 'central',
  setActiveRole = () => {},
  searchQuery = '',
  setSearchQuery = () => {},
  time = new Date(),
}) {
  const searchInputRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [translateText, setTranslateText] = useState('');

  // Keyboard shortcut: CMD+K or CTRL+K focuses search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMicClick = () => {
    setIsListening(true);
    setSearchQuery('');
    setTranslateText('Listening...');
    
    setTimeout(() => {
      setTranslateText('Translating Marathi...');
      setTimeout(() => {
        setIsListening(false);
        setTranslateText('');
        setSearchQuery('Wardha'); // Simulating "Show delayed projects in Wardha"
      }, 1000);
    }, 1500);
  };

  const formattedTime = (() => {
    try {
      const dateObj = time instanceof Date ? time : new Date(time || Date.now());
      return `${dateObj.toLocaleTimeString('en-IN', { hour12: false })} IST`;
    } catch {
      return '00:00:00 IST';
    }
  })();

  return (
    <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 shadow-sm transition-colors duration-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* LEFT SECTION */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="bg-indigo-50 dark:bg-indigo-500/10 p-2.5 rounded-lg text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/30 shadow-xs">
          <Layers className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              LA-EWS
            </h1>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-normal">
              | Land Acquisition Early Warning System
            </span>
          </div>
          <p className="text-xs uppercase font-medium tracking-wider text-slate-500 dark:text-slate-400">
            MINISTRY OF RURAL DEVELOPMENT • PM GATI SHAKTI
          </p>
        </div>
      </div>

      {/* CENTER SECTION: Search Bar */}
      <div className="flex-1 max-w-md w-full mx-auto md:mx-4">
        <div className={`relative flex items-center w-full transition-all rounded-lg border focus-within:ring-2 focus-within:ring-indigo-500 ${isListening ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'}`}>
          <Search className={`absolute left-3.5 w-4 h-4 ${isListening ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-500'}`} />
          <input
            ref={searchInputRef}
            type="text"
            value={isListening ? '' : searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isListening}
            placeholder={isListening ? translateText : "Search by project name or ULPIN..."}
            className={`w-full pl-10 pr-24 py-1.5 text-sm bg-transparent text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all duration-200 ${isListening ? 'placeholder:text-indigo-600 dark:placeholder:text-indigo-400 placeholder:animate-pulse' : ''}`}
          />
          <div className="absolute right-2 flex items-center gap-1.5">
            <button 
              onClick={handleMicClick}
              className={`p-1 rounded-md transition-colors ${isListening ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 animate-pulse' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-500'}`}
              title="Bhashini Voice Search"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xs">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION: Controls & User Context */}
      <div className="flex items-center gap-4 shrink-0 flex-wrap justify-end">
        {/* Live Clock Display */}
        <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-xs">
          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span>{formattedTime}</span>
        </div>

        {/* View Toggle Pills */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
              activeView === 'dashboard'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveView('admin')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
              activeView === 'admin'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Admin Ingest
          </button>
        </div>

        {/* Role Switcher */}
        <div className="relative flex items-center">
          <UserCircle className="absolute left-2.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <select
            value={activeRole}
            onChange={(e) => setActiveRole(e.target.value)}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 pl-8 pr-7 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 cursor-pointer shadow-xs transition-all duration-200"
          >
            {Object.entries(ROLES || {}).map(([key, role]) => (
              <option key={key} value={key} className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
