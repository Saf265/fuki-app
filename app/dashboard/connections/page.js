"use client";

import {
  AlertTriangle,
  ExternalLink,
  Link2,
  Loader2,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sidebar } from "../page";

export default function Connections() {
  const [accounts, setAccounts] = useState({ vinted: [], ebay: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);

  const openModal = (platform) => {
    setCurrentPlatform(platform);
    setIsModalOpen(true);
    setIsConnecting(false);
    setIsPolling(false);
  };

  const closeModal = () => {
    if (isConnecting || isPolling) return;
    setIsModalOpen(false);
  };

  const handleVintedConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch("/api/vinted/sync-token?domain=vinted.com");
      if (!res.ok) throw new Error("Token generation failed");
      const { token } = await res.json();
      window.open(`https://www.vinted.com/?utm_id=${token}`, "_blank");
      setIsConnecting(false);
      setIsPolling(true);
      setPollCount(0);
      toast.success("Vinted ouvert — connectez-vous puis revenez ici.");
    } catch (err) {
      setIsConnecting(false);
      toast.error("Impossible de générer le token. Réessayez.");
    }
  };

  const handleEbayConnect = () => {
    setIsConnecting(true);
    window.location.href = "/api/ebay/login";
  };

  const fetchAccounts = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch("/api/connections");
      if (res.ok) {
        const data = await res.json();
        if (data.connections) {
          setAccounts(data.connections);
          return data.connections;
        }
      }
    } catch (err) {
      console.error("Failed to fetch connections", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
    return null;
  };

  useEffect(() => { fetchAccounts(); }, []);

  useEffect(() => {
    let interval;
    if (isPolling) {
      const initialCount = accounts.vinted.length;
      interval = setInterval(async () => {
        setPollCount((prev) => prev + 1);
        const newAccounts = await fetchAccounts(true);
        if (newAccounts && newAccounts.vinted.length > initialCount) {
          setIsPolling(false);
          setIsModalOpen(false);
          toast.success("Compte Vinted connecté !");
          clearInterval(interval);
        }
        if (pollCount > 40) {
          setIsPolling(false);
          toast.error("Délai dépassé. Réessayez.");
          clearInterval(interval);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPolling, accounts.vinted.length, pollCount]);

  const removeAccount = (account) => {
    setAccountToDelete(account);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!accountToDelete) return;
    try {
      const res = await fetch(`/api/connections?id=${accountToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setAccounts((prev) => ({
          ...prev,
          [accountToDelete.platform]: prev[accountToDelete.platform].filter((a) => a.id !== accountToDelete.id),
        }));
        toast.success("Compte déconnecté");
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleteModalOpen(false);
      setAccountToDelete(null);
    }
  };

  const totalAccounts = accounts.vinted.length + accounts.ebay.length;

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar active="connections" />

      <main
        className="flex-1 transition-[margin-left] duration-200 ease-in-out"
        style={{ marginLeft: "var(--sidebar-w, 16rem)" }}
      >
        <div className="px-10 pt-10 pb-8 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Link2 size={14} className="text-primary" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Connexions</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-10">Gérez vos comptes marchands Vinted et eBay.</p>
        </div>

        <div className="p-10">
          <div className="flex items-center gap-5 mb-8 px-5 py-4 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-2.5 text-sm">
              <div className={`w-2 h-2 rounded-full ${totalAccounts > 0 ? "bg-primary" : "bg-muted-foreground/30"}`} />
              <span className="font-semibold text-foreground">{totalAccounts}</span>
              <span className="text-muted-foreground">compte{totalAccounts !== 1 ? "s" : ""} connecté{totalAccounts !== 1 ? "s" : ""}</span>
            </div>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ShoppingBag size={13} className="text-primary" />
                <span className="font-medium text-foreground">{accounts.vinted.length}</span> Vinted
              </span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Store size={13} className="text-primary" />
                <span className="font-medium text-foreground">{accounts.ebay.length}</span> eBay
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PlatformSection
              platform="vinted"
              label="Vinted"
              icon={<ShoppingBag size={18} />}
              description="Vendez vos articles sur Vinted"
              accounts={accounts.vinted}
              onAdd={() => openModal("vinted")}
              onRemove={(id) => removeAccount({ id, platform: "vinted" })}
            />
            <PlatformSection
              platform="ebay"
              label="eBay"
              icon={<Store size={18} />}
              description="Vendez vos articles sur eBay"
              accounts={accounts.ebay}
              onAdd={() => openModal("ebay")}
              onRemove={(id) => removeAccount({ id, platform: "ebay" })}
            />
          </div>
        </div>
      </main>

      {/* Connect modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-7 py-6 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  {currentPlatform === "vinted" ? <ShoppingBag size={20} /> : <Store size={20} />}
                </div>
                <div>
                  <p className="font-semibold">
                    Connecter {currentPlatform === "vinted" ? "Vinted" : "eBay"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentPlatform === "vinted" ? "Via l'extension Fuki" : "Connexion sécurisée en quelques secondes"}
                  </p>
                </div>
              </div>
              {!isConnecting && !isPolling && (
                <button onClick={closeModal} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              {isPolling ? (
                <div className="flex flex-col items-center text-center py-4 gap-5">
                  <div className="w-12 h-12 rounded-full border-2 border-primary/20 flex items-center justify-center">
                    <Loader2 size={22} className="text-primary animate-spin" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">En attente de connexion</p>
                    <p className="text-xs text-muted-foreground mt-1">Connectez-vous sur Vinted dans l'onglet ouvert, puis revenez ici.</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-500 rounded-full"
                      style={{ width: `${Math.min(100, (pollCount / 40) * 100)}%` }}
                    />
                  </div>
                  <button
                    onClick={() => { setIsPolling(false); setIsModalOpen(false); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">
                    {currentPlatform === "vinted"
                      ? "Cliquez sur le bouton ci-dessous. Vinted s'ouvrira dans un nouvel onglet — connectez-vous et l'extension Fuki fera le reste."
                      : "Vous allez être redirigé vers eBay pour autoriser l'accès à votre compte."}
                  </p>

                  {currentPlatform === "vinted" ? (
                    <button
                      onClick={handleVintedConnect}
                      disabled={isConnecting}
                      className="mt-2 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-60"
                    >
                      {isConnecting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          <ExternalLink size={15} />
                          Ouvrir Vinted
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleEbayConnect}
                      disabled={isConnecting}
                      className="mt-2 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-60"
                    >
                      {isConnecting ? <Loader2 size={16} className="animate-spin" /> : "Continuer sur eBay"}
                    </button>
                  )}

                  <button onClick={closeModal} className="text-xs text-center text-muted-foreground hover:text-foreground transition-colors py-1">
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-xs rounded-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle size={15} className="text-red-500" />
              </div>
              <p className="text-sm font-semibold">Déconnecter le compte ?</p>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-muted-foreground mb-5">
                Le compte <span className="font-medium text-foreground">{accountToDelete?.platform}</span> sera supprimé définitivement.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={confirmDelete}
                  className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-lg transition-colors"
                >
                  Confirmer
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlatformSection({ label, icon, description, accounts, onAdd, onRemove }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <div>
            <p className="font-semibold text-sm">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={13} /> Ajouter
        </button>
      </div>
      <div>
        {accounts.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Aucun compte connecté
          </div>
        ) : (
          <ul>
            {accounts.map((account) => (
              <li key={account.id} className="flex items-center justify-between px-6 py-4 border-b border-border last:border-0 group hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-border overflow-hidden shrink-0">
                    <img
                      src={label.toLowerCase() === "vinted" ? "/vinted.jpeg" : "/ebay.png"}
                      className="w-full h-full object-cover"
                      alt={label}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{account.username}</p>
                    <p className="text-xs text-muted-foreground">Connecté le {account.connectedAt}</p>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(account.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
