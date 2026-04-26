"use client";

import { ChevronDown, Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function BrandSelect({ brandId, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const ref = useRef(null);
  const debounceTimer = useRef(null);

  // Résoudre le label de la marque pré-sélectionnée via brandId
  useEffect(() => {
    if (!brandId) return;
    fetch(`/api/brands/search?limit=2000`)
      .then((r) => r.json())
      .then((data) => {
        const found = data.brands?.find((b) => b.id === String(brandId));
        if (found) setSelected(found);
      })
      .catch(console.error);
  }, [brandId]);

  // Charger les 50 premières à l'ouverture
  useEffect(() => {
    if (!open) return;
    if (brands.length > 0 && !search) return;
    fetchBrands(search);
  }, [open]);

  // Debounce sur la recherche
  useEffect(() => {
    if (!open) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchBrands(search), 300);
    return () => clearTimeout(debounceTimer.current);
  }, [search]);

  const fetchBrands = (q) => {
    setLoading(true);
    fetch(`/api/brands/search?q=${encodeURIComponent(q)}&limit=50`)
      .then((r) => r.json())
      .then((data) => { setBrands(data.brands || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (brand) => {
    setSelected(brand);
    onChange(brand);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected ? selected.label : "Sélectionner une marque…"}
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
              placeholder="Rechercher une marque…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {loading && <Loader2 size={13} className="text-muted-foreground animate-spin" />}
          </div>

          <ul className="max-h-52 overflow-y-auto py-1">
            {!loading && brands.length === 0 && (
              <li className="px-4 py-3 text-sm text-muted-foreground text-center">Aucun résultat</li>
            )}
            {brands.map((brand) => (
              <li
                key={brand.id}
                onClick={() => select(brand)}
                className={`px-4 py-2 text-sm cursor-pointer transition-colors
                  ${brand.id === selected?.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/60"}`}
              >
                {brand.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
