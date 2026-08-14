import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, PageRoute, AppBranding, DEFAULT_BRANDING } from '../types';
import { Search, Sun, Moon, User, Settings, HelpCircle, LogOut, Shield, ChevronDown } from 'lucide-react';
import { AppLogo } from './AppLogo';

interface NavbarProps {
  user: UserProfile;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onLogout: () => void;
  onNavigate: (route: PageRoute) => void;
  isAdminView?: boolean;
  onToggleAdminView?: () => void;
  branding?: AppBranding;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  darkMode,
  onToggleDarkMode,
  searchQuery,
  onSearchChange,
  onOpenSettings,
  onOpenHelp,
  onLogout,
  isAdminView = false,
  onToggleAdminView,
  branding = DEFAULT_BRANDING,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-olive-sage/20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Branding */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <AppLogo branding={branding} />
          <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-olive-light dark:bg-slate-800 text-olive-dark dark:text-olive-sage border border-olive-sage/30 hidden lg:inline-block">
            Vault Cloud
          </span>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-xl mx-1 sm:mx-6 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 sm:left-3.5 text-olive-sage" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search vault..."
              className="w-full min-w-0 bg-white/80 dark:bg-slate-800/80 border border-olive-sage/30 rounded-full py-1.5 sm:py-2 pl-8 sm:pl-10 pr-8 sm:pr-10 text-xs sm:text-sm text-slate-900 dark:text-cream placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-olive-primary focus:border-transparent transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-2 sm:top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Dark / Light Switcher */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 sm:p-2.5 rounded-xl border border-olive-sage/30 bg-cream/60 dark:bg-slate-800/60 text-slate-700 dark:text-cream hover:bg-olive-light dark:hover:bg-slate-700 transition-colors shadow-sm"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun size={16} className="text-amber-400 sm:w-[18px] sm:h-[18px]" /> : <Moon size={16} className="text-olive-dark sm:w-[18px] sm:h-[18px]" />}
          </button>

          {/* User Profile Dropdown Container */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2.5 p-1 pr-1.5 sm:p-1.5 sm:pr-2.5 rounded-full border border-olive-sage/30 bg-white/80 dark:bg-slate-800/80 hover:border-olive-primary transition-all shadow-sm group"
              aria-label="User profile menu"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-olive-primary text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                {user.name.charAt(0)}
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-cream hidden md:block max-w-[110px] truncate">
                {user.name}
              </span>
              <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Menu with SOLID OPAQUE BACKGROUND as requested in PRD Section 3 */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl bg-white dark:bg-[#1E241E] border border-olive-sage/30 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-slate-800 dark:text-cream">
                {/* Profile Summary Header */}
                <div className="p-3 border-b border-olive-sage/20 mb-1">
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
                    <Shield size={12} />
                    <span>256-bit AES Encrypted</span>
                  </div>
                </div>

                {/* Options List */}
                <div className="space-y-0.5 text-xs font-medium">
                  {user.role === 'Admin' && onToggleAdminView && (
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onToggleAdminView();
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 flex items-center gap-2.5 transition-colors border border-amber-500/20 mb-1.5 font-bold"
                    >
                      <Shield size={16} className="text-amber-600 dark:text-amber-400 animate-pulse" />
                      <span>{isAdminView ? 'Go to Personal Vault' : 'Admin Dashboard'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-olive-light/60 dark:hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors"
                  >
                    <Settings size={16} className="text-olive-primary dark:text-olive-sage" />
                    <span>Account Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenHelp();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-olive-light/60 dark:hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors"
                  >
                    <HelpCircle size={16} className="text-olive-primary dark:text-olive-sage" />
                    <span>Help & Support</span>
                  </button>

                  <div className="my-1 border-t border-olive-sage/20" />

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center gap-2.5 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Secure Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
