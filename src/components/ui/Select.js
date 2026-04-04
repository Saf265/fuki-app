'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export function Select({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Sélectionner...", 
  label, 
  error,
  className 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative space-y-1.5 w-full" ref={containerRef}>
      {label && (
        <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between transition-all",
          "focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/50 focus:bg-white text-sm outline-none text-left",
          isOpen && "ring-4 ring-emerald-500/5 border-emerald-500/50 bg-white",
          error && "border-red-300 focus:ring-red-500/5 focus:border-red-500",
          className
        )}
      >
        <span className={cn(!selectedOption && "text-gray-400")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={cn("text-gray-400 transition-transform", isOpen && "rotate-180")} 
        />
      </button>

      {isOpen && (
        <ul className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl shadow-gray-900/5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-1 max-h-60 overflow-y-auto">
            {options.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-sm flex items-center justify-between rounded-lg transition-colors text-left",
                    opt.value === value 
                      ? "bg-emerald-50 text-emerald-700 font-bold" 
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {opt.label}
                  {opt.value === value && <Check size={14} className="text-emerald-500" />}
                </button>
              </li>
            ))}
          </div>
        </ul>
      )}
      
      {error && <p className="text-[10px] text-red-500 font-medium ml-1">{error}</p>}
    </div>
  );
}
