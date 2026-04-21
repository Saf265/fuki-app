"use client";

import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertCircle, MessageSquare, RefreshCw, ShoppingBag } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "../page";

export default function Messages() {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const fetchConversations = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const res = await fetch("/api/messages?page=1&per_page=20");
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();

      setAccounts(data.accounts ?? []);
      if (data.accounts?.length > 0 && !selectedAccount) {
        setSelectedAccount(data.accounts[0].accountId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedAccount]);

  useEffect(() => { fetchConversations(); }, []);

  const allConversations = accounts
    .find((a) => a.accountId === selectedAccount)
    ?.conversations ?? [];

  const totalUnread = allConversations.filter((c) => c.unread).length;

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar active="messages" />

      <main
        className="flex-1 flex flex-col transition-[margin-left] duration-200 ease-in-out"
        style={{ marginLeft: "var(--sidebar-w, 16rem)" }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare size={14} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Messagerie</h1>
              {!isLoading && totalUnread > 0 && (
                <p className="text-xs text-muted-foreground">{totalUnread} non lu{totalUnread > 1 ? "s" : ""}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => fetchConversations(true)}
            disabled={isRefreshing}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-40"
            title="Actualiser"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Account tabs — si plusieurs comptes Vinted */}
        {accounts.length > 1 && (
          <div className="flex gap-1 px-8 pt-4 border-b border-border pb-0">
            {accounts.map((account) => (
              <button
                key={account.accountId}
                onClick={() => setSelectedAccount(account.accountId)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${selectedAccount === account.accountId
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                <ShoppingBag size={13} />
                {account.username}
                {account.conversations.filter((c) => c.unread).length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                    {account.conversations.filter((c) => c.unread).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <ConversationsSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={() => fetchConversations()} />
          ) : allConversations.length === 0 ? (
            <EmptyState hasAccounts={accounts.length > 0} />
          ) : (
            <ul className="divide-y divide-border">
              {allConversations.map((conv) => (
                <ConversationRow key={conv.conv_id} conv={conv} />
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

function ConversationRow({ conv }) {
  const timeAgo = conv.last_update
    ? formatDistanceToNow(new Date(conv.last_update), { addSuffix: true, locale: fr })
    : null;

  return (
    <li className={`flex items-center gap-4 px-8 py-4 hover:bg-muted/30 transition-colors cursor-pointer ${conv.unread ? "bg-primary/[0.03]" : ""}`}>
      {/* Item photo */}
      <div className="w-12 h-12 rounded-xl border border-border overflow-hidden shrink-0 bg-muted">
        {conv.item_full_size_url ? (
          <img src={conv.item_full_size_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={16} className="text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={`text-sm truncate ${conv.unread ? "font-semibold" : "font-medium"}`}>
            {conv.opposite_user_name}
          </span>
          {timeAgo && (
            <span className="text-xs text-muted-foreground shrink-0">{timeAgo}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{conv.description || "Aucun message"}</p>
      </div>

      {/* Unread dot */}
      {conv.unread && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
      )}
    </li>
  );
}

function ConversationsSkeleton() {
  return (
    <ul className="divide-y divide-border">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 px-8 py-4">
          <div className="w-12 h-12 rounded-xl bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-muted animate-pulse rounded w-1/3" />
            <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ hasAccounts }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center mb-4">
        <MessageSquare size={22} className="text-muted-foreground" />
      </div>
      <p className="font-medium text-sm">
        {hasAccounts ? "Aucune conversation" : "Aucun compte Vinted connecté"}
      </p>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs">
        {hasAccounts
          ? "Vos conversations Vinted apparaîtront ici."
          : "Connectez un compte Vinted depuis la page Connexions."}
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <AlertCircle size={22} className="text-red-500" />
      </div>
      <p className="font-medium text-sm">Impossible de charger les conversations</p>
      <p className="text-xs text-muted-foreground mt-1 mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="text-xs font-medium text-primary hover:underline"
      >
        Réessayer
      </button>
    </div>
  );
}
