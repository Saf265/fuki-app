"use client";

import { ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export default function SizeSelect({ sizeId, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sizesData, setSizesData] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    fetch("/api/data/sizes.json")
      .then((r) => r.json())
      .then(setSizesData)
      .catch(console.error);
  }, []);

  const allSizes = useMemo(() => {
    if (!sizesData) return [];
    const result = [];
    for (const group of Object.values(sizesData)) {
      for (const [label, id] of Object.entries(group)) {
        if (!result.find((s) => s.id === id)) {
          result.push({ label, id });
        }
      }
    }
    return result;
  }, [sizesData]);

  const selected = useMemo(
    () => allSizes.find((s) => s.id === sizeId) ?? null,
    [sizeId, allSizes]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return allSizes;
    const q = search.toLowerCase();
    return allSizes.filter((s) => s.label.toLowerCase().includes(q));
  }, [search, allSizes]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (size) => {
    onChange(size);
    setOpen(false);
    setSearch("");
  };

  if (!sizesData) return <div className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm text-muted-foreground">Chargement...</div>;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected ? selected.label : "Sélectionner une taille…"}
        </span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search size={13} className="text-muted-foreground shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-muted-foreground text-center">Aucun résultat</li>
            )}
            {filtered.map((size) => (
              <li
                key={size.id}
                onClick={() => select(size)}
                className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer transition-colors
                  ${size.id === sizeId ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/60"}`}
              >
                <span>{size.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
