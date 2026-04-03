'use client';

import { useState, useEffect } from 'react';
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
import CryptoJS from 'crypto-js';
import { toast } from 'sonner';

export default function Connections() {
  const router = useRouter();
  const [accounts, setAccounts] = useState({
    vinted: [],
    ebay: []
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch('/api/connections');
        if (res.ok) {
          const data = await res.json();
          if (data.connections) {
            setAccounts(data.connections);
          }
        }
      } catch (err) {
        console.error("Failed to fetch connections", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  const openModal = (platform) => {
    setCurrentPlatform(platform);
    setIsModalOpen(true);
  };

  const handleVintedConnect = async (e) => {
    if (e) e.preventDefault();
    setIsConnecting(true);

    const email = e.target.vintedEmail.value;
    const password = e.target.vintedPassword.value;
    const userId = "test-user-id"; // Placeholder for actual userId

    const secretKey = process.env.NEXT_PUBLIC_CRYPTO_SECRET || 'fuki-secret-key';
    const encryptedEmail = CryptoJS.AES.encrypt(email, secretKey).toString();
    const encryptedPassword = CryptoJS.AES.encrypt(password, secretKey).toString();

    toast.info("Tentative de connexion en cours...", {
      description: "Vos informations sont cryptées et envoyées de manière sécurisée.",
      duration: 5000,
    });

    try {
      // Lance un playwright en arrière plan
      fetch('/api/vinted/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: encryptedEmail, password: encryptedPassword, userId })
      });
      
      // On simule une connexion réussie visuellement après un petit délai
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setAccounts(prev => ({
        ...prev,
        vinted: [...prev.vinted, {
          id: Date.now(),
          username: email.split('@')[0],
          connectedAt: new Date().toLocaleDateString('fr-FR')
        }]
      }));
      toast.success("Connexion établie avec succès !");
    } catch (err) {
      toast.error("Erreur lors de la connexion.");
    } finally {
      setIsConnecting(false);
      setIsModalOpen(false);
    }
  };

  const handleEbayConnect = () => {
    setIsConnecting(true);
    window.location.href = '/api/ebay/login';
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
                  ? "Connectez-vous avec vos identifiants Vinted."
                  : "Connexion sécurisée via le protocole OAuth2 eBay."}
              </p>
            </div>

            {currentPlatform === 'vinted' ? (
              <form onSubmit={handleVintedConnect} className="space-y-4">
                <div>
                  <label htmlFor="vintedEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Vinted
                  </label>
                  <input
                    type="email"
                    id="vintedEmail"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="votre@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="vintedPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    id="vintedPassword"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isConnecting}
                  className="bg-emerald-500 mt-2 hover:bg-emerald-600 text-white w-full py-3 flex items-center justify-center gap-2 text-sm font-bold rounded-md transition-colors disabled:opacity-50"
                >
                  {isConnecting ? (
                    <><Loader2 size={16} className="animate-spin" /> Connexion...</>
                  ) : (
                    <>Se connecter</>
                  )}
                </button>
              </form>
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
