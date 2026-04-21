"use client";

import {
  LayoutDashboard,
  Link2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarFooter, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarProvider, 
  SidebarTrigger,
  SidebarRail,
  useSidebar
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  
  const links = [
    {
      id: "dashboard",
      label: "Tableau de bord",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      id: "messages",
      label: "Messagerie",
      icon: MessageSquare,
      href: "/dashboard/messages",
    },
    {
      id: "connections",
      label: "Connexions",
      icon: Link2,
      href: "/dashboard/connections",
    },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar/50 backdrop-blur-xl">
      <SidebarHeader className="h-16 flex flex-row items-center px-4 gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
          <img src="/logo.png" alt="Fuki" className="w-5 h-5" />
        </div>
        <span className="font-black text-lg tracking-tighter group-data-[collapsible=icon]:hidden">
          Fuki
        </span>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <SidebarMenuItem key={link.id}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  tooltip={link.label}
                  className={cn(
                    "transition-all duration-200",
                    isActive ? "bg-primary/20 text-primary hover:bg-primary/30" : "hover:bg-muted/50"
                  )}
                >
                  <Link href={link.href} className="flex items-center gap-3 w-full">
                    <link.icon size={18} />
                    <span className="font-semibold">{link.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50 group-data-[collapsible=icon]:hidden">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-50">
          Fuki v1.0.0
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
