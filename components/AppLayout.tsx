"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { 
  LayoutDashboard, 
  FileText, 
  ArrowRightLeft, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Search,
  User as UserIcon,
  ShieldCheck,
  ChevronDown,
  Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AppLayoutProps {
  children: React.ReactNode;
  userRole?: string;
}

export default function AppLayout({ children, userRole = "CURSISTA" }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    { name: "Documentos", icon: <FileText size={20} />, path: "/documentos" },
    { name: "Remanejamento", icon: <ArrowRightLeft size={20} />, path: userRole === "CURSISTA" ? "/remanejamento/request" : "/tecnico/remanejamento" },
  ];

  if (userRole === "ADMIN" || userRole === "TECNICO") {
    menuItems.push({ name: "Importar Dados", icon: <Database size={20} />, path: "/tecnico/import" });
  }

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Sidebar Navigation */}
      <aside 
        className={`${isSidebarOpen ? "w-72" : "w-20"} bg-surface-container-low border-r border-surface-border transition-all duration-300 ease-in-out flex flex-col z-50`}
      >
        <div className="p-6 flex items-center gap-4 border-b border-surface-border bg-primary/5">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <ShieldCheck className="text-on-primary" size={24} />
          </div>
          {isSidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
              <span className="font-black text-primary text-xl tracking-tighter">SGM</span>
              <span className="text-[9px] uppercase font-black text-on-surface-variant tracking-tight opacity-80 leading-tight">MATRÍCULAS E GESTÃO CFDEG</span>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
                pathname === item.path 
                  ? "bg-primary text-on-primary shadow-lg shadow-primary/20" 
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className={`${pathname === item.path ? "" : "group-hover:scale-110 transition-transform"}`}>
                {item.icon}
              </span>
              {isSidebarOpen && <span className="font-bold text-sm">{item.name}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-surface-border bg-surface-container-low">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3.5 text-error rounded-2xl hover:bg-error-container hover:text-on-error-container transition-all font-bold text-sm"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Sair do Portal</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top AppBar */}
        <header className="h-20 bg-surface-container-lowest border-b border-surface-border px-8 flex items-center justify-between z-40">
          <div className="flex items-center gap-6 flex-1">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2.5 bg-surface-container rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <div className="hidden md:flex relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-40" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar no portal..."
                className="w-full bg-surface-container-low border border-surface-border rounded-full py-2.5 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2.5 text-on-surface-variant hover:bg-surface-container-high rounded-full relative transition-all">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border-2 border-surface-container-lowest"></span>
            </button>

            <div className="h-10 w-[1px] bg-surface-border mx-2"></div>

            {/* Profile Component with Google Data */}
            <div className="flex items-center gap-4 px-3 py-1.5 bg-surface-container-low border border-surface-border rounded-full hover:bg-surface-container-high transition-all cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-primary leading-none uppercase tracking-tighter">
                  {user?.displayName?.split(" ")[0] || "Usuário"}
                </p>
                <p className="text-[10px] text-on-surface-variant font-bold opacity-60">
                  {userRole}
                </p>
              </div>
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-9 h-9 rounded-full border-2 border-primary shadow-sm"
                />
              ) : (
                <div className="w-9 h-9 bg-primary text-on-primary rounded-full flex items-center justify-center font-bold shadow-sm">
                  {user?.displayName?.charAt(0) || "U"}
                </div>
              )}
              <ChevronDown size={14} className="text-on-surface-variant opacity-40" />
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto p-gutter custom-scrollbar bg-surface-container-lowest/50">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={pathname}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
