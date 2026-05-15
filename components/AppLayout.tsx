"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

interface AppLayoutProps {
  children: React.ReactNode;
  userRole?: string;
}

export default function AppLayout({ children, userRole }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = auth.currentUser;

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const navItems = [
    { label: "Dashboard", icon: "dashboard", href: "/dashboard", active: pathname === "/dashboard" },
    { label: "Importar Dados", icon: "upload_file", href: "/tecnico/import", roles: ["ADMIN", "TECNICO"] },
    { label: "Remanejamento", icon: "move_up", href: "/tecnico/remanejamento", roles: ["ADMIN", "TECNICO"] },
    { label: "Documentos", icon: "description", href: "/documentos", active: pathname === "/documentos" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* SideNavBar Shell */}
      <aside className="flex flex-col h-screen w-64 fixed left-0 top-0 bg-primary shadow-md z-50">
        <div className="px-6 py-8 mb-8">
          <h1 className="text-xl font-bold text-on-primary">Educação</h1>
          <p className="text-xs text-on-primary opacity-70">Gestão Administrativa</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            (!item.roles || item.roles.includes(userRole || "")) && (
              <button
                key={item.label}
                onClick={() => router.push(item.href)}
                className={`flex items-center gap-3 w-[calc(100%-16px)] mx-2 px-4 py-2.5 rounded-full transition-all active:scale-95 duration-200 ${
                  item.active 
                    ? "bg-secondary-container text-on-secondary-container font-bold" 
                    : "text-on-primary opacity-80 hover:bg-primary-container"
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </button>
            )
          ))}
        </nav>

        <div className="mt-auto border-t border-on-primary/10 pt-4 px-2 pb-6 space-y-1">
          <button 
            onClick={() => router.push("/documentos")}
            className="flex items-center gap-3 w-full text-on-primary opacity-80 px-4 py-2.5 hover:bg-primary-container rounded-lg transition-all"
          >
            <span className="material-symbols-outlined">contact_support</span>
            <span className="text-sm">Suporte</span>
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full text-on-primary opacity-80 px-4 py-2.5 hover:bg-primary-container rounded-lg transition-all"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex flex-col flex-1">
        {/* TopAppBar Shell */}
        <header className="flex justify-between items-center w-full px-8 h-16 bg-surface-container-lowest border-b border-surface-border sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <span className="text-xl font-bold text-primary">SGM - Portal PR</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="flex items-center gap-3 ml-4 bg-surface-container-low px-4 py-1.5 rounded-full border border-surface-border">
              <span className="text-xs font-semibold text-on-surface">
                {user?.displayName || user?.email}
              </span>
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                account_circle
              </span>
            </div>
          </div>
        </header>

        {/* Canvas */}
        <div className="p-8 max-w-[1280px] w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
