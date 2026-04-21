"use client";

import { MessageSquare } from "lucide-react";
import { Sidebar } from "../page";

export default function Messages() {
  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar active="messages" />

      <main
        className="flex-1 flex items-center justify-center transition-[margin-left] duration-200 ease-in-out"
        style={{ marginLeft: "var(--sidebar-w, 16rem)" }}
      >
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <div className="w-16 h-16 bg-card border border-border rounded-2xl flex items-center justify-center mx-auto mb-5">
            <MessageSquare size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Messagerie</h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Bientôt, centralisez toutes vos discussions Vinted & eBay ici.
          </p>
          <div className="mt-8">
            <span className="px-4 py-2 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">
              V2 en cours
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
