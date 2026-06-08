"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
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

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showBellMenu, setShowBellMenu] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [pushPermission, setPushPermission] = useState<string>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  const requestBrowserNotification = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission === "granted") {
        new Notification("Portal CFDEG", {
          body: "As notificações de área de trabalho foram ativadas com sucesso!",
          icon: "https://www.educacao.pr.gov.br/sites/default/arquivos_restritos/files/imagem/2025-07/estagio-probatorio690x311.png"
        });
      }
    }
  };

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

  useEffect(() => {
    if (!user?.email) return;

    let q;
    if (userRole === "CURSISTA") {
      q = query(
        collection(db, "remanejamentos"),
        where("cursistaEmail", "==", user.email.toLowerCase())
      );
    } else {
      q = query(
        collection(db, "remanejamentos"),
        where("status", "==", "PENDENTE")
      );
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      // Sort in-memory to avoid Firestore index requirements
      const sortedDocs = [...snap.docs].sort((a, b) => {
        const aTime = a.data().createdAt?.seconds || 0;
        const bTime = b.data().createdAt?.seconds || 0;
        return bTime - aTime;
      }).slice(0, 5);

      const list = sortedDocs.map(doc => {
        const data = doc.data();
        let text = "";
        let time = data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000).toLocaleTimeString() : "";
        if (userRole === "CURSISTA") {
          text = `Sua solicitação de remanejamento para modalidade/turma está com status: ${data.status}`;
        } else {
          text = `Nova solicitação pendente de ${data.nomeCompleto || data.cursistaNome || "Cursista"}`;
        }
        return {
          id: doc.id,
          text,
          time,
          status: data.status
        };
      });
      setNotifications(list);
      if (list.length > 0) {
        setHasUnread(true);
      } else {
        setHasUnread(false);
      }
    }, (err) => {
      console.error("Firestore listener error:", err);
    });

    return () => unsubscribe();
  }, [user, userRole]);

  const menuItems = [
    { name: "Início", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    { name: "Documentos", icon: <FileText size={20} />, path: "/documentos" },
    { name: "Remanejamento", icon: <ArrowRightLeft size={20} />, path: userRole === "CURSISTA" ? "/remanejamento/request" : "/tecnico/remanejamento" },
  ];

  if (userRole === "ADMIN" || userRole === "TECNICO" || userRole === "TUTOR") {
    menuItems.push({ name: "Painel de Gestão", icon: <Settings size={20} />, path: "/tecnico/dashboard" });
  }

  if (userRole === "ADMIN" || userRole === "TECNICO") {
    menuItems.push({ name: "Importar Turmas", icon: <Database size={20} />, path: "/tecnico/import" });
  }

  if (userRole === "ADMIN") {
    menuItems.push({ name: "Controle de Usuários", icon: <UserIcon size={20} />, path: "/admin/users" });
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
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 overflow-hidden">
            <img 
              src="https://www.educacao.pr.gov.br/sites/default/arquivos_restritos/files/imagem/2025-07/estagio-probatorio690x311.png" 
              alt="Logo CFDEG" 
              className="w-full h-full object-contain p-1"
            />
          </div>
          {isSidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
              <span className="font-black text-primary text-lg tracking-tighter leading-none">CFDEG</span>
              <span className="text-[8px] uppercase font-black text-on-surface-variant tracking-tight opacity-80 leading-tight mt-1">PORTAL DE MATRÍCULAS E GESTÃO</span>
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
            <div className="relative">
              <button 
                onClick={() => setShowBellMenu(!showBellMenu)}
                className="p-2.5 text-on-surface-variant hover:bg-surface-container-high rounded-full relative transition-all"
              >
                <Bell size={20} />
                {hasUnread && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border-2 border-surface-container-lowest"></span>
                )}
              </button>

              <AnimatePresence>
                {showBellMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-container-lowest border border-surface-border rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="px-5 py-4 border-b border-surface-border bg-surface-container-low flex justify-between items-center animate-none">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">Notificações</span>
                      {hasUnread && (
                        <button 
                          onClick={() => setHasUnread(false)} 
                          className="text-[10px] text-primary hover:underline font-bold"
                        >
                          Marcar como lidas
                        </button>
                      )}
                    </div>
                    
                    <div className="divide-y divide-surface-border max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-on-surface-variant italic">
                          Nenhuma notificação no momento.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            onClick={() => {
                              setShowBellMenu(false);
                              if (userRole === "CURSISTA") {
                                router.push("/remanejamento/request");
                              } else {
                                router.push("/tecnico/remanejamento");
                              }
                            }}
                            className="px-5 py-3 hover:bg-surface-container-high transition-colors cursor-pointer text-left"
                          >
                            <p className="text-xs text-on-surface leading-normal">{notif.text}</p>
                            <span className="text-[9px] text-on-surface-variant opacity-60 font-bold block mt-1">{notif.time}</span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-4 bg-primary/5 border-t border-surface-border flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-primary uppercase">Notificações no Navegador</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          pushPermission === "granted" ? "bg-emerald-500/10 text-emerald-600" :
                          pushPermission === "denied" ? "bg-red-500/10 text-red-600" :
                          "bg-amber-500/10 text-amber-600"
                        }`}>
                          {pushPermission === "granted" ? "Ativo" : pushPermission === "denied" ? "Bloqueado" : "Pendente"}
                        </span>
                      </div>

                      {pushPermission === "default" && (
                        <button
                          onClick={requestBrowserNotification}
                          className="w-full py-2 bg-primary text-on-primary text-[10px] font-black rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
                        >
                          Ativar Notificações Push
                        </button>
                      )}

                      {pushPermission === "denied" && (
                        <div className="text-[10px] text-on-surface-variant leading-relaxed bg-surface-container p-3 rounded-lg border border-surface-border text-left">
                          <span className="font-bold text-primary block mb-1">Como ativar:</span>
                          Clique no ícone de cadeado/configurações ao lado da URL no seu navegador e ative a permissão de "Notificações". Depois recarregue a página.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
