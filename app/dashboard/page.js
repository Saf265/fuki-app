'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Store,
  LayoutDashboard,
  Link2,
  LogOut,
  ArrowRight,
  MessageSquare,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { authClient, useSession } from '@/src/lib/auth-client';

export default function Dashboard() {
  const [counts, setCounts] = useState({ vinted: 0, ebay: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch('/api/connections');
        if (res.ok) {
          const data = await res.json();
          const v = data.connections?.vinted?.length || 0;
          const e = data.connections?.ebay?.length || 0;
          setCounts({ vinted: v, ebay: e, total: v + e });
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCounts();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Sidebar active="dashboard" />

      <main
        className="flex-1 p-10 transition-[margin-left] duration-200 ease-in-out"
        style={{ marginLeft: 'var(--sidebar-w, 16rem)' }}
      >
        <header className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 border-l-4 border-emerald-500 pl-4">
            Tableau de bord
          </h1>
          <p className="text-gray-500 mt-1 pl-4">Bienvenue sur Fuki.</p>
        </header>

        <div className="grid grid-cols-3 gap-4 mb-10">
          <StatCard
            label="Comptes connectés"
            value={isLoading ? <Loader2 size={18} className="animate-spin text-emerald-500" /> : counts.total.toString()}
            icon={<Link2 size={18} />}
          />
          <StatCard
            label="eBay connectés"
            value={isLoading ? <Loader2 size={18} className="animate-spin text-emerald-500" /> : counts.ebay.toString()}
            icon={<Store size={18} />}
          />
          <StatCard
            label="Vinted connectés"
            value={isLoading ? <Loader2 size={18} className="animate-spin text-emerald-500" /> : counts.vinted.toString()}
            icon={<ShoppingBag size={18} />}
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold mb-1">Commencer à automatiser</h2>
            <p className="text-sm text-gray-500 max-w-sm">
              Connectez vos comptes Vinted et eBay pour démarrer l'automatisation de vos annonces.
            </p>
          </div>
          <a
            href="/dashboard/connections"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            Connecter un compte
            <ArrowRight size={16} />
          </a>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400">{icon}</span>
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

export function Sidebar({ active }) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const [collapsed, setCollapsed] = useState(false);

  // Restore persisted state on mount
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) {
      const val = stored === 'true';
      setCollapsed(val);
      document.documentElement.style.setProperty('--sidebar-w', val ? '4rem' : '16rem');
    }
  }, []);

  const toggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      document.documentElement.style.setProperty('--sidebar-w', next ? '4rem' : '16rem');
      return next;
    });
  };

  const links = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={18} />, href: '/dashboard' },
    { id: 'messages', label: 'Messagerie', icon: <MessageSquare size={18} />, href: '/dashboard/messages' },
    { id: 'connections', label: 'Connexions', icon: <Link2 size={18} />, href: '/dashboard/connections' },
  ];

  async function handleSignOut() {
    await authClient.signOut();
    router.push('/login');
  }

  const avatarInitial =
    user?.name?.charAt(0).toUpperCase() ??
    user?.email?.charAt(0).toUpperCase() ??
    '?';

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-100 flex flex-col fixed h-full z-40 transition-[width] duration-200 ease-in-out overflow-visible`}
    >
      {/* Floating collapse toggle on edge */}
      <button
        onClick={toggleCollapse}
        title={collapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
        className="absolute -right-3 top-5 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-300 shadow-sm transition-all z-50"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Logo */}
      <div className={`flex items-center h-16 px-4 mb-2 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-base shadow-lg shadow-emerald-500/20 flex-shrink-0 transition-transform hover:rotate-3">
          F
        </div>
        {!collapsed && (
          <span className="ml-3 font-extrabold text-lg tracking-tight text-gray-900 animate-in fade-in slide-in-from-left-2 duration-300">
            Fuki
          </span>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {links.map(link => (
          <a
            key={link.id}
            href={link.href}
            title={collapsed ? link.label : undefined}
            className={`group flex items-center w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 relative
              ${collapsed ? 'justify-center px-0' : 'px-4 gap-3'}
              ${
                active === link.id
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-emerald-600'
              }`}
          >
            <span className={`flex-shrink-0 transition-transform duration-200 ${active !== link.id ? 'group-hover:scale-110 group-hover:text-emerald-500' : ''}`}>
              {link.icon}
            </span>
            {!collapsed && (
              <span className="whitespace-nowrap animate-in fade-in duration-300">
                {link.label}
              </span>
            )}
          </a>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 mt-auto">
        <div className={`flex items-center gap-3 p-2.5 rounded-2xl bg-gray-50/50 border border-transparent hover:border-gray-100 transition-all ${collapsed ? 'justify-center' : ''}`}>
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0 border-2 border-white shadow-sm overflow-hidden">
            {user?.image ? (
              <img src={user.image} alt={user.name ?? 'User'} className="w-full h-full object-cover" />
            ) : (
              avatarInitial
            )}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
              <p className="text-sm font-bold truncate leading-none mb-1 text-gray-900">
                {user?.name ?? 'Utilisateur'}
              </p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email ?? '—'}</p>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={handleSignOut}
              title="Se déconnecter"
              className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0 group"
            >
              <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={handleSignOut}
            title="Se déconnecter"
            className="w-full flex justify-center mt-2 p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
