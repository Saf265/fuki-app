"use client";

import { signOut, useSession } from "@/src/lib/auth-client";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Link2,
  Loader2,
  LogOut,
  MessageSquare,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [counts, setCounts] = useState({ vinted: 0, ebay: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch("/api/connections");
        if (res.ok) {
          const data = await res.json();
          const v = data.connections?.vinted?.length || 0;
          const e = data.connections?.ebay?.length || 0;
          setCounts({ vinted: v, ebay: e, total: v + e });
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCounts();
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar active="dashboard" />

      <main
        className="flex-1 transition-[margin-left] duration-200 ease-in-out"
        style={{ marginLeft: "var(--sidebar-w, 16rem)" }}
      >
        <div className="px-10 pt-10 pb-8 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutDashboard size={14} className="text-primary" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Tableau de bord</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-10">Bienvenue sur Fuki.</p>
        </div>

        <div className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <StatCard
              label="Comptes connectés"
              value={isLoading ? <Loader2 size={18} className="animate-spin text-primary" /> : counts.total.toString()}
              icon={<Link2 size={16} />}
              color="indigo"
            />
            <StatCard
              label="eBay connectés"
              value={isLoading ? <Loader2 size={18} className="animate-spin text-primary" /> : counts.ebay.toString()}
              icon={<Store size={16} />}
              color="blue"
            />
            <StatCard
              label="Vinted connectés"
              value={isLoading ? <Loader2 size={18} className="animate-spin text-primary" /> : counts.vinted.toString()}
              icon={<ShoppingBag size={16} />}
              color="violet"
            />
          </div>

          <div className="relative overflow-hidden bg-primary rounded-xl p-7 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="relative">
              <h2 className="text-base font-semibold text-white mb-1">Commencer à automatiser</h2>
              <p className="text-sm text-white/65 max-w-sm">
                Connectez vos comptes Vinted et eBay pour démarrer l'automatisation de vos annonces.
              </p>
            </div>
            <a
              href="/dashboard/connections"
              className="relative bg-white text-primary hover:bg-white/90 px-5 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 whitespace-nowrap text-sm active:scale-95"
            >
              Connecter un compte
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 transition-colors hover:border-primary/40 group">
      <div className="flex items-center justify-between mb-3">
        <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</span>
        <span className="text-2xl font-bold text-foreground">{value}</span>
      </div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

export function Sidebar({ active }) {
  const [collapsed, setCollapsed] = useState(false);
  const { data } = useSession();
  const user = data?.user;

  // Restore persisted state on mount
  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored !== null) {
      const val = stored === "true";
      setCollapsed(val);
      document.documentElement.style.setProperty(
        "--sidebar-w",
        val ? "4rem" : "16rem",
      );
    }
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      document.documentElement.style.setProperty(
        "--sidebar-w",
        next ? "4rem" : "16rem",
      );
      return next;
    });
  };

  const links = [
    {
      id: "publish",
      label: "Publier avec l'IA",
      icon: <Sparkles size={18} />,
      href: "/dashboard/publish",
      primary: true,
    },
    {
      id: "dashboard",
      label: "Tableau de bord",
      icon: <LayoutDashboard size={18} />,
      href: "/dashboard",
    },
    {
      id: "messages",
      label: "Messagerie",
      icon: <MessageSquare size={18} />,
      href: "/dashboard/messages",
    },
    {
      id: "connections",
      label: "Connexions",
      icon: <Link2 size={18} />,
      href: "/dashboard/connections",
    },
  ];

  return (
    <aside
      className={`${collapsed ? "w-16" : "w-64"} bg-card border-r border-border flex flex-col fixed h-full z-40 transition-[width] duration-200 ease-in-out overflow-visible`}
    >
      {/* Floating collapse toggle on edge */}
      <button
        onClick={toggleCollapse}
        title={collapsed ? "Ouvrir le menu" : "Réduire le menu"}
        className="absolute -right-3 top-5 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all z-50"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Logo */}
      <div
        className={`flex items-center h-20 px-6 mb-4 transition-all ${collapsed ? "justify-center px-0" : ""}`}
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group">
          <img
            src="/logo.png"
            alt="Fuki Logo"
            className="w-6 h-6 object-contain transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        {!collapsed && (
          <span className="ml-3 font-black text-xl tracking-tighter text-foreground animate-in fade-in slide-in-from-left-2 duration-300">
            Fuki
          </span>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-3 space-y-2">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.href}
            title={collapsed ? link.label : undefined}
            className={`group flex items-center w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative
              ${collapsed ? "justify-center px-0" : "px-3 gap-3"}
              ${link.primary
                ? active === link.id
                  ? "bg-primary text-white shadow-sm shadow-primary/30"
                  : "bg-primary/10 text-primary hover:bg-primary hover:text-white hover:shadow-sm hover:shadow-primary/30"
                : active === link.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
          >
            <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
              {link.icon}
            </span>
            {!collapsed && (
              <span className="whitespace-nowrap animate-in fade-in duration-300">
                {link.label}
              </span>
            )}
          </a>
        ))}
      </nav>

      {/* Footer — user info */}
      <div className={`border-t border-border ${collapsed ? "p-3" : "p-4"}`}>
        {collapsed ? (
          <div className="flex justify-center">
            {user?.image ? (
              <img src={user.image} alt="" className="w-8 h-8 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-border flex items-center justify-center text-xs font-bold text-primary">
                {user?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {user?.image ? (
              <img src={user.image} alt="" className="w-9 h-9 rounded-full object-cover border border-border shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/10 border border-border flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {user?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name ?? "—"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email ?? "—"}</p>
            </div>
            <button
              onClick={() => signOut()}
              title="Se déconnecter"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
