'use client';

import { useState } from 'react';
import {
  ShoppingBag,
  Store,
  Plus,
  User,
  Globe,
  ExternalLink,
  Loader2,
  CheckCircle2,
  X,
  Trash2
} from 'lucide-react';
import { Sidebar } from '../page';
import { useRouter } from 'next/navigation';

export default function Connections() {
  const router = useRouter();
  const [accounts, setAccounts] = useState({
    vinted: [],
    ebay: []
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const openModal = (platform) => {
    setCurrentPlatform(platform);
    setIsModalOpen(true);
  };

  const handleEbayConnect = async () => {
    setIsConnecting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setAccounts(prev => ({
      ...prev,
      ebay: [...prev.ebay, {
        id: Date.now(),
        username: 'eBaySeller_' + Math.floor(Math.random() * 1000),
        connectedAt: new Date().toLocaleDateString('fr-FR')
      }]
    }));
    setIsConnecting(false);
    setIsModalOpen(false);
  };

  const removeAccount = (platform, id) => {
    setAccounts(prev => ({
      ...prev,
      [platform]: prev[platform].filter(a => a.id !== id)
    }));
  };

  const totalAccounts = accounts.vinted.length + accounts.ebay.length;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <Sidebar active="connections" />

      {/* Main Content */}
      <main className="flex-1 ml-64 p-10">
        <header className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 border-l-4 border-emerald-500 pl-4">
            Connexions
          </h1>
          <p className="text-gray-500 mt-1 pl-4">
            Gérez vos comptes marchands Vinted et eBay.
          </p>
        </header>

        {/* Summary bar */}
        <div className="flex items-center gap-4 mb-8 p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${totalAccounts > 0 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            <span className="font-semibold">{totalAccounts}</span>
            <span className="text-gray-500">compte{totalAccounts !== 1 ? 's' : ''} connecté{totalAccounts !== 1 ? 's' : ''}</span>
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <ShoppingBag size={14} />
            <span>{accounts.vinted.length} Vinted</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Store size={14} />
            <span>{accounts.ebay.length} eBay</span>
          </div>
        </div>

        {/* Platform sections */}
        <div className="space-y-6">
          <PlatformSection
            platform="vinted"
            label="Vinted"
            icon={<ShoppingBag size={20} />}
            description="Connexion via l'extension Chrome Fuki."
            accounts={accounts.vinted}
            onAdd={() => openModal('vinted')}
            onRemove={(id) => removeAccount('vinted', id)}
          />

          <PlatformSection
            platform="ebay"
            label="eBay"
            icon={<Store size={20} />}
            description="Connexion via eBay OAuth2."
            accounts={accounts.ebay}
            onAdd={() => openModal('ebay')}
            onRemove={(id) => removeAccount('ebay', id)}
          />
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 w-full max-w-md rounded-xl p-8 shadow-2xl relative">
            <button
              onClick={() => !isConnecting && setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 mb-4">
                {currentPlatform === 'vinted' ? <ShoppingBag size={20} /> : <Store size={20} />}
              </div>
              <h3 className="text-lg font-bold">
                Connecter {currentPlatform === 'vinted' ? 'Vinted' : 'eBay'}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {currentPlatform === 'vinted'
                  ? "L'extension Chrome est requise pour synchroniser Vinted."
                  : "Connexion sécurisée via le protocole OAuth2 eBay."}
              </p>
            </div>

            {currentPlatform === 'vinted' ? (
              <div className="space-y-5">
                <ol className="space-y-3 text-sm">
                  {[
                    "Installez l'extension Fuki sur Chrome",
                    "Connectez-vous à Vinted dans l'extension",
                    "Votre compte apparaîtra ici automatiquement"
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 w-5 h-5 bg-emerald-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-gray-600">{step}</span>
                    </li>
                  ))}
                </ol>
                <a
                  href="#"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Globe size={16} />
                  Installer l'extension Chrome
                  <ExternalLink size={14} className="opacity-50" />
                </a>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-gray-600">
                  <CheckCircle2 size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p>Vous allez être redirigé vers <strong>eBay.fr</strong> pour autoriser l'accès à vos annonces.</p>
                </div>
                <button
                  onClick={handleEbayConnect}
                  disabled={isConnecting}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white w-full py-3 flex items-center justify-center gap-2 text-sm font-bold rounded-md transition-colors disabled:opacity-50"
                >
                  {isConnecting ? (
                    <><Loader2 size={16} className="animate-spin" /> Connexion...</>
                  ) : (
                    <>Se connecter avec eBay</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PlatformSection({ platform, label, icon, description, accounts, onAdd, onRemove }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-emerald-600">{icon}</span>
          <div>
            <h3 className="font-bold text-gray-900">{label}</h3>
            <p className="text-xs text-gray-400">{description}</p>
          </div>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 border border-gray-200 rounded-md hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all"
        >
          <Plus size={14} />
          Ajouter
        </button>
      </div>

      {/* Account list */}
      {accounts.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-gray-400">Aucun compte {label} connecté.</p>
          <button
            onClick={onAdd}
            className="mt-3 text-xs text-emerald-600 font-bold hover:underline"
          >
            + Connecter un compte
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {accounts.map(account => (
            <li key={account.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <User size={14} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{account.username}</p>
                  {account.connectedAt && (
                    <p className="text-[11px] text-gray-400">Connecté le {account.connectedAt}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Actif
                </span>
                <button
                  onClick={() => onRemove(account.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
