"use client";

import { ImagePlus, Sparkles, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Sidebar } from "../page";

const MAX_IMAGES = 6;

export default function Publish() {
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

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

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [images]
  );

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const removeImage = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const canAddMore = images.length < MAX_IMAGES;

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar active="publish" />

      <main
        className="flex-1 flex flex-col transition-[margin-left] duration-200 ease-in-out"
        style={{ marginLeft: "var(--sidebar-w, 16rem)" }}
      >
        {/* Header */}
        <div className="px-10 pt-10 pb-8 border-b border-border shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles size={14} className="text-primary" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Publier avec l'IA</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-10">
            Ajoutez jusqu'à 6 photos de votre article, l'IA s'occupe du reste.
          </p>
        </div>

        {/* Content — centré verticalement et horizontalement */}
        <div className="flex-1 flex items-center justify-center p-10">
          <div className="w-full max-w-lg flex flex-col gap-6">

            {/* Counter */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Photos du produit</p>
              <span className="text-xs text-muted-foreground tabular-nums">
                {images.length} / {MAX_IMAGES}
              </span>
            </div>

            {/* Dropzone principale (vide) */}
            {images.length === 0 && (
              <label
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={`flex flex-col items-center justify-center gap-5 w-full rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 py-20
                  ${isDragging
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border hover:border-primary/40 hover:bg-muted/20"
                  }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? "bg-primary/10" : "bg-muted"}`}>
                  <ImagePlus size={24} className={isDragging ? "text-primary" : "text-muted-foreground"} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">
                    {isDragging ? "Déposez vos photos ici" : "Glissez vos photos ou cliquez pour choisir"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Jusqu'à {MAX_IMAGES} images · PNG, JPG, WEBP
                  </p>
                </div>
              </label>
            )}

            {/* Grid images + slot ajout */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-xl overflow-hidden border border-border group"
                  >
                    <img
                      src={img.preview}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {i === 0 && (
                      <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/50 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                        Principale
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
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    className={`aspect-square rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-2 transition-all duration-200
                      ${isDragging
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-muted/20"
                      }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                    <ImagePlus size={18} className="text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Ajouter</p>
                  </label>
                )}
              </div>
            )}

            {/* CTA */}
            {images.length > 0 && (
              <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl transition-colors shadow-md shadow-primary/20">
                <Sparkles size={16} />
                Générer ma publication
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
