import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HistoryIcon,
  LogOutIcon,
  PillIcon,
  MenuIcon,
  PackageIcon,
  BoxesIcon,
  UsersIcon
} from 'lucide-react';
import { Button } from './ui/Button';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, username, role, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // RBAC Navigation: Cashiers and Admins have Products/POS & Customer Credit. Admins additionally have Sales History & Stock Movements.
  const navItems = [
    {
      label: 'Products & POS',
      path: '/',
      icon: PackageIcon
    },
    {
      label: 'Customer Credit',
      path: '/credit',
      icon: UsersIcon
    },
    ...(isAdmin
      ? [
          {
            label: 'Sales History',
            path: '/sales',
            icon: HistoryIcon
          },
          {
            label: 'Stock Movements',
            path: '/stock',
            icon: BoxesIcon
          }
        ]
      : [])
  ];

  const displayName =
    user?.first_name || user?.username || username || 'User';
  const roleDisplay = role === 'ADMIN' ? 'Admin' : 'Cashier';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
            <PillIcon className="h-6 w-6 text-emerald-500 mr-3" />
            <div>
              <h1 className="font-bold text-lg tracking-tight">Mediflex</h1>
              <p className="text-xs text-slate-400">Pharmacy POS</p>
            </div>
          </div>

          {/* Role indication chip in sidebar */}
          <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-850 flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Access Level</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                isAdmin
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
              {roleDisplay}
            </span>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}>
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User & Logout */}
          <div className="p-4 border-t border-slate-800 bg-slate-950">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center min-w-0">
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                    isAdmin
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                      : 'bg-blue-950 text-blue-300 border border-blue-700/50'
                  }`}>
                  {displayName.substring(0, 2).toUpperCase()}
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{displayName}</p>
                  <p className="text-xs text-slate-400">{roleDisplay}</p>
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-slate-900 border-slate-800"
              onClick={handleLogout}>
              <LogOutIcon className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between">
          <div className="flex items-center">
            <PillIcon className="h-6 w-6 text-emerald-600 mr-2" />
            <span className="font-bold text-slate-900">Mediflex</span>
            <span
              className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                isAdmin
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
              {roleDisplay}
            </span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-md">
            <MenuIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>

        <footer className="px-4 py-3 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
          Made by{' '}
          <a
            href="https://www.devrious.lk/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
            Devrious
          </a>
        </footer>
      </div>

      {/* Overlay for mobile sidebar */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}