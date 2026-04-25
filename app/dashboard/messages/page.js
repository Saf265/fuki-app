"use client";

import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertCircle, ChevronLeft, ChevronRight, Image,
  Loader2, MessageSquare, RefreshCw, Send, ShoppingBag, Tag, X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "../page";

const PER_PAGE = 10;

export default function Messages() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedConv, setSelectedConv] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  // page courante par accountId
  const [currentPages, setCurrentPages] = useState({});
  // données paginées par accountId : { [accountId]: { [page]: conv[] } }
  const [pageCache, setPageCache] = useState({});
  const [hasMorePages, setHasMorePages] = useState({});
  // Cache des messages par conversation : { [conv_id]: conversationData }
  const [messagesCache, setMessagesCache] = useState({});

  const fetchPage = useCallback(async (page) => {
    try {
      const res = await fetch(`/api/messages?page=${page}&per_page=${PER_PAGE}`);
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();
      const incoming = data.accounts ?? [];

      setPageCache((prev) => {
        const next = { ...prev };
        incoming.forEach((a) => {
          next[a.accountId] = { ...(prev[a.accountId] ?? {}), [page]: a.conversations };
        });
        return next;
      });

      setHasMorePages((prev) => {
        const next = { ...prev };
        incoming.forEach((a) => { next[a.accountId] = a.hasMore; });
        return next;
      });

      // Premier chargement : init accounts + selectedAccount
      if (page === 1) {
        setAccounts(incoming.map((a) => ({ accountId: a.accountId, username: a.username })));
        setSelectedAccount((s) => s ?? incoming[0]?.accountId ?? null);
        setCurrentPages((prev) => {
          const next = { ...prev };
          incoming.forEach((a) => { if (!prev[a.accountId]) next[a.accountId] = 1; });
          return next;
        });
      }
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchPage(1).finally(() => setIsLoading(false));
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPageCache({});
    setCurrentPages({});
    setMessagesCache({});
    setSelectedConv(null);
    await fetchPage(1);
    setIsRefreshing(false);
  };

  const activePage = selectedAccount ? (currentPages[selectedAccount] ?? 1) : 1;
  const conversations = selectedAccount
    ? (pageCache[selectedAccount]?.[activePage] ?? [])
    : [];
  const totalUnread = Object.values(pageCache[selectedAccount] ?? {})
    .flat()
    .filter((c) => c.unread).length;

  const goToPage = async (page) => {
    if (!selectedAccount) return;
    setCurrentPages((p) => ({ ...p, [selectedAccount]: page }));
    setSelectedConv(null);
    // Fetch si pas en cache
    if (!pageCache[selectedAccount]?.[page]) {
      await fetchPage(page);
    }
  };

  const canPrev = activePage > 1;
  const canNext = hasMorePages[selectedAccount] !== false || !!pageCache[selectedAccount]?.[activePage + 1];

  return (
    <div className="h-screen flex bg-background text-foreground font-sans overflow-hidden">
      <Sidebar active="messages" />

      <div
        className="flex-1 flex flex-col overflow-hidden transition-[margin-left] duration-200 ease-in-out"
        style={{ marginLeft: "var(--sidebar-w, 16rem)" }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border flex items-center justify-between shrink-0">
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
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Account tabs */}
        {accounts.length > 1 && (
          <div className="flex gap-1 px-6 border-b border-border shrink-0">
            {accounts.map((account) => {
              const unread = Object.values(pageCache[account.accountId] ?? {}).flat().filter((c) => c.unread).length;
              return (
                <button
                  key={account.accountId}
                  onClick={() => { setSelectedAccount(account.accountId); setSelectedConv(null); }}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${selectedAccount === account.accountId
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <ShoppingBag size={13} />
                  {account.username}
                  {unread > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Split view — prend tout l'espace restant */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left — liste */}
          <div className="w-72 shrink-0 border-r border-border flex flex-col overflow-hidden">
            {isLoading ? (
              <ConversationsSkeleton />
            ) : error ? (
              <ErrorState message={error} onRetry={handleRefresh} />
            ) : conversations.length === 0 ? (
              <EmptyState hasAccounts={accounts.length > 0} />
            ) : (
              <>
                <ul className="flex-1 overflow-y-auto divide-y divide-border">
                  {conversations.map((conv) => (
                    <ConversationRow
                      key={conv.conv_id}
                      conv={conv}
                      isSelected={selectedConv?.conv_id === conv.conv_id}
                      onClick={() => setSelectedConv(conv)}
                    />
                  ))}
                </ul>

                {/* Pagination */}
                <div className="shrink-0 border-t border-border px-4 py-2.5 flex items-center justify-between">
                  <button
                    onClick={() => goToPage(activePage - 1)}
                    disabled={!canPrev || isRefreshing}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-30"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="text-xs text-muted-foreground">Page {activePage}</span>
                  <button
                    onClick={() => goToPage(activePage + 1)}
                    disabled={!canNext || isRefreshing}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-30"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right — détail */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedConv ? (
              <ConversationDetail
                conv={selectedConv}
                accountId={selectedAccount}
                messagesCache={messagesCache}
                setMessagesCache={setMessagesCache}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center">
                  <MessageSquare size={18} className="text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Sélectionnez une conversation</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Conversation row ─────────────────────────────────────────────────────────

function ConversationRow({ conv, isSelected, onClick }) {
  const timeAgo = conv.last_update
    ? formatDistanceToNow(new Date(conv.last_update), { addSuffix: true, locale: fr })
    : null;

  return (
    <li
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${isSelected ? "bg-primary/10 border-r-2 border-primary" : "hover:bg-muted/30"
        } ${conv.unread && !isSelected ? "bg-primary/3" : ""}`}
    >
      <div className="w-10 h-10 rounded-lg border border-border overflow-hidden shrink-0 bg-muted">
        {conv.item_full_size_url ? (
          <img src={conv.item_full_size_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={13} className="text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className={`text-sm truncate ${conv.unread ? "font-semibold" : "font-medium"}`}>
            {conv.opposite_user_name}
          </span>
          {timeAgo && <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo}</span>}
        </div>
        <p className="text-xs text-muted-foreground truncate">{conv.description || "—"}</p>
      </div>
      {conv.unread && !isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
    </li>
  );
}

// ─── Conversation detail ──────────────────────────────────────────────────────

function ConversationDetail({ conv, accountId, messagesCache, setMessagesCache }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const cacheKey = `${accountId}_${conv.conv_id}`;
  const data = messagesCache[cacheKey] || null;

  useEffect(() => {
    // Si déjà en cache, pas besoin de fetch
    if (messagesCache[cacheKey]) {
      console.log("⚡ Messages chargés depuis le cache");
      return;
    }

    console.log("🔄 Chargement des messages...");
    setIsLoading(true);
    setError(null);
    fetch(`/api/messages/${conv.conv_id}?accountId=${accountId}`)
      .then((r) => r.ok ? r.json() : Promise.reject("Erreur serveur"))
      .then((d) => {
        setMessagesCache((prev) => ({ ...prev, [cacheKey]: d.conversation }));
        console.log("✅ Messages chargés");
      })
      .catch((e) => setError(String(e)))
      .finally(() => setIsLoading(false));
  }, [conv.conv_id, accountId, cacheKey, messagesCache, setMessagesCache]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data]);

  const conversation = data;
  const userSide = conversation?.transaction?.current_user_side ?? null;
  const oppositeUser = conversation?.opposite_user;
  const allowReply = conversation?.allow_reply ?? true;
  const currentUserId = userSide === "buyer"
    ? conversation?.transaction?.buyer_id
    : conversation?.transaction?.seller_id;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border shrink-0 flex items-center gap-3">
        {oppositeUser?.photo?.thumbnails?.find((t) => t.type === "thumb100")?.url ? (
          <img
            src={oppositeUser.photo.thumbnails.find((t) => t.type === "thumb100").url}
            alt={oppositeUser.login}
            className="w-8 h-8 rounded-full border border-border object-cover shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted border border-border shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{oppositeUser?.login ?? conv.opposite_user_name}</p>
          <p className="text-xs text-muted-foreground truncate">{conversation?.subtitle ?? conv.description}</p>
        </div>
        {userSide && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${userSide === "seller"
            ? "bg-primary/10 text-primary border-primary/20"
            : "bg-blue-500/10 text-blue-600 border-blue-500/20"
            }`}>
            {userSide === "seller" ? "Vendeur" : "Acheteur"}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : (
          <>
            {(conversation?.messages ?? []).map((msg, i) => (
              <MessageBubble key={msg.id ?? i} msg={msg} currentUserId={currentUserId} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Pending offer actions */}
      {!isLoading && !error && conversation && (
        <PendingOfferActions
          conversation={conversation}
          accountId={accountId}
          conversationId={conv.conv_id}
          currentUserId={currentUserId}
          onAction={(msg) => {
            setMessagesCache((prev) => {
              const current = prev[cacheKey];
              if (!current) return prev;
              return {
                ...prev,
                [cacheKey]: {
                  ...current,
                  messages: [...current.messages, msg],
                },
              };
            });
          }}
        />
      )}

      {/* Input */}
      {!isLoading && !error && (
        <MessageInput
          conversationId={conv.conv_id}
          accountId={accountId}
          allowReply={allowReply}
          userSide={userSide}
          transaction={conversation?.transaction}
          onSent={(newMsg) => {
            setMessagesCache((prev) => {
              const current = prev[cacheKey];
              if (!current) return prev;
              return {
                ...prev,
                [cacheKey]: {
                  ...current,
                  messages: [...current.messages, newMsg],
                },
              };
            });
          }}
        />
      )}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, currentUserId }) {
  const { entity_type, entity, created_at_ts, created_time_ago } = msg;

  const timeLabel = created_time_ago || (created_at_ts
    ? formatDistanceToNow(new Date(created_at_ts), { addSuffix: true, locale: fr })
    : null);

  // isMine calculé en premier, utilisé par tous les types
  const isMine = entity?.user_id
    ? String(entity.user_id) === String(currentUserId)
    : false;

  // ── Système / action (centré) ──
  if (entity_type === "action_message") {
    return (
      <div className="flex justify-center my-1">
        <div className="bg-muted border border-border rounded-xl px-4 py-2.5 max-w-sm text-center">
          {entity.title && <p className="text-xs font-semibold">{entity.title}</p>}
          {entity.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{entity.subtitle}</p>}
          {timeLabel && <p className="text-[10px] text-muted-foreground mt-1">{timeLabel}</p>}
        </div>
      </div>
    );
  }

  // ── Offre reçue (offer_request_message) — alignée selon l'expéditeur ──
  if (entity_type === "offer_request_message") {
    const cancelled = entity.status_title === "Annulée";
    const refused = entity.status_title === "Refusée";
    const isNegative = cancelled || refused;
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
        <div className={`border rounded-2xl px-4 py-3 max-w-xs ${isMine
          ? "bg-primary/10 border-primary/30 rounded-br-sm"
          : "bg-muted border-border rounded-bl-sm"
          }`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Tag size={12} className={isNegative ? "text-muted-foreground" : "text-primary"} />
            <p className={`text-xs font-semibold truncate ${isNegative ? "text-muted-foreground" : "text-primary"}`}>
              {entity.title}
            </p>
          </div>
          <p className="text-sm font-bold">{entity.price_label}</p>
          {entity.original_price_label && entity.original_price_label !== entity.price_label && (
            <p className="text-xs text-muted-foreground line-through">{entity.original_price_label}</p>
          )}
          <p className={`text-[10px] mt-1 font-medium ${isNegative ? "text-red-500" : "text-primary"}`}>
            {entity.status_title}
          </p>
          {timeLabel && <p className="text-[10px] text-muted-foreground mt-0.5">{timeLabel}</p>}
        </div>
      </div>
    );
  }

  // ── Offre envoyée (offer_message) — alignée selon l'expéditeur ──
  if (entity_type === "offer_message") {
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
        <div className={`border rounded-2xl px-4 py-3 max-w-xs ${isMine
          ? "bg-primary/10 border-primary/30 rounded-br-sm"
          : "bg-muted border-border rounded-bl-sm"
          }`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Tag size={12} className="text-primary" />
            <p className="text-xs font-semibold text-primary">Offre</p>
          </div>
          <p className="text-sm font-bold">{entity.price_label}</p>
          {entity.original_price_label && entity.original_price_label !== entity.price_label && (
            <p className="text-xs text-muted-foreground line-through">{entity.original_price_label}</p>
          )}
          {timeLabel && <p className="text-[10px] text-muted-foreground mt-1">{timeLabel}</p>}
        </div>
      </div>
    );
  }

  // ── Message texte / photos ──
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-xs rounded-2xl px-4 py-2.5 ${isMine ? "bg-primary text-white rounded-br-sm" : "bg-muted border border-border rounded-bl-sm"
        }`}>
        {entity?.body && <p className="text-sm leading-relaxed">{entity.body}</p>}
        {entity?.photos?.length > 0 && entity.photos.map((photo, i) => (
          <img key={i} src={photo.url} alt="" className="rounded-lg max-w-full mt-1" />
        ))}
        {entity?.photo?.url && (
          <img src={entity.photo.url} alt="" className="rounded-lg max-w-full mt-1" />
        )}
        {timeLabel && (
          <p className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-muted-foreground"}`}>
            {timeLabel}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Pending offer actions ────────────────────────────────────────────────────

function PendingOfferActions({ conversation, accountId, conversationId, currentUserId, onAction }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);

  const messages = conversation?.messages ?? [];
  const transaction = conversation?.transaction;
  const userSide = transaction?.current_user_side;
  const isClosed = transaction?.item_is_closed === true;

  // Si l'item est fermé, afficher un message
  if (isClosed) {
    return (
      <div className="px-5 py-3 border-t border-border shrink-0 bg-muted/20">
        <div className="flex items-center gap-2">
          <AlertCircle size={13} className="text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Cette conversation est fermée
          </p>
        </div>
      </div>
    );
  }

  // Chercher la dernière offre current (peu importe le statut)
  const TERMINAL_STATUSES = ["Refusée", "Annulée", "Acceptée", "Expirée"];
  let lastCurrentOffer = null;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const isOfferType = msg.entity_type === "offer_request_message" || msg.entity_type === "offer_message";
    if (isOfferType && msg.entity?.current === true) {
      lastCurrentOffer = msg;
      break;
    }
  }

  if (!lastCurrentOffer || !transaction) return null;

  const isTerminal = TERMINAL_STATUSES.includes(lastCurrentOffer.entity?.status_title);
  // Si la dernière offre current est terminale → plus rien à faire
  if (isTerminal) return null;

  const isFromOther = String(lastCurrentOffer.entity?.user_id) !== String(currentUserId);
  const offerPrice = lastCurrentOffer.entity?.price?.amount
    ? parseFloat(lastCurrentOffer.entity.price.amount)
    : null;
  const offerLabel = lastCurrentOffer.entity?.price_label || `${offerPrice} €`;
  const offerId = lastCurrentOffer.entity?.offer_request_id || lastCurrentOffer.id;

  // Si c'est notre offre qui attend une réponse
  if (!isFromOther) {
    return (
      <div className="px-5 py-3 border-t border-border shrink-0 bg-muted/20">
        <div className="flex items-center gap-2">
          <Tag size={13} className="text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Votre offre de <span className="font-semibold text-foreground">{offerLabel}</span> est en attente de réponse
          </p>
        </div>
      </div>
    );
  }

  // Sinon, afficher les boutons d'action
  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      const payload = { accountId, transaction_id: transaction.id, offer_id: offerId };
      const url = `/api/messages/${conversationId}/accept-offer`;
      console.log("📤 [accept-offer] URL:", url, "| Body:", payload);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("📥 [accept-offer] Status:", res.status);
      if (!res.ok) throw new Error("Erreur lors de l'acceptation");
      console.log("✅ Offre acceptée");

      // Optimistic update
      onAction({
        id: Date.now(),
        entity_type: "action_message",
        entity: {
          title: "Offre acceptée",
          subtitle: `Vous avez accepté l'offre de ${offerLabel}`,
        },
        created_at_ts: new Date().toISOString(),
      });
    } catch (e) {
      console.error("❌ Erreur:", e);
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      const payload = { accountId, transaction_id: transaction.id, offer_id: offerId };
      const url = `/api/messages/${conversationId}/reject-offer`;
      console.log("📤 [reject-offer] URL:", url, "| Body:", payload);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("📥 [reject-offer] Status:", res.status);
      if (!res.ok) throw new Error("Erreur lors du refus");
      console.log("✅ Offre refusée");

      // Optimistic update
      onAction({
        id: Date.now(),
        entity_type: "action_message",
        entity: {
          title: "Offre refusée",
          subtitle: `Vous avez refusé l'offre de ${offerLabel}`,
        },
        created_at_ts: new Date().toISOString(),
      });
    } catch (e) {
      console.error("❌ Erreur:", e);
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="px-5 py-3 border-t border-border shrink-0 bg-muted/20">
        <div className="flex items-center gap-2 mb-2">
          <Tag size={13} className="text-primary" />
          <p className="text-xs font-semibold text-primary">Offre en attente : {offerLabel}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-lg transition-colors disabled:opacity-50"
          >
            {isProcessing ? <Loader2 size={13} className="animate-spin mx-auto" /> : "Accepter"}
          </button>
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 font-semibold text-xs rounded-lg transition-colors border border-red-500/20 disabled:opacity-50"
          >
            {isProcessing ? <Loader2 size={13} className="animate-spin mx-auto" /> : "Refuser"}
          </button>
          <button
            onClick={() => setShowCounterModal(true)}
            disabled={isProcessing}
            className="flex-1 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs rounded-lg transition-colors border border-border disabled:opacity-50"
          >
            Contre-offre
          </button>
        </div>
      </div>

      {showCounterModal && (
        <OfferModal
          conversationId={conversationId}
          accountId={accountId}
          userSide={userSide}
          transaction={transaction}
          referencePrice={offerPrice}
          onClose={() => setShowCounterModal(false)}
          onSent={(msg) => { onAction(msg); setShowCounterModal(false); }}
        />
      )}
    </>
  );
}

// ─── Message input ────────────────────────────────────────────────────────────

function MessageInput({ conversationId, accountId, allowReply, userSide, transaction, onSent }) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const canOffer = transaction != null && !transaction?.item_is_closed;
  const referencePrice = transaction?.offer_price?.amount
    ? parseFloat(transaction.offer_price.amount)
    : null;

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const sendMessage = async () => {
    if (!text.trim() && !selectedImage) return;
    setIsSending(true);
    try {
      let imageUrl = "";

      // Upload image first if selected
      if (selectedImage) {
        console.log("🚀 Envoi de l'image...");
        const formData = new FormData();
        formData.append("image", selectedImage);

        const uploadRes = await fetch("/api/messages/upload-image", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Échec de l'upload de l'image");
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
        console.log("✅ Image uploadée:", imageUrl);
      }

      // Send message to Vinted API
      console.log("📝 Envoi du message...");
      const res = await fetch(`/api/messages/${conversationId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          text: text.trim() || "",
          photo_url: imageUrl,
        }),
      });

      if (!res.ok) throw new Error("Échec de l'envoi du message");
      console.log("✅ Message envoyé");

      // Optimistic update
      onSent({
        id: Date.now(),
        entity_type: "message",
        entity: {
          body: text.trim(),
          user_id: userSide === "seller" ? transaction?.seller_id : transaction?.buyer_id,
          photo: imageUrl ? { url: imageUrl } : null,
        },
        created_at_ts: new Date().toISOString(),
      });
      setText("");
      removeImage();
    } catch (err) {
      console.error("❌ Erreur:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (!allowReply) {
    return (
      <div className="px-5 py-3 border-t border-border shrink-0">
        <p className="text-xs text-center text-muted-foreground">Réponse impossible sur cette conversation</p>
      </div>
    );
  }

  return (
    <>
      <div className="px-5 py-4 border-t border-border shrink-0 space-y-3">
        {/* Image preview */}
        {imagePreview && (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-border"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex gap-1 shrink-0 pb-0.5">
            <label className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer" title="Envoyer une image">
              <Image size={16} />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </label>
            {canOffer && (
              <button
                onClick={() => setShowOfferModal(true)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                title="Faire une offre"
              >
                <Tag size={16} />
              </button>
            )}
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Écrire un message..."
            rows={1}
            className="flex-1 resize-none bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground max-h-32"
            style={{ fieldSizing: "content" }}
          />

          <button
            onClick={sendMessage}
            disabled={isSending || (!text.trim() && !selectedImage)}
            className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-40 shrink-0"
          >
            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>

      {showOfferModal && (
        <OfferModal
          conversationId={conversationId}
          accountId={accountId}
          userSide={userSide}
          transaction={transaction}
          referencePrice={referencePrice}
          onClose={() => setShowOfferModal(false)}
          onSent={(msg) => { onSent(msg); setShowOfferModal(false); }}
        />
      )}
    </>
  );
}

// ─── Offer modal ──────────────────────────────────────────────────────────────

function OfferModal({ conversationId, accountId, userSide, transaction, referencePrice, onClose, onSent }) {
  const [price, setPrice] = useState(referencePrice ? String(referencePrice) : "");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const originalPrice = transaction?.item_is_closed ? null
    : parseFloat(transaction?.offer_price?.amount ?? 0) || null;
  const itemTitle = transaction?.item_title;

  // Règles de validation
  const MAX_PRICE = 10000;
  // Acheteur : min = 60% du prix de base (max -40%), pas de limite haute sauf 10K
  const minBuyerPrice = (userSide === "buyer" && originalPrice)
    ? Math.ceil(originalPrice * 0.6 * 100) / 100
    : null;

  const validate = (val) => {
    if (!val || val <= 0) return "Prix invalide";
    if (val > MAX_PRICE) return `Maximum ${MAX_PRICE.toLocaleString("fr-FR")} €`;
    if (userSide === "buyer" && minBuyerPrice && val < minBuyerPrice) {
      return `Offre trop basse — minimum ${minBuyerPrice.toFixed(2).replace(".", ",")} €`;
    }
    return null;
  };

  const priceVal = parseFloat(price);
  const validationError = price ? validate(priceVal) : null;

  const sendOffer = async () => {
    const err = validate(priceVal);
    if (err) { setError(err); return; }
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/messages/${conversationId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          offer_price: priceVal,
          transaction_id: transaction?.id,
          is_seller: userSide === "seller",
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de l'envoi");
      const data = await res.json();
      console.log("✅ Offre envoyée, offer_id:", data.offer_id || "N/A");

      onSent({
        id: Date.now(),
        entity_type: "offer_message",
        entity: {
          price_label: `${priceVal.toFixed(2).replace(".", ",")} €`,
          original_price_label: originalPrice ? `${originalPrice.toFixed(2).replace(".", ",")} €` : null,
          user_id: userSide === "seller" ? transaction?.seller_id : transaction?.buyer_id,
        },
        created_at_ts: new Date().toISOString(),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-150">
      <div className="bg-card border border-border w-full max-w-sm rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Tag size={15} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Faire une offre</p>
              <p className="text-xs text-muted-foreground">
                {userSide === "seller" ? "Contre-offre au client" : "Proposer un prix"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Article */}
          {itemTitle && (
            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border">
              {transaction?.item_photo?.thumbnails?.find(t => t.type === "thumb70x100")?.url && (
                <img
                  src={transaction.item_photo.thumbnails.find(t => t.type === "thumb70x100").url}
                  alt=""
                  className="w-10 h-12 object-cover rounded-md shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{itemTitle}</p>
                {originalPrice && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {userSide === "seller" ? "Offre reçue" : "Prix demandé"} :{" "}
                    <span className="font-semibold text-foreground">
                      {originalPrice.toFixed(2).replace(".", ",")} €
                    </span>
                  </p>
                )}
                {/* Hint acheteur */}
                {userSide === "buyer" && minBuyerPrice && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Offre min. acceptée : <span className="font-medium">{minBuyerPrice.toFixed(2).replace(".", ",")} €</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Input prix */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Votre offre</label>
            <div className={`flex items-center border rounded-lg overflow-hidden transition-colors ${validationError ? "border-red-400 focus-within:border-red-400" : "border-border focus-within:border-primary/50"
              }`}>
              <input
                type="number"
                value={price}
                onChange={(e) => { setPrice(e.target.value); setError(null); }}
                placeholder="0.00"
                step="0.5"
                min={minBuyerPrice ?? 0}
                max={MAX_PRICE}
                autoFocus
                className="flex-1 px-4 py-2.5 text-sm bg-transparent outline-none"
              />
              <span className="px-3 text-sm text-muted-foreground border-l border-border bg-muted/30">€</span>
            </div>
            {/* Erreur validation en temps réel */}
            {(validationError || error) && (
              <p className="text-xs text-red-500 mt-1.5">{validationError || error}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={sendOffer}
              disabled={isSending || !price || !!validationError}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSending ? <Loader2 size={15} className="animate-spin" /> : "Envoyer l'offre"}
            </button>
            <button onClick={onClose} className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ConversationsSkeleton() {
  return (
    <ul className="flex-1 divide-y divide-border overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3.5">
          <div className="w-10 h-10 rounded-lg bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted animate-pulse rounded w-1/3" />
            <div className="h-2.5 bg-muted animate-pulse rounded w-2/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ hasAccounts }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
      <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center mb-3">
        <MessageSquare size={18} className="text-muted-foreground" />
      </div>
      <p className="font-medium text-sm">
        {hasAccounts ? "Aucune conversation" : "Aucun compte connecté"}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {hasAccounts ? "Vos conversations apparaîtront ici." : "Connectez un compte Vinted."}
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3">
        <AlertCircle size={18} className="text-red-500" />
      </div>
      <p className="font-medium text-sm">Erreur de chargement</p>
      <p className="text-xs text-muted-foreground mt-1 mb-3">{message}</p>
      <button onClick={onRetry} className="text-xs font-medium text-primary hover:underline">Réessayer</button>
    </div>
  );
}
