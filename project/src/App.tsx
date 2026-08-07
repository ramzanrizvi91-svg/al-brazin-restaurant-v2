import React, { useState, useEffect } from 'react';
import { Sparkles, ChefHat, User, QrCode, LogOut } from 'lucide-react';
import { MenuItem, Branch, Table } from './types';
import { BRANCHES, TABLES } from './initialData';
import CustomerView from './components/CustomerView';
import DashboardView from './components/DashboardView';
import AdminView from './components/AdminView';
import LoginView from './components/LoginView';

export interface AuthSession {
  username: string;
  role: 'admin' | 'staff';
  branchId: string | null;
  branchName: string;
}

export default function App() {
  const [currentRole, setCurrentRole] = useState<'customer' | 'staff' | 'admin'>('customer');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  // Authentication Session
  const [session, setSession] = useState<AuthSession | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('albrazin_auth_session');
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('albrazin_auth_session');
      }
    }
  }, []);

  const handleLoginSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    localStorage.setItem('albrazin_auth_session', JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('albrazin_auth_session');
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  };

  // Verify the session with the server (source of truth is the httpOnly
  // cookie, not localStorage) so a stale/forged localStorage value can never
  // grant access to staff/admin views.
  useEffect(() => {
    const saved = localStorage.getItem('albrazin_auth_session');
    if (!saved) return;
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((me) => {
        setSession({
          username: me.username,
          role: me.role,
          branchId: me.branchId,
          branchName: me.branchName
        });
      })
      .catch(() => {
        // Cookie missing/expired — clear the stale local copy and force re-login
        localStorage.removeItem('albrazin_auth_session');
        setSession(null);
      });
  }, []);

  // Sync state between query params and roles
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const isStaff = searchParams.get('role') === 'staff';
    const isAdmin = searchParams.get('role') === 'admin';
    const hasTableParams = searchParams.get('branch') && searchParams.get('table');

    if (isStaff) {
      setCurrentRole('staff');
    } else if (isAdmin) {
      setCurrentRole('admin');
    } else if (hasTableParams) {
      setCurrentRole('customer');
    }
  }, []);

  // Fetch menu from our Express backend
  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu');
      if (res.ok) {
        const data = await res.json();
        setMenu(data);
      }
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tables from our Express backend
  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables');
      if (res.ok) {
        const data = await res.json();
        setTables(data);
      }
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchTables();
  }, []);

  // Set URL role when toggled manually
  const handleRoleToggle = (role: 'customer' | 'staff' | 'admin') => {
    setCurrentRole(role);
    const searchParams = new URLSearchParams(window.location.search);
    if (role === 'customer') {
      searchParams.delete('role');
    } else {
      searchParams.set('role', role);
    }
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({}, '', newUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-wide text-neutral-400">Booting Al-Brazin Platform...</p>
      </div>
    );
  }

  // Determine if authentication is required for the current selection
  const needsLogin = (currentRole === 'staff' || currentRole === 'admin') && (
    !session || (currentRole === 'admin' && session.role !== 'admin')
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-amber-500/20 selection:text-amber-300 relative">
      {/* Immersive UI Ambient Glow Background */}
      <div className="absolute inset-0 bg-immersive-radial opacity-35 pointer-events-none z-0" />

      {/* Primary Role Selector Capsule (Floating at bottom center for premium presentation) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/80 hover:bg-neutral-900 border border-white/10 px-3 py-1.5 rounded-full shadow-orange-glow backdrop-blur-md flex items-center space-x-1.5 transition max-w-[95%]">
        <button
          onClick={() => handleRoleToggle('customer')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-black transition cursor-pointer ${
            currentRole === 'customer' 
              ? 'bg-amber-500 text-neutral-950 shadow-md shadow-orange-glow' 
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Guest (QR Table)</span>
          <span className="sm:hidden">Guest</span>
        </button>

        <button
          onClick={() => handleRoleToggle('staff')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-black transition cursor-pointer ${
            currentRole === 'staff' 
              ? 'bg-amber-500 text-neutral-950 shadow-md shadow-orange-glow' 
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ChefHat className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Kitchen (KDS)</span>
          <span className="sm:hidden">Kitchen</span>
        </button>

        <button
          onClick={() => handleRoleToggle('admin')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-black transition cursor-pointer ${
            currentRole === 'admin' 
              ? 'bg-amber-500 text-neutral-950 shadow-md shadow-orange-glow' 
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SaaS Admin</span>
          <span className="sm:hidden">Admin</span>
        </button>

        {/* Floating Logout Button if logged in */}
        {session && (currentRole === 'staff' || currentRole === 'admin') && (
          <button
            onClick={handleLogout}
            title="Sign Out of Portal"
            className="p-1.5 rounded-full bg-red-650 hover:bg-red-600 text-white transition cursor-pointer flex items-center justify-center border border-white/10"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* RENDER VIEW ACCORDING TO STATE */}
      <main className="pb-16 lg:pb-0 relative z-10">
        {currentRole === 'customer' && (
          <CustomerView branches={BRANCHES} menu={menu} />
        )}

        {/* Staff/Kitchen views guarded by Authentication */}
        {currentRole === 'staff' && (
          needsLogin ? (
            <div className="min-h-[85vh] flex items-center justify-center p-4">
              <LoginView onLoginSuccess={handleLoginSuccess} targetRole="staff" />
            </div>
          ) : (
            <DashboardView 
              branches={BRANCHES} 
              session={session} 
              onLogout={handleLogout} 
            />
          )
        )}

        {/* Enterprise SaaS Admin views guarded by Admin Authentication */}
        {currentRole === 'admin' && (
          needsLogin ? (
            <div className="min-h-[85vh] flex items-center justify-center p-4">
              <LoginView onLoginSuccess={handleLoginSuccess} targetRole="admin" />
            </div>
          ) : (
            <AdminView 
              branches={BRANCHES} 
              tables={tables} 
              menu={menu} 
              onMenuUpdated={fetchMenu}
              onTablesUpdated={fetchTables}
              session={session}
              onLogout={handleLogout}
            />
          )
        )}
      </main>
    </div>
  );
}
