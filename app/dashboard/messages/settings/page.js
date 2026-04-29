"use client";

import { ArrowLeft, Heart, Loader2, MessageSquare, Save, ToggleLeft, ToggleRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sidebar } from "../../page";

const DEFAULT_MESSAGE_FR =
  "Bonjour ! Merci pour votre favori 😊 N'hésitez pas si vous avez des questions ou souhaitez faire une offre !";

export default function MessageSettings() {
  const t = useTranslations("message_settings");
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [favoriteReplyEnabled, setFavoriteReplyEnabled] = useState(false);
  const [favoriteReplyMessage, setFavoriteReplyMessage] = useState(DEFAULT_MESSAGE_FR);
  const [charCount, setCharCount] = useState(DEFAULT_MESSAGE_FR.length);

  useEffect(() => {
    fetch("/api/message-settings")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        setFavoriteReplyEnabled(data.favoriteReplyEnabled ?? false);
        const msg = data.favoriteReplyMessage ?? DEFAULT_MESSAGE_FR;
        setFavoriteReplyMessage(msg);
        setCharCount(msg.length);
      })
      .catch(() => { })
      .finally(() => setIsLoading(false));
  }, []);

  const handleMessageChange = (e) => {
    const val = e.target.value;
    if (val.length > 1000) return;
    setFavoriteReplyMessage(val);
    setCharCount(val.length);
  };

  const handleSave = async () => {
    if (!favoriteReplyMessage.trim()) {
      toast.error(t("error_empty_message"));
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/message-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          favoriteReplyEnabled,
          favoriteReplyMessage: favoriteReplyMessage.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(t("saved"));
    } catch {
      toast.error(t("error_save"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFavoriteReplyMessage(DEFAULT_MESSAGE_FR);
    setCharCount(DEFAULT_MESSAGE_FR.length);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar active="messages" />

      <main
        className="flex-1 transition-[margin-left] duration-200 ease-in-out"
        style={{ marginLeft: "var(--sidebar-w, 16rem)" }}
      >
        {/* Header */}
        <div className="px-10 pt-10 pb-8 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => router.push("/dashboard/messages")}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare size={14} className="text-primary" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-[4.5rem]">{t("subtitle")}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={22} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="p-10 max-w-2xl space-y-6">

            {/* ── Section : Relance favoris ── */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Section header */}
              <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center">
                    <Heart size={16} className="text-pink-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t("favorite_reply.title")}</p>
                    <p className="text-xs text-muted-foreground">{t("favorite_reply.subtitle")}</p>
                  </div>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => setFavoriteReplyEnabled((v) => !v)}
                  className="flex items-center gap-2 transition-colors"
                  aria-label={favoriteReplyEnabled ? t("favorite_reply.disable") : t("favorite_reply.enable")}
                >
                  {favoriteReplyEnabled ? (
                    <ToggleRight size={32} className="text-primary" />
                  ) : (
                    <ToggleLeft size={32} className="text-muted-foreground" />
                  )}
                  <span className={`text-xs font-semibold ${favoriteReplyEnabled ? "text-primary" : "text-muted-foreground"}`}>
                    {favoriteReplyEnabled ? t("favorite_reply.active") : t("favorite_reply.inactive")}
                  </span>
                </button>
              </div>

              {/* Message editor */}
              <div className={`px-6 py-5 space-y-3 transition-opacity ${favoriteReplyEnabled ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    {t("favorite_reply.message_label")}
                  </label>
                  <button
                    onClick={handleReset}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t("favorite_reply.reset_default")}
                  </button>
                </div>

                <textarea
                  value={favoriteReplyMessage}
                  onChange={handleMessageChange}
                  rows={5}
                  placeholder={t("favorite_reply.message_placeholder")}
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none"
                />

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {t("favorite_reply.message_hint")}
                  </p>
                  <span className={`text-xs tabular-nums ${charCount > 900 ? "text-amber-500" : "text-muted-foreground"}`}>
                    {charCount} / 1000
                  </span>
                </div>

                {/* Preview */}
                <div className="mt-2 p-4 bg-muted/30 rounded-xl border border-border">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {t("favorite_reply.preview")}
                  </p>
                  <div className="flex justify-end">
                    <div className="max-w-xs bg-primary text-white rounded-2xl rounded-br-sm px-4 py-2.5">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {favoriteReplyMessage || t("favorite_reply.message_placeholder")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info when disabled */}
              {!favoriteReplyEnabled && (
                <div className="px-6 pb-5">
                  <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-4 py-3">
                    {t("favorite_reply.disabled_hint")}
                  </p>
                </div>
              )}
            </div>

            {/* ── Save button ── */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving || !favoriteReplyMessage.trim()}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-sm"
              >
                {isSaving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                {isSaving ? t("saving") : t("save")}
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
