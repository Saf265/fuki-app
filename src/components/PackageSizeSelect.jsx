"use client";

import { ChevronDown, Package } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export default function PackageSizeSelect({ parcelSizeId, onChange }) {
  const [open, setOpen] = useState(false);
  const [packageSizes, setPackageSizes] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    fetch("/api/data/package-sizes.json")
      .then((r) => r.json())
      .then((data) => {
        // data.package_sizes est un array: [{ id, code, title, name, description, weight_description }, ...]
        setPackageSizes(data.package_sizes || []);
      })
      .catch(console.error);
  }, []);

  const selected = useMemo(
    () => packageSizes.find((p) => Number(p.id) === Number(parcelSizeId)) ?? null,
    [parcelSizeId, packageSizes]
  );

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (pkg) => {
    onChange({ label: pkg.title, id: Number(pkg.id) });
    setOpen(false);
  };

  if (packageSizes.length === 0) {
    return <div className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm text-muted-foreground">Chargement...</div>;
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected ? selected.title : "Sélectionner une taille de colis…"}
        </span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
          <ul className="py-1">
            {packageSizes.map((pkg) => (
              <li
                key={pkg.id}
                onClick={() => select(pkg)}
                className={`px-4 py-3 cursor-pointer transition-colors border-b border-border last:border-0
                  ${Number(pkg.id) === Number(parcelSizeId) ? "bg-primary/10" : "hover:bg-muted/60"}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    Number(pkg.id) === Number(parcelSizeId) ? "bg-primary/20" : "bg-muted"
                  }`}>
                    <Package size={16} className={Number(pkg.id) === Number(parcelSizeId) ? "text-primary" : "text-muted-foreground"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm font-semibold ${
                        Number(pkg.id) === Number(parcelSizeId) ? "text-primary" : "text-foreground"
                      }`}>
                        {pkg.title}
                      </span>
                      <span className="text-xs text-muted-foreground">({pkg.weight_description})</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{pkg.description}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
