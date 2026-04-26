"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export default function StatusSelect({ statusId, onChange }) {
  const [open, setOpen] = useState(false);
  const [statuses, setStatuses] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    fetch("/api/data/statutuses.json")
      .then((r) => r.json())
      .then((data) => {
        // Gérer array ou objet
        if (Array.isArray(data)) {
          setStatuses(data);
        } else {
          setStatuses(Object.entries(data).map(([label, id]) => ({ id: String(id), label })));
        }
      })
      .catch(console.error);
  }, []);

  const selected = useMemo(
    () => statuses?.find((s) => s.id === String(statusId)) ?? null,
    [statusId, statuses]
  );

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (status) => {
    onChange({ label: status.label, id: status.id });
    setOpen(false);
  };

  if (!statuses) return <div className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm text-muted-foreground">Chargement...</div>;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected ? selected.label : "Sélectionner un état…"}
        </span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
          <ul className="py-1">
            {statuses.map((status) => (
              <li
                key={status.id}
                onClick={() => select(status)}
                className={`px-4 py-2 text-sm cursor-pointer transition-colors
                  ${status.id === String(statusId) ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/60"}`}
              >
                {status.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
