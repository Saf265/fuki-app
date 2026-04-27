"use client";

import BrandSelect from "@/components/BrandSelect";
import CategorySelect from "@/components/CategorySelect";
import ColorSelect from "@/components/ColorSelect";
import PackageSizeSelect from "@/components/PackageSizeSelect";
import SizeSelect from "@/components/SizeSelect";
import StatusSelect from "@/components/StatusSelect";
import { ChevronDown, ImagePlus, Loader2, Sparkles, Store, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "../page";

const MAX_IMAGES = 6;

export default function Publish() {
  const t = useTranslations("publish");
  const locale = useLocale();
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(null);
  const [hiddenFields, setHiddenFields] = useState({});
  const [generatedCovers, setGeneratedCovers] = useState([]);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState({ vinted: [], ebay: [] });
  const [selectedAccounts, setSelectedAccounts] = useState([]);

  const handleFiles = (files) => {
    const valid = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, MAX_IMAGES - images.length);

    valid.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) =>
        setImages((prev) =>
          prev.length < MAX_IMAGES
            ? [...prev, { file, preview: e.target.result }]
            : prev
        );
      reader.readAsDataURL(file);
    });
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [images]);

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const removeImage = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));
  const canAddMore = images.length < MAX_IMAGES;

  const handleGenerate = async () => {
    if (!images.length) return;
    setLoading(true);
    setError(null);
    setForm(null);
    setGeneratedCovers([]);

    try {
      const fd = new FormData();
      for (const img of images) fd.append("images", img.file);

      const uploadRes = await fetch("/api/publish/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) throw new Error("Erreur lors de l'upload des images");
      const { urls } = await uploadRes.json();

      const genRes = await fetch("/api/publish/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_urls: urls, lang: locale }),
      });
      if (!genRes.ok) throw new Error("Erreur lors de la génération");
      const data = await genRes.json();

      setGeneratedCovers(data.generated_covers ?? []);
      setHiddenFields({
        brand_id: String(data.brand_id ?? ""),
        category_id: String(data.category_id ?? ""),
        size_id: String(data.size_id ?? ""),
        status_id: String(data.status_id ?? ""),
        color_ids: Array.isArray(data.color_ids) ? data.color_ids.map(String) : [],
        parcel_size_id: data.parcel_size_id ? Number(data.parcel_size_id) : null,
      });
      setForm({
        title: data.title ?? "",
        description: data.description ?? "",
        brand: data.brand ?? "",
        category_path: data.category_path ?? "",
        size: data.size ?? "",
        condition: data.condition ?? "",
        colors: Array.isArray(data.colors) ? data.colors.join(", ") : (data.colors ?? ""),
        parcel_size: data.parcel_size ?? "",
        isbn: data.isbn ?? "",
        price: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handlePublish = async () => {
    console.log("=== PUBLISH BUTTON CLICKED ===");
    console.log("Selected Accounts:", selectedAccounts);
    console.log("Form Data:", form);
    console.log("Hidden Fields (IDs):", hiddenFields);
    console.log("Images:", images);
    console.log("Generated Covers:", generatedCovers);
    console.log("Locale:", locale);

    // TODO: Implement actual publish logic
  };

  // Fetch accounts on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch("/api/connections");
        if (res.ok) {
          const data = await res.json();
          if (data.connections) {
            setAccounts(data.connections);
            // Don't auto-select any account - let user choose
          }
        }
      } catch (err) {
        console.error("Failed to fetch accounts", err);
      }
    };
    fetchAccounts();
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar active="publish" />

      <main
        className="flex-1 flex flex-col transition-[margin-left] duration-200 ease-in-out overflow-hidden"
        style={{ marginLeft: "var(--sidebar-w, 16rem)" }}
      >
        {/* Header */}
        <div className="px-10 pt-10 pb-8 border-b border-border shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles size={14} className="text-primary" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-10">{t("subtitle")}</p>
        </div>

        {!form ? (
          /* ── État initial : upload centré ── */
          <div className="flex-1 flex items-center justify-center p-10">
            <div className="w-full max-w-lg flex flex-col gap-5">
              {/* Account selector */}
              <AccountSelector
                accounts={accounts}
                selectedAccounts={selectedAccounts}
                onSelect={setSelectedAccounts}
                t={t}
              />

              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{t("photos")}</p>
                <span className="text-xs text-muted-foreground tabular-nums">{images.length} / {MAX_IMAGES}</span>
              </div>

              {images.length === 0 ? (
                <Dropzone onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} isDragging={isDragging} onFiles={handleFiles} t={t} />
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/50 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                          {t("main_photo")}
                        </span>
                      )}
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {canAddMore && (
                    <label
                      onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
                      className={`aspect-square rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-2 transition-all duration-200
                        ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/20"}`}
                    >
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                      <ImagePlus size={18} className="text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{t("add")}</p>
                    </label>
                  )}
                </div>
              )}

              {error && <p className="text-sm text-red-500 bg-red-500/10 rounded-xl px-4 py-3">{error}</p>}

              {images.length > 0 && (
                <button
                  onClick={handleGenerate}
                  disabled={loading || selectedAccounts.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors shadow-md shadow-primary/20"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {loading ? t("generating") : t("generate")}
                </button>
              )}

              {images.length > 0 && selectedAccounts.length === 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded-xl px-4 py-3 text-center">
                  {t("select_account_to_generate")}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* ── État résultat : layout 2 colonnes ── */
          <div className="flex-1 flex overflow-hidden">
            {/* Colonne gauche : images + covers */}
            <div className="w-72 shrink-0 border-r border-border flex flex-col gap-4 p-5 overflow-y-auto">
              {/* Account info */}
              {selectedAccounts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("selected_accounts")}</p>
                  {selectedAccounts.map((account) => (
                    <div key={`${account.platform}-${account.id}`} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg overflow-hidden border border-border shrink-0">
                        <img
                          src={account.platform === "vinted" ? "/vinted.jpeg" : "/ebay.png"}
                          className="w-full h-full object-cover"
                          alt={account.platform}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{account.username}</p>
                        <p className="text-xs text-muted-foreground capitalize">{account.platform}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("photos")}</p>
                <span className="text-xs text-muted-foreground">{images.length}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-black/50 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm leading-none">
                        {t("main_photo")}
                      </span>
                    )}
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {canAddMore && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/40 cursor-pointer flex items-center justify-center transition-all">
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                    <ImagePlus size={14} className="text-muted-foreground" />
                  </label>
                )}
              </div>

              {generatedCovers.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">{t("generated_covers")}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {generatedCovers.map((url, i) => (
                      <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border">
                        <img src={url} alt={`cover-${i}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </>
              )}

              <button
                onClick={() => { setForm(null); setGeneratedCovers([]); }}
                className="mt-auto text-xs text-muted-foreground hover:text-foreground transition-colors text-center pt-2"
              >
                {t("restart")}
              </button>
            </div>

            {/* Colonne droite : formulaire */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto p-8">
                {/* Header section */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-2">{t("listing_details")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t("listing_subtitle")}
                  </p>
                </div>

                {/* Main info card */}
                <div className="bg-card border border-border rounded-2xl p-6 mb-6 space-y-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-5 bg-primary rounded-full"></div>
                      <h3 className="font-semibold">{t("sections.main_info")}</h3>
                    </div>
                    <FormField label={t("fields.title")} value={form.title} onChange={(v) => updateField("title", v)} />
                  </div>

                  <FormField
                    label={t("fields.description")}
                    value={form.description}
                    onChange={(v) => updateField("description", v)}
                    multiline
                  />
                </div>

                {/* Product details card */}
                <div className="bg-card border border-border rounded-2xl p-6 mb-6 space-y-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-5 bg-primary rounded-full"></div>
                    <h3 className="font-semibold">{t("sections.product_details")}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        {t("fields.brand")}
                      </label>
                      <BrandSelect
                        key={`brand-${locale}`}
                        brandId={hiddenFields.brand_id}
                        onChange={({ label, id }) => {
                          updateField("brand", label);
                          setHiddenFields((prev) => ({ ...prev, brand_id: String(id) }));
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        {t("fields.condition")}
                      </label>
                      <StatusSelect
                        key={`status-${locale}`}
                        statusId={hiddenFields.status_id}
                        onChange={({ label, id }) => {
                          updateField("condition", label);
                          setHiddenFields((prev) => ({ ...prev, status_id: String(id) }));
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      {t("fields.category")}
                    </label>
                    <CategorySelect
                      key={`category-${locale}`}
                      categoryId={hiddenFields.category_id ? Number(hiddenFields.category_id) : null}
                      onChange={({ path, id }) => {
                        updateField("category_path", path);
                        setHiddenFields((prev) => ({ ...prev, category_id: String(id) }));
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        {t("fields.size")}
                      </label>
                      <SizeSelect
                        key={`size-${locale}`}
                        sizeId={hiddenFields.size_id ? Number(hiddenFields.size_id) : null}
                        onChange={({ label, id }) => {
                          updateField("size", label);
                          setHiddenFields((prev) => ({ ...prev, size_id: String(id) }));
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        {t("fields.colors")}
                      </label>
                      <ColorSelect
                        key={`colors-${locale}`}
                        colorIds={hiddenFields.color_ids ?? []}
                        onChange={(colors) => {
                          updateField("colors", colors.map((c) => c.label).join(", "));
                          setHiddenFields((prev) => ({ ...prev, color_ids: colors.map((c) => c.id) }));
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing & shipping card */}
                <div className="bg-card border border-border rounded-2xl p-6 mb-6 space-y-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-5 bg-primary rounded-full"></div>
                    <h3 className="font-semibold">{t("sections.pricing_shipping")}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        {t("fields.price")}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.price}
                          onChange={(e) => updateField("price", e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-muted/40 border border-border rounded-xl pl-4 pr-12 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                          EUR
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        {t("fields.parcel_size")}
                      </label>
                      <PackageSizeSelect
                        key={`parcel-${locale}`}
                        parcelSizeId={hiddenFields.parcel_size_id}
                        onChange={({ label, id }) => {
                          updateField("parcel_size", label);
                          setHiddenFields((prev) => ({ ...prev, parcel_size_id: id }));
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* ISBN if exists */}
                {form.isbn && (
                  <div className="bg-card border border-border rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-5 bg-primary rounded-full"></div>
                      <h3 className="font-semibold">{t("sections.additional_info")}</h3>
                    </div>
                    <FormField label={t("fields.isbn")} value={form.isbn} onChange={(v) => updateField("isbn", v)} />
                  </div>
                )}

                {/* Publish button */}
                <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t border-border pt-6 -mx-8 px-8 pb-8">
                  <button
                    onClick={handlePublish}
                    disabled={selectedAccounts.length === 0}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
                  >
                    <Sparkles size={18} />
                    {t("publish_btn")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Dropzone({ onDrop, onDragOver, onDragLeave, isDragging, onFiles, t }) {
  return (
    <label
      onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
      className={`flex flex-col items-center justify-center gap-5 w-full rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 py-20
        ${isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/40 hover:bg-muted/20"}`}
    >
      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? "bg-primary/10" : "bg-muted"}`}>
        <ImagePlus size={24} className={isDragging ? "text-primary" : "text-muted-foreground"} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold">
          {isDragging ? t.dropzone_active : t.dropzone}
        </p>
        <p className="text-xs text-muted-foreground mt-1.5">{t.dropzone_hint}</p>
      </div>
    </label>
  );
}

function FormField({ label, value, onChange, multiline = false }) {
  const base = "w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none";
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-foreground uppercase tracking-wider">{label}</label>
      {multiline
        ? <textarea rows={5} value={value} onChange={(e) => onChange(e.target.value)} className={base} />
        : <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={base} />
      }
    </div>
  );
}

function AccountSelector({ accounts, selectedAccounts, onSelect, t }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const allAccounts = [
    ...accounts.vinted.map(a => ({ ...a, platform: "vinted" })),
    ...accounts.ebay.map(a => ({ ...a, platform: "ebay" }))
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleAccount = (account) => {
    const isSelected = selectedAccounts.some(
      a => a.id === account.id && a.platform === account.platform
    );

    if (isSelected) {
      onSelect(selectedAccounts.filter(
        a => !(a.id === account.id && a.platform === account.platform)
      ));
    } else {
      onSelect([...selectedAccounts, account]);
    }
  };

  const isAccountSelected = (account) => {
    return selectedAccounts.some(
      a => a.id === account.id && a.platform === account.platform
    );
  };

  if (allAccounts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <Store size={18} className="text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{t("no_account_connected")}</p>
          <p className="text-xs text-muted-foreground">{t("connect_account_first")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 block">
        {t("select_accounts")}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors"
      >
        {selectedAccounts.length > 0 ? (
          <>
            <div className="flex -space-x-2">
              {selectedAccounts.slice(0, 3).map((account, idx) => (
                <div key={`${account.platform}-${account.id}`} className="w-10 h-10 rounded-lg overflow-hidden border-2 border-card shrink-0">
                  <img
                    src={account.platform === "vinted" ? "/vinted.jpeg" : "/ebay.png"}
                    className="w-full h-full object-cover"
                    alt={account.platform}
                  />
                </div>
              ))}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">
                {selectedAccounts.length === 1
                  ? selectedAccounts[0].username
                  : `${selectedAccounts.length} ${t("accounts_selected")}`
                }
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedAccounts.map(a => a.platform).join(", ")}
              </p>
            </div>
            <ChevronDown size={16} className={`text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Store size={18} className="text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-muted-foreground">{t("choose_accounts")}</p>
            </div>
            <ChevronDown size={16} className={`text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden z-10 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("select_platforms")}
            </p>
          </div>
          {allAccounts.map((account) => {
            const isSelected = isAccountSelected(account);
            return (
              <button
                key={`${account.platform}-${account.id}`}
                onClick={() => toggleAccount(account)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0 ${isSelected ? "bg-primary/5" : ""
                  }`}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-border shrink-0">
                  <img
                    src={account.platform === "vinted" ? "/vinted.jpeg" : "/ebay.png"}
                    className="w-full h-full object-cover"
                    alt={account.platform}
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{account.username}</p>
                  <p className="text-xs text-muted-foreground capitalize">{account.platform}</p>
                </div>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected
                  ? "bg-primary border-primary"
                  : "border-border"
                  }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


