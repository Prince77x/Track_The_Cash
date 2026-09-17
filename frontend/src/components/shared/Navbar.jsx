import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Activity, Radio, LogOut, Terminal, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';

export const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-lea-900/90 backdrop-blur-md border-b border-lea-700/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Badge */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
              <Shield className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-wider text-white">
                  TRACK<span className="text-sky-400">THE</span>CASH
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                  NAT-FININT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Atm Anomaly Surveillance & Money Mule Interception System
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <Link
              to="/lea"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                location.pathname === '/lea'
                  ? 'bg-blue-600/20 text-sky-400 border border-blue-500/40'
                  : 'text-slate-300 hover:bg-lea-800 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4 text-sky-400" />
              <span>LEA Surveillance</span>
            </Link>

            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  location.pathname === '/admin'
                    ? 'bg-blue-600/20 text-sky-400 border border-blue-500/40'
                    : 'text-slate-300 hover:bg-lea-800 hover:text-white'
                }`}
              >
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>Admin Center</span>
              </Link>
            )}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-3">
            {/* Live Feed Pill */}
            <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span className="font-mono text-[11px]">TELEMETRY ACTIVE</span>
            </div>

            {user && (
              <div className="flex items-center space-x-3 pl-2 border-l border-lea-700/60">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-white">{user.name}</div>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-end space-x-1">
                    <Lock className="w-2.5 h-2.5 text-slate-500" />
                    <span>{user.badgeNumber}</span>
                  </div>
                </div>
                
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                  user.role === 'admin' 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                    : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                }`}>
                  {user.role}
                </span>

                <button
                  onClick={handleLogout}
                  title="Sign Out of Terminal"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors border border-transparent hover:border-rose-500/30"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
