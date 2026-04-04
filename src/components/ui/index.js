import { cn } from "@/src/lib/utils";
import { Loader2 } from "lucide-react";
export { Select } from "./Select";

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  className, 
  ...props 
}) {
  const base = "inline-flex items-center justify-center font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-primary text-white shadow-lg shadow-emerald-500/20 hover:bg-primary-hover",
    secondary: "bg-white text-gray-900 border border-gray-100 shadow-sm hover:bg-gray-50",
    outline: "bg-transparent border border-gray-200 text-gray-600 hover:border-primary hover:text-primary",
    ghost: "bg-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-900",
    danger: "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[11px] rounded-lg",
    md: "px-5 py-2.5 text-sm rounded-xl",
    lg: "px-8 py-4 text-base rounded-2xl"
  };

  return (
    <button 
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ children, className, ...props }) {
  return (
    <div 
      className={cn("bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden", className)} 
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return <div className={cn("px-6 py-4 border-b border-gray-50", className)}>{children}</div>;
}

export function CardBody({ children, className }) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

export function Input({ label, error, className, ...props }) {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider ml-1">{label}</label>}
      <input 
        className={cn(
          "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none transition-all",
          "focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/50 focus:bg-white placeholder:text-gray-300 text-sm",
          error && "border-red-300 focus:ring-red-500/5 focus:border-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-[10px] text-red-500 font-medium ml-1">{error}</p>}
    </div>
  );
}

export function Badge({ children, variant = 'primary', className }) {
  const variants = {
    primary: "bg-emerald-50 text-emerald-700 border-emerald-100",
    secondary: "bg-gray-50 text-gray-600 border-gray-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    danger: "bg-red-50 text-red-700 border-red-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100"
  };

  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
