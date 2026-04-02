'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  Store, 
  Plus, 
  Settings, 
  LayoutDashboard, 
  History, 
  Link2,
  User,
  LogOut,
  ArrowRight
} from 'lucide-react';
import { authClient, useSession } from '@/src/lib/auth-client';

export default function Dashboard() {
  const totalAccounts = 0; // will be pulled from context/db later

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Sidebar active="dashboard" />

      <main className="flex-1 ml-64 p-10">
        <header className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 border-l-4 border-emerald-500 pl-4">
            Tableau de bord
          </h1>
          <p className="text-gray-500 mt-1 pl-4">
            Bienvenue sur Fuki Automation.
          </p>
        </header>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <StatCard label="Comptes connectés" value="0" icon={<Link2 size={18} />} />
          <StatCard label="Posts automatisés" value="0" icon={<Store size={18} />} />
          <StatCard label="Articles en ligne" value="0" icon={<ShoppingBag size={18} />} />
        </div>

        {/* CTA block */}
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

  const links = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={18} />, href: '/dashboard' },
    { id: 'connections', label: 'Connexions', icon: <Link2 size={18} />, href: '/dashboard/connections' },
    { id: 'history', label: 'Historique', icon: <History size={18} />, href: '/dashboard/history' },
    { id: 'settings', label: 'Paramètres', icon: <Settings size={18} />, href: '/dashboard/settings' },
  ];

  async function handleSignOut() {
    await authClient.signOut();
    router.push('/login');
  }

  const avatarInitial = user?.name?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase() ?? '?';

  return (
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col fixed h-full shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-white font-black">
            F
          </div>
          <span className="font-bold text-lg tracking-tight">
            Fuki <span className="text-emerald-500">Auto</span>
          </span>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {links.map(link => (
          <a
            key={link.id}
            href={link.href}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm transition-all relative ${
              active === link.id
                ? 'bg-emerald-50 text-emerald-700 font-bold'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {active === link.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full" />
            )}
            {link.icon}
            <span>{link.label}</span>
          </a>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0 overflow-hidden">
            {user?.image ? (
              <img src={user.image} alt={user.name ?? 'User'} className="w-full h-full object-cover" />
            ) : (
              avatarInitial
            )}
          </div>
          {/* Info */}
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-semibold truncate leading-none mb-0.5 text-gray-900">
              {user?.name ?? 'Utilisateur'}
            </p>
            <p className="text-[10px] text-gray-400 truncate">{user?.email ?? '—'}</p>
          </div>
          {/* Sign out */}
          <button
            onClick={handleSignOut}
            title="Se déconnecter"
            className="p-1.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

