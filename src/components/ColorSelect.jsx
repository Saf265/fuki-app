"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const R2_COLORS_URL = "/api/data/colors.json";

function ColorSwatch({ hex, size = 16 }) {
  if (!hex) {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
          display: "inline-block",
          flexShrink: 0,
          border: "1px solid rgba(0,0,0,0.15)",
        }}
      />
    );
  }
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: hex,
        display: "inline-block",
        flexShrink: 0,
        border: hex === "#FFFFFF" || hex === "#FFFDD0" || hex === "#F5F0DC"
          ? "1px solid rgba(0,0,0,0.15)"
          : "1px solid transparent",
      }}
    />
  );
}

/**
 * ColorSelect — multi-select
 * Props:
 *  - colorIds : string[]  — ids retournés par l'IA
 *  - onChange : (colors: { id, label, hex }[]) => void
 */
export default function ColorSelect({ colorIds = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [colors, setColors] = useState([]);
  const [selected, setSelected] = useState([]);
  const ref = useRef(null);

  // Charger les couleurs depuis R2
  useEffect(() => {
    fetch(R2_COLORS_URL)
      .then((r) => r.json())
      .then(setColors)
      .catch(console.error);
  }, []);

  // Pré-sélectionner depuis colorIds
  useEffect(() => {
    if (!colors.length || !colorIds.length) return;
    const preSelected = colors.filter((c) => colorIds.map(String).includes(String(c.id)));
    setSelected(preSelected);
  }, [colors, colorIds.join(",")]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (color) => {
    const next = selected.find((s) => s.id === color.id)
      ? selected.filter((s) => s.id !== color.id)
      : [...selected, color];
    setSelected(next);
    onChange(next);
  };

  const remove = (id, e) => {
    e.stopPropagation();
    const next = selected.filter((s) => s.id !== id);
    setSelected(next);
    onChange(next);
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full min-h-[42px] flex items-center flex-wrap gap-1.5 bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-left"
      >
        {selected.length === 0 ? (
          <span className="text-muted-foreground flex-1">Sélectionner des couleurs…</span>
        ) : (
          <>
            {selected.map((c) => (
              <span
                key={c.id}
                className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-2 py-0.5 text-xs font-medium"
              >
                <ColorSwatch hex={c.hex} size={12} />
                {c.label}
                <button
                  onClick={(e) => remove(c.id, e)}
                  className="text-muted-foreground hover:text-foreground transition-colors ml-0.5"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </>
        )}
        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform ml-auto shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
          <ul className="max-h-60 overflow-y-auto py-1">
            {colors.length === 0 && (
              <li className="px-4 py-3 text-sm text-muted-foreground text-center">Chargement…</li>
            )}
            {colors.map((color) => {
              const isSelected = selected.some((s) => s.id === color.id);
              return (
                <li
                  key={color.id}
                  onClick={() => toggle(color)}
                  className={`flex items-center gap-3 px-4 py-2 text-sm cursor-pointer transition-colors
                    ${isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/60"}`}
                >
                  <ColorSwatch hex={color.hex} size={16} />
                  <span className="flex-1">{color.label}</span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
