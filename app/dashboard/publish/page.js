"use client";

import BrandSelect from "@/components/BrandSelect";
import CategorySelect from "@/components/CategorySelect";
import ColorSelect from "@/components/ColorSelect";
import PackageSizeSelect from "@/components/PackageSizeSelect";
import SizeSelect from "@/components/SizeSelect";
import StatusSelect from "@/components/StatusSelect";
import { ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState } from "react";
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
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

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
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors shadow-md shadow-primary/20"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {loading ? t("generating") : t("generate")}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ── État résultat : layout 2 colonnes ── */
          <div className="flex-1 flex overflow-hidden">
            {/* Colonne gauche : images + covers */}
            <div className="w-72 shrink-0 border-r border-border flex flex-col gap-4 p-5 overflow-y-auto">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Photos</p>
                <span className="text-xs text-muted-foreground">{images.length}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-black/50 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm leading-none">
                        1ère
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
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-xl flex flex-col gap-5">
                <p className="text-sm font-semibold">{t("listing_details")}</p>

                <FormField label={t("fields.title")} value={form.title} onChange={(v) => updateField("title", v)} />
                <FormField label={t("fields.description")} value={form.description} onChange={(v) => updateField("description", v)} multiline />

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">{t("fields.brand")}</label>
                    <BrandSelect
                      brandId={hiddenFields.brand_id}
                      onChange={({ label, id }) => {
                        updateField("brand", label);
                        setHiddenFields((prev) => ({ ...prev, brand_id: String(id) }));
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">{t("fields.condition")}</label>
                    <StatusSelect
                      statusId={hiddenFields.status_id}
                      onChange={({ label, id }) => {
                        updateField("condition", label);
                        setHiddenFields((prev) => ({ ...prev, status_id: String(id) }));
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{t("fields.category")}</label>
                  <CategorySelect
                    categoryId={hiddenFields.category_id ? Number(hiddenFields.category_id) : null}
                    onChange={({ path, id }) => {
                      updateField("category_path", path);
                      setHiddenFields((prev) => ({ ...prev, category_id: String(id) }));
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">{t("fields.size")}</label>
                    <SizeSelect
                      sizeId={hiddenFields.size_id ? Number(hiddenFields.size_id) : null}
                      onChange={({ label, id }) => {
                        updateField("size", label);
                        setHiddenFields((prev) => ({ ...prev, size_id: String(id) }));
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">{t("fields.colors")}</label>
                    <ColorSelect
                      colorIds={hiddenFields.color_ids ?? []}
                      onChange={(colors) => {
                        updateField("colors", colors.map((c) => c.label).join(", "));
                        setHiddenFields((prev) => ({ ...prev, color_ids: colors.map((c) => c.id) }));
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{t("fields.parcel_size")}</label>
                  <PackageSizeSelect
                    parcelSizeId={hiddenFields.parcel_size_id}
                    onChange={({ label, id }) => {
                      updateField("parcel_size", label);
                      setHiddenFields((prev) => ({ ...prev, parcel_size_id: id }));
                    }}
                  />
                </div>

                {form.isbn && (
                  <FormField label={t("fields.isbn")} value={form.isbn} onChange={(v) => updateField("isbn", v)} />
                )}

                <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-colors shadow-md shadow-primary/20 mt-2">
                  <Sparkles size={16} />
                  {t("publish_btn")}
                </button>
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
  const base = "w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {multiline
        ? <textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} className={base} />
        : <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={base} />
      }
    </div>
  );
}

