"use client";

import {
  AlertTriangle,
  ExternalLink,
  Link2,
  Loader2,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sidebar } from "../page";

export default function Connections() {
  const t = useTranslations("connections");
  const [accounts, setAccounts] = useState({ vinted: [] });
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
      toast.success(t("toast.vinted_opened"));
    } catch (err) {
      setIsConnecting(false);
      toast.error(t("toast.token_error"));
    }
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
          toast.success(t("toast.connected", { platform: "Vinted" }));
          clearInterval(interval);
        }
        if (pollCount > 40) {
          setIsPolling(false);
          toast.error(t("toast.timeout"));
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
        toast.success(t("toast.disconnected"));
      }
    } catch {
      toast.error(t("toast.delete_error"));
    } finally {
      setIsDeleteModalOpen(false);
      setAccountToDelete(null);
    }
  };

  const totalAccounts = accounts.vinted.length;

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
            <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-10">{t("subtitle")}</p>
        </div>

        <div className="p-10">
          <div className="flex items-center gap-5 mb-8 px-5 py-4 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-2.5 text-sm">
              <div className={`w-2 h-2 rounded-full ${totalAccounts > 0 ? "bg-primary" : "bg-muted-foreground/30"}`} />
              <span className="font-semibold text-foreground">{totalAccounts}</span>
              <span className="text-muted-foreground">{totalAccounts !== 1 ? t("accounts_connected_plural") : t("accounts_connected")}</span>
            </div>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ShoppingBag size={13} className="text-primary" />
                <span className="font-medium text-foreground">{accounts.vinted.length}</span> Vinted
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <PlatformSection
              platform="vinted"
              label={t("vinted")}
              icon={<ShoppingBag size={18} />}
              description={t("vinted_desc")}
              accounts={accounts.vinted}
              onAdd={() => openModal("vinted")}
              onRemove={(id) => removeAccount({ id, platform: "vinted" })}
              t={t}
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
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <p className="font-semibold">{t("modal.connect_vinted")}</p>
                  <p className="text-sm text-muted-foreground">{t("modal.vinted_subtitle")}</p>
                </div>
              </div>
              {!isConnecting && !isPolling && (
                <button onClick={closeModal} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="px-7 py-7">
              {isPolling ? (
                <div className="flex flex-col items-center text-center py-6 gap-6">
                  <div className="w-14 h-14 rounded-full border-2 border-primary/20 flex items-center justify-center">
                    <Loader2 size={26} className="text-primary animate-spin" />
                  </div>
                  <div>
                    <p className="font-semibold">{t("modal.waiting")}</p>
                    <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
                      {t("modal.waiting_desc")}
                    </p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-500 rounded-full"
                      style={{ width: `${Math.min(100, (pollCount / 40) * 100)}%` }}
                    />
                  </div>
                  <button
                    onClick={() => { setIsPolling(false); setIsModalOpen(false); }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t("modal.cancel")}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("modal.vinted_desc")}
                  </p>
                  <button
                    onClick={handleVintedConnect}
                    disabled={isConnecting}
                    className="mt-1 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60"
                  >
                    {isConnecting ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <>
                        <ExternalLink size={16} />
                        {t("modal.open_vinted")}
                      </>
                    )}
                  </button>
                  <button onClick={closeModal} className="text-sm text-center text-muted-foreground hover:text-foreground transition-colors py-1">
                    {t("modal.cancel")}
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
          <div className="bg-card border border-border w-full max-w-sm rounded-xl overflow-hidden">
            <div className="px-7 py-6 border-b border-border flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <p className="font-semibold">{t("delete.title")}</p>
                <p className="text-sm text-muted-foreground">{t("delete.subtitle")}</p>
              </div>
            </div>
            <div className="px-7 py-6">
              <p className="text-sm text-muted-foreground mb-6">
                <span className="font-medium text-foreground capitalize">{accountToDelete?.platform}</span> {t("delete.description")}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={confirmDelete}
                  className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
                >
                  {t("delete.confirm")}
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("delete.cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlatformSection({ label, icon, description, accounts, onAdd, onRemove, t }) {
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
          <Plus size={13} /> {t("add")}
        </button>
      </div>
      <div>
        {accounts.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {t("no_accounts")}
          </div>
        ) : (
          <ul>
            {accounts.map((account) => (
              <li key={account.id} className="flex items-center justify-between px-6 py-4 border-b border-border last:border-0 group hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-border overflow-hidden shrink-0">
                    <img
                      src="/vinted.jpeg"
                      className="w-full h-full object-cover"
                      alt={label}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{account.username}</p>
                    <p className="text-xs text-muted-foreground">{t("connected_on")} {account.connectedAt}</p>
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
