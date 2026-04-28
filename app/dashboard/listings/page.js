"use client";

import { CheckCircle2, Clock, Loader2, ShoppingBag, Sparkles, Store, X, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Sidebar } from "../page";

const STATUS_CONFIG = {
  pending: { label: "En attente", color: "text-amber-500", bg: "bg-amber-500/10", icon: Clock },
  running: { label: "En cours", color: "text-blue-500", bg: "bg-blue-500/10", icon: Loader2 },
  success: { label: "Publié", color: "text-green-500", bg: "bg-green-500/10", icon: CheckCircle2 },
  partial: { label: "Partiel", color: "text-orange-500", bg: "bg-orange-500/10", icon: CheckCircle2 },
  error: { label: "Erreur", color: "text-red-500", bg: "bg-red-500/10", icon: XCircle },
};

export default function Listings() {
  const t = useTranslations();
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch("/api/listings");
        if (res.ok) {
          const data = await res.json();
          setPublications(data.publications || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar active="listings" />

      <main
        className="flex-1 flex flex-col transition-[margin-left] duration-200 ease-in-out"
        style={{ marginLeft: "var(--sidebar-w, 16rem)" }}
      >
        {/* Header */}
        <div className="px-10 pt-10 pb-8 border-b border-border shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingBag size={14} className="text-primary" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">{t("listings.title")}</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-10">{t("listings.subtitle")}</p>
        </div>

        <div className="flex-1 p-10">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : publications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <Sparkles size={28} className="text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">{t("listings.empty_title")}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("listings.empty_subtitle")}</p>
              </div>
              <a
                href="/dashboard/publish"
                className="mt-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
              >
                {t("listings.publish_first")}
              </a>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl">
              {publications.map((pub) => (
                <PublicationCard key={pub.id} pub={pub} onClick={() => setSelected(pub)} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Detail modal */}
      {selected && <DetailModal pub={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function PublicationCard({ pub, onClick }) {
  const status = STATUS_CONFIG[pub.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = status.icon;
  const covers = parseJson(pub.generatedCovers);

  return (
    <button
      onClick={onClick}
      className="w-full bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all text-left"
    >
      <div className="flex items-start gap-5 p-5">
        {/* Cover */}
        <div className="w-20 h-20 rounded-xl overflow-hidden border border-border shrink-0 bg-muted">
          {covers[0] ? (
            <img src={covers[0]} alt={pub.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag size={24} className="text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-semibold text-sm truncate">{pub.title}</h3>
            <span className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
              <StatusIcon size={12} className={pub.status === "running" ? "animate-spin" : ""} />
              {status.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3">
            {pub.brand && <span>{pub.brand}</span>}
            {pub.size && <span>· {pub.size}</span>}
            {pub.condition && <span>· {pub.condition}</span>}
            {pub.price && <span className="font-semibold text-foreground">{pub.price} {pub.accounts?.[0]?.currency ?? "EUR"}</span>}
          </div>

          {/* Per-account badges */}
          {pub.accounts?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pub.accounts.map((acc) => {
                const s = STATUS_CONFIG[acc.status] ?? STATUS_CONFIG.pending;
                const AccIcon = s.icon;
                return (
                  <span key={acc.id} className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${s.bg} ${s.color}`}>
                    {acc.platform === "vinted" ? <ShoppingBag size={11} /> : <Store size={11} />}
                    <span className="capitalize">{acc.platform}</span>
                    <AccIcon size={11} className={acc.status === "running" ? "animate-spin" : ""} />
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {new Date(pub.createdAt).toLocaleDateString("fr-FR", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}
        </span>
      </div>
    </button>
  );
}

function DetailModal({ pub, onClose }) {
  const status = STATUS_CONFIG[pub.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = status.icon;
  const covers = parseJson(pub.generatedCovers);
  const colorIds = parseJson(pub.colorIds);

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200"
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="font-bold text-lg leading-tight">{pub.title}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
                <StatusIcon size={12} className={pub.status === "running" ? "animate-spin" : ""} />
                {status.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(pub.createdAt).toLocaleDateString("fr-FR", {
                  day: "2-digit", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Covers */}
          {covers.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {covers.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`cover-${i}`}
                  className="w-28 h-28 rounded-xl object-cover border border-border shrink-0"
                />
              ))}
            </div>
          )}

          {/* Product details */}
          <div className="grid grid-cols-2 gap-4">
            <DetailRow label="Prix" value={pub.price ? `${pub.price} EUR` : null} />
            <DetailRow label="Marque" value={pub.brand} />
            <DetailRow label="Catégorie" value={pub.categoryPath} />
            <DetailRow label="Taille" value={pub.size} />
            <DetailRow label="État" value={pub.condition} />
            <DetailRow label="Couleurs" value={pub.colors} />
            <DetailRow label="Colis" value={pub.parcelSize} />
            {pub.isbn && <DetailRow label="ISBN" value={pub.isbn} />}
          </div>

          {/* Description */}
          {pub.description && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-xl p-4">
                {pub.description}
              </p>
            </div>
          )}

          {/* Accounts */}
          {pub.accounts?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Plateformes</p>
              <div className="space-y-2">
                {pub.accounts.map((acc) => {
                  const s = STATUS_CONFIG[acc.status] ?? STATUS_CONFIG.pending;
                  const AccIcon = s.icon;
                  return (
                    <div key={acc.id} className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg overflow-hidden border border-border">
                          <img
                            src={acc.platform === "vinted" ? "/vinted.jpeg" : "/ebay.png"}
                            className="w-full h-full object-cover"
                            alt={acc.platform}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize">{acc.platform}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{acc.currency}</span>
                            {acc.sku && <span>· {acc.sku}</span>}
                            {acc.platformListingId && <span>· ID: {acc.platformListingId}</span>}
                          </div>
                        </div>
                      </div>
                      <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.color}`}>
                        <AccIcon size={11} className={acc.status === "running" ? "animate-spin" : ""} />
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error messages */}
          {pub.accounts?.some(a => a.errorMessage) && (
            <div className="space-y-2">
              {pub.accounts.filter(a => a.errorMessage).map((acc) => (
                <div key={acc.id} className="bg-red-500/10 text-red-500 text-xs rounded-xl px-4 py-3">
                  <span className="font-semibold capitalize">{acc.platform}</span> : {acc.errorMessage}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function parseJson(str) {
  if (Array.isArray(str)) return str;
  try { return JSON.parse(str || "[]"); } catch { return []; }
}
