"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import AppLayout from "@/components/AppLayout";
import { syncUserSession, getTutoriariosMatriculas } from "@/services/userService";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  Users,
  School,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  GraduationCap,
  MapPin,
  User as UserIcon
} from "lucide-react";

interface MatriculaTutor {
  id: string;
  cursistaNome: string;
  cursistaEmail: string;
  turmaNome: string;
  fluxo: string;
  status: string;
  createdAt: any;
  EstabExeNome?: string;
  anoFormativo?: string;
}

export default function TutorPage() {
  const router = useRouter();
  const [matriculas, setMatriculas] = useState<MatriculaTutor[]>([]);
  const [userRole, setUserRole] = useState<string>("TUTOR");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCursista, setSelectedCursista] = useState<string | null>(null);

  useEffect(() => {
    const initializeTutorPage = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const { role } = await syncUserSession(user);
        
        if (role !== "TUTOR") {
          setError("Acesso negado. Apenas TUTOREs podem acessar esta página.");
          setLoading(false);
          return;
        }

        setUserRole(role);

        // Buscar matrículas dos cursistas que este tutor acompanha
        const tutorMatriculas = await getTutoriariosMatriculas(user.email!);
        
        // Configurar listener em tempo real para atualizações futuras
        const matriculasRef = collection(db, "matriculas");
        const cursistasNomes = [...new Set(tutorMatriculas.map(m => m.cursistaNome))];
        
        if (cursistasNomes.length === 0) {
          setMatriculas([]);
          setLoading(false);
          return;
        }

        // Criar queries para cada cursista
        const unsubscribers = cursistasNomes.map(nome =>
          onSnapshot(
            query(
              matriculasRef,
              where("cursistaNome", "==", nome),
              orderBy("createdAt", "desc")
            ),
            (snap) => {
              const docs = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              } as MatriculaTutor));
              
              setMatriculas(prev => {
                const others = prev.filter(m => m.cursistaNome !== nome);
                return [...others, ...docs].sort((a, b) => 
                  (b.createdAt?.toDate?.() || new Date()) - (a.createdAt?.toDate?.() || new Date())
                );
              });
            }
          )
        );

        setLoading(false);

        return () => {
          unsubscribers.forEach(unsub => unsub());
        };
      } catch (err) {
        console.error("Erro ao inicializar página do Tutor:", err);
        setError("Erro ao carregar dados. Tente novamente.");
        setLoading(false);
      }
    };

    const cleanup = initializeTutorPage();
    return () => {
      cleanup?.then(fn => fn?.());
    };
  }, [router]);

  const getCursistasUnicos = () => {
    const cursistas = new Map<string, { nome: string; email: string; totalMatriculas: number }>();
    
    matriculas.forEach(m => {
      const existing = cursistas.get(m.cursistaEmail);
      if (existing) {
        cursistas.set(m.cursistaEmail, { 
          ...existing, 
          totalMatriculas: existing.totalMatriculas + 1 
        });
      } else {
        cursistas.set(m.cursistaEmail, {
          nome: m.cursistaNome,
          email: m.cursistaEmail,
          totalMatriculas: 1
        });
      }
    });
    
    return Array.from(cursistas.values());
  };

  const getMatriculasCursista = (cursistaEmail: string) => {
    return matriculas.filter(m => m.cursistaEmail === cursistaEmail);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Data desconhecida";
    const date = timestamp.toDate?.() || new Date(timestamp);
    return new Intl.DateTimeFormat("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMADA":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "PENDENTE":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "CANCELADA":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMADA":
        return <CheckCircle2 size={16} />;
      case "PENDENTE":
        return <Clock size={16} />;
      case "CANCELADA":
        return <AlertCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  if (loading) {
    return (
      <AppLayout userRole={userRole}>
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-on-surface-variant text-sm font-medium">Carregando dados dos cursistas...</p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout userRole={userRole}>
        <div className="max-w-6xl mx-auto p-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-error-container/20 border border-error-container rounded-2xl p-8 text-center"
          >
            <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
            <p className="text-error font-bold text-lg">{error}</p>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  const cursistasUnicos = getCursistasUnicos();

  return (
    <AppLayout userRole={userRole}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
              <GraduationCap className="text-primary" size={32} />
              Acompanhamento de Cursistas
            </h1>
            <p className="text-on-surface-variant mt-2">
              Monitore em tempo real as matrículas dos cursistas que você acompanha
            </p>
          </div>
          
          <div className="flex gap-4 bg-surface-container p-4 rounded-2xl border border-surface-border">
            <div className="flex flex-col items-center">
              <Users className="text-primary mb-2" size={24} />
              <p className="text-[10px] uppercase text-on-surface-variant font-bold">Cursistas</p>
              <p className="text-2xl font-black text-primary">{cursistasUnicos.length}</p>
            </div>
            <div className="h-12 w-[1px] bg-surface-border"></div>
            <div className="flex flex-col items-center">
              <School className="text-secondary mb-2" size={24} />
              <p className="text-[10px] uppercase text-on-surface-variant font-bold">Matrículas</p>
              <p className="text-2xl font-black text-secondary">{matriculas.length}</p>
            </div>
          </div>
        </motion.header>

        {cursistasUnicos.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-container-lowest p-20 rounded-[2rem] text-center border-2 border-dashed border-surface-border text-on-surface-variant"
          >
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-6 opacity-40">
              <Users size={40} />
            </div>
            <p className="text-lg font-bold">Nenhum cursista vinculado</p>
            <p className="text-sm opacity-60">Você ainda não tem cursistas para acompanhar.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {cursistasUnicos.map((cursista, idx) => {
                const matriculasCursista = getMatriculasCursista(cursista.email);
                const isSelected = selectedCursista === cursista.email;

                return (
                  <motion.div
                    key={cursista.email}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-surface-container-low border border-surface-border rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-all"
                  >
                    {/* Cursista Card Header */}
                    <button
                      onClick={() => setSelectedCursista(isSelected ? null : cursista.email)}
                      className="w-full p-6 flex items-center justify-between hover:bg-surface-container-high transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <UserIcon className="text-primary" size={24} />
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-on-surface">{cursista.nome}</h3>
                          <p className="text-xs text-on-surface-variant">{cursista.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-black text-primary">{matriculasCursista.length}</p>
                          <p className="text-[10px] text-on-surface-variant uppercase font-bold">Matrículas</p>
                        </div>
                        <Eye className={`transition-transform ${isSelected ? "rotate-180" : ""}`} size={20} />
                      </div>
                    </button>

                    {/* Matrículas Expandidas */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-surface-border bg-surface-container-lowest"
                        >
                          <div className="p-6 space-y-4">
                            {matriculasCursista.map((matricula, midx) => (
                              <motion.div
                                key={matricula.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: midx * 0.1 }}
                                className="bg-surface-container rounded-xl p-4 border border-surface-border"
                              >
                                <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2">
                                      <School size={16} className="text-primary" />
                                      <span className="font-bold text-on-surface">{matricula.turmaNome}</span>
                                    </div>
                                    
                                    {matricula.EstabExeNome && (
                                      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                                        <MapPin size={14} />
                                        <span>{matricula.EstabExeNome}</span>
                                      </div>
                                    )}
                                    
                                    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                                      <Calendar size={14} />
                                      <span>{formatDate(matricula.createdAt)}</span>
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-2 md:items-end">
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${getStatusColor(matricula.status)}`}>
                                      {getStatusIcon(matricula.status)}
                                      {matricula.status}
                                    </div>
                                    
                                    {matricula.fluxo && (
                                      <span className="text-xs bg-secondary/10 text-secondary px-3 py-1.5 rounded-full font-bold">
                                        {matricula.fluxo}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
