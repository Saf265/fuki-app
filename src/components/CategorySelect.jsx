"use client";

import { useDropdownPosition } from "@/hooks/use-dropdown-position";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * CategorySelect
 * Props:
 *  - categoryId : number — l'id retourné par l'IA
 *  - onChange   : ({ path, id }) => void
 */
export default function CategorySelect({ categoryId, onChange }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [path, setPath] = useState([]); // [{ label, id, children }, ...]
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const openUpward = useDropdownPosition(open, ref, 300);

  useEffect(() => {
    fetch("/api/data/groups.json")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  // Trouver le chemin vers categoryId
  useEffect(() => {
    if (!data || !categoryId) return;
    const found = findPath(data, categoryId);
    if (found) setPath(found);
  }, [data, categoryId]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const findPath = (obj, targetId, currentPath = []) => {
    for (const [label, node] of Object.entries(obj)) {
      if (node.id === targetId) {
        return [...currentPath, { label, id: node.id, children: node.children }];
      }
      if (node.children && Object.keys(node.children).length > 0) {
        const result = findPath(node.children, targetId, [...currentPath, { label, id: node.id, children: node.children }]);
        if (result) return result;
      }
    }
    return null;
  };

  const currentLevel = useMemo(() => {
    if (!data) return [];
    if (path.length === 0) return Object.entries(data).map(([label, node]) => ({ label, ...node }));
    const last = path[path.length - 1];
    return Object.entries(last.children).map(([label, node]) => ({ label, ...node }));
  }, [data, path]);

  const filteredLevel = useMemo(() => {
    if (!search.trim()) return currentLevel;
    const q = search.toLowerCase();
    return currentLevel.filter((item) => item.label.toLowerCase().includes(q));
  }, [currentLevel, search]);

  const selectCategory = (item) => {
    if (Object.keys(item.children).length > 0) {
      // A des enfants → naviguer
      setPath([...path, { label: item.label, id: item.id, children: item.children }]);
    } else {
      // Pas d'enfants → sélectionner
      const fullPath = [...path, { label: item.label, id: item.id }];
      const pathString = fullPath.map((p) => p.label).join(" > ");
      onChange({ path: pathString, id: item.id });
      setOpen(false);
      setSearch("");
    }
  };

  const goBack = () => {
    setPath(path.slice(0, -1));
  };

  const displayPath = path.length > 0 ? path.map((p) => p.label).join(" > ") : null;

  if (!data) return <div className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm text-muted-foreground">Chargement...</div>;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-left"
      >
        <span className={displayPath ? "text-foreground" : "text-muted-foreground"}>
          {displayPath || "Sélectionner une catégorie…"}
        </span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform shrink-0 ml-2 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className={`absolute z-50 w-full bg-popover border border-border rounded-xl shadow-lg overflow-hidden ${
          openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
        }`}>
          {/* Breadcrumb */}
          {path.length > 0 && (
            <div className="px-3 py-2 border-b border-border flex items-center gap-1 text-xs text-muted-foreground">
              <button onClick={() => setPath([])} className="hover:text-foreground transition-colors">
                Accueil
              </button>
              {path.map((p, i) => (
                <div key={i} className="flex items-center gap-1">
                  <ChevronRight size={12} />
                  <button
                    onClick={() => setPath(path.slice(0, i + 1))}
                    className="hover:text-foreground transition-colors"
                  >
                    {p.label}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
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

          {/* Options */}
          <ul className="max-h-60 overflow-y-auto py-1">
            {filteredLevel.length === 0 && (
              <li className="px-4 py-3 text-sm text-muted-foreground text-center">Aucun résultat</li>
            )}
            {filteredLevel.map((item) => {
              const hasChildren = Object.keys(item.children).length > 0;
              return (
                <li
                  key={item.id}
                  onClick={() => selectCategory(item)}
                  className="flex items-center justify-between px-4 py-2 text-sm cursor-pointer transition-colors hover:bg-muted/60"
                >
                  <span>{item.label}</span>
                  {hasChildren && <ChevronRight size={14} className="text-muted-foreground" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
