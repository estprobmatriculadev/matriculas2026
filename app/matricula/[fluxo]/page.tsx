"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { processarPerfilCursista, UserVinculo } from "@/services/userService";
import { efetivarMatricula } from "@/services/registrationService";
import AppLayout from "@/components/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft, 
  Filter,
  Users,
  Clock,
  Calendar
} from "lucide-react";

interface PageProps {
  params: Promise<{ fluxo: string }>;
}

export default function MatriculaPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const fluxoSolicitado = resolvedParams.fluxo as "EP" | "PEDFOR";
  
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [perfil, setPerfil] = useState<UserVinculo[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTurma, setSelectedTurma] = useState<string | null>(null);
  const [protocolo, setProtocolo] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        await carregarDados(u.email!);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [fluxoSolicitado]);

  const carregarDados = async (email: string) => {
    try {
      const docRef = doc(db, "cursistas", email.toLowerCase());
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        setError("Seu cadastro não foi encontrado na base de dados.");
        setLoading(false);
        return;
      }

      const vinculos = processarPerfilCursista([docSnap.data()]);
      setPerfil(vinculos);

      const q = query(collection(db, "turmas"), where("vagas", ">", 0));
      const turmasSnap = await getDocs(q);
      const todasTurmas = turmasSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const turmasFiltradas = todasTurmas.filter((t: any) => {
        if (fluxoSolicitado === "EP") {
          const matchModalidade = vinculos.some(v => v.modalidade_calc === t.modalidade);
          const matchAno = vinculos.some(v => v.ano_formativo_calc === t.ano_formativo);
          return matchModalidade && matchAno;
        }
        return true;
      });

      setTurmas(turmasFiltradas);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleMatricula = async () => {
    if (!selectedTurma || !user || perfil.length === 0) return;
    
    setLoading(true);
    const result = await efetivarMatricula({
      cursistaEmail: user.email,
      cursistaNome: perfil[0].DiscFuncExeNome || user.displayName || "Cursista",
      turmaId: selectedTurma,
      fluxo: fluxoSolicitado,
      EstabExeNome: perfil[0].EstabExeNome,
    });

    if (result.success) {
      setProtocolo(result.matriculaId || "OK");
    } else {
      setError(result.error || "Erro desconhecido");
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
    </div>
  );

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-primary font-bold text-sm mb-2 hover:underline">
              <ArrowLeft size={16} /> Voltar ao Dashboard
            </button>
            <h1 className="text-3xl font-bold text-primary">Matrícula {fluxoSolicitado}</h1>
            <p className="text-on-surface-variant">{perfil[0]?.EstabExeNome}</p>
          </div>
          <div className="bg-surface-container px-6 py-3 rounded-2xl border border-surface-border">
            <p className="text-[10px] uppercase font-bold text-primary opacity-60">Status</p>
            <p className="font-bold text-primary">Janela Aberta - 2026</p>
          </div>
        </header>

        <AnimatePresence>
          {protocolo ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-surface-container-lowest p-12 rounded-[2rem] text-center shadow-xl border border-surface-border">
              <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-primary mb-2">Matrícula Realizada!</h2>
              <p className="text-on-surface-variant mb-8 max-w-md mx-auto">Sua inscrição no fluxo {fluxoSolicitado} foi confirmada com sucesso. Você receberá o comprovante em seu e-mail institucional.</p>
              
              <div className="bg-surface-container p-6 rounded-2xl mb-8 max-w-sm mx-auto">
                <p className="text-xs uppercase font-bold text-primary opacity-40 mb-1">ID da Matrícula</p>
                <p className="text-2xl font-mono font-bold text-primary tracking-wider">{protocolo}</p>
              </div>

              <button onClick={() => router.push("/dashboard")} className="btn-primary px-12 py-3 rounded-full">
                Ir para o Dashboard
              </button>
            </motion.div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Sidebar Info */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-surface-container-lowest p-6 rounded-[2rem] border border-surface-border shadow-sm">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Filter size={16} /> Perfil do Servidor
                  </h3>
                  <div className="space-y-6">
                    <div className="bg-surface-container-low p-4 rounded-xl">
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">Modalidade</p>
                      <p className="font-bold text-primary">{perfil[0]?.modalidade_calc}</p>
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-xl">
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">Ano Formativo</p>
                      <p className="font-bold text-secondary">{perfil[0]?.ano_formativo_calc}</p>
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-xl">
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">Componente</p>
                      <p className="font-bold">{perfil[0]?.componente_matriz}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-secondary-container/20 border border-secondary-container/40 text-on-secondary-container text-xs leading-relaxed">
                  <p><strong>Atenção:</strong> Escolha com cuidado. O sistema permite apenas uma matrícula ativa por ciclo formativo.</p>
                </div>
              </div>

              {/* Turmas List */}
              <div className="lg:col-span-2 space-y-6">
                {error && (
                  <div className="bg-error-container text-on-error-container p-4 rounded-2xl flex gap-3 items-center">
                    <AlertCircle size={20} />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <h2 className="text-xl font-bold text-primary flex items-center gap-3 px-2">
                  Opções Disponíveis
                  <span className="bg-primary-container text-on-primary-container text-[10px] px-3 py-1 rounded-full font-bold">{turmas.length} TURMAS</span>
                </h2>

                <div className="space-y-4">
                  {turmas.length === 0 ? (
                    <div className="bg-surface-container-lowest p-12 rounded-[2rem] text-center border-2 border-dashed border-surface-border text-on-surface-variant">
                      Não encontramos turmas compatíveis para o seu perfil no momento.
                    </div>
                  ) : (
                    turmas.map(t => (
                      <motion.div 
                        key={t.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => setSelectedTurma(t.id)}
                        className={`bg-surface-container-lowest p-6 rounded-[2rem] cursor-pointer transition-all border-2 ${selectedTurma === t.id ? 'border-primary shadow-lg' : 'border-transparent hover:border-surface-border'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-bold text-xl text-primary">{t.nome_turma_matricula}</h4>
                              <p className="text-on-surface-variant flex items-center gap-2 mt-1">
                                <Users size={14} /> Formador: {t.formador}
                              </p>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              <span className="bg-surface-container px-3 py-1 rounded-full text-[10px] font-bold text-primary flex items-center gap-1">
                                <Calendar size={10} /> {t.dia_semana}
                              </span>
                              <span className="bg-surface-container px-3 py-1 rounded-full text-[10px] font-bold text-primary flex items-center gap-1">
                                <Clock size={10} /> {t.horario_ini} - {t.turno}
                              </span>
                            </div>
                          </div>
                          <div className="text-right bg-primary/5 p-4 rounded-2xl min-w-[80px]">
                            <p className="text-3xl font-black text-primary">{t.vagas}</p>
                            <p className="text-[10px] uppercase font-bold text-primary opacity-40">vagas</p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                <div className="pt-8">
                  <button
                    onClick={handleMatricula}
                    disabled={!selectedTurma || loading}
                    className="w-full py-5 bg-primary text-on-primary font-bold rounded-full shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "Confirmar Minha Inscrição"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
