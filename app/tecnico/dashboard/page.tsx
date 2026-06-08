"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, onSnapshot } from "firebase/firestore";
import AppLayout from "@/components/AppLayout";
import { syncUserSession } from "@/services/userService";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  Database, 
  Users, 
  ArrowRightLeft, 
  FileText, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

export default function TecnicoDashboardPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>("TECNICO");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"turmas" | "matriculas" | "remanejamentos">("turmas");

  // Data States
  const [turmas, setTurmas] = useState<any[]>([]);
  const [matriculas, setMatriculas] = useState<any[]>([]);
  const [remanejamentos, setRemanejamentos] = useState<any[]>([]);

  // Search Filter
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      try {
        const { role } = await syncUserSession(user);
        if (role === "CURSISTA") {
          router.push("/dashboard");
          return;
        }
        setUserRole(role);
      } catch (err) {
        console.error(err);
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    // Listen to Turmas
    const unsubTurmas = onSnapshot(collection(db, "turmas"), (snap) => {
      setTurmas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Listen to Matriculas
    const qMatriculas = query(collection(db, "matriculas"), orderBy("createdAt", "desc"));
    const unsubMatriculas = onSnapshot(qMatriculas, (snap) => {
      setMatriculas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Listen to Remanejamentos
    const qReman = query(collection(db, "remanejamentos"), orderBy("createdAt", "desc"));
    const unsubReman = onSnapshot(qReman, (snap) => {
      setRemanejamentos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubTurmas();
      unsubMatriculas();
      unsubReman();
    };
  }, []);

  // Compute Stats
  const totalTurmas = turmas.length;
  const totalVagas = turmas.reduce((acc, t) => acc + (t.vagas_totais || t.vagas + (t.matriculados || 0) || 0), 0);
  const totalMatriculados = matriculas.length;
  const totalReman = remanejamentos.length;
  const ocupacaoPct = totalVagas > 0 ? Math.round((totalMatriculados / totalVagas) * 100) : 0;

  // Filters
  const filteredTurmas = turmas.filter(t => 
    String(t.nome_turma_matricula || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(t.componente || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(t.modalidade || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMatriculas = matriculas.filter(m => 
    String(m.cursistaNome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(m.cursistaEmail || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(m.turmaNome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(m.fluxo || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRemanejamentos = remanejamentos.filter(r => 
    String(r.nomeCompleto || r.cursistaNome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(r.cursistaEmail || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(r.tipoAlteracao || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(r.status || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
    </div>
  );

  return (
    <AppLayout userRole={userRole}>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        <header>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <Database className="text-secondary" />
            Painel de Gestão e Logs
          </h1>
          <p className="text-on-surface-variant">Acompanhe estatísticas de vagas, matrículas e remanejamentos em tempo real.</p>
        </header>

        {/* Bento Grid Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface-container-lowest border border-surface-border p-6 rounded-[2rem] flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
              <Calendar size={22} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant">Total de Turmas</p>
              <p className="text-2xl font-black text-primary">{totalTurmas}</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-surface-border p-6 rounded-[2rem] flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-secondary-container rounded-2xl flex items-center justify-center text-on-secondary-container">
              <Users size={22} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant">Inscritos / Vagas</p>
              <p className="text-2xl font-black text-primary">{totalMatriculados} / {totalVagas}</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-surface-border p-6 rounded-[2rem] flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant">Taxa de Ocupação</p>
              <p className="text-2xl font-black text-primary">{ocupacaoPct}%</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-surface-border p-6 rounded-[2rem] flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600">
              <ArrowRightLeft size={22} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant">Remanejamentos</p>
              <p className="text-2xl font-black text-primary">{totalReman}</p>
            </div>
          </div>
        </div>

        {/* Tab Controls & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-surface-container p-1 rounded-2xl border border-surface-border self-start">
            <button 
              onClick={() => { setActiveTab("turmas"); setSearchTerm(""); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === "turmas" ? "bg-primary text-on-primary shadow-md" : "text-primary hover:bg-primary/5"}`}
            >
              Vagas por Turma
            </button>
            <button 
              onClick={() => { setActiveTab("matriculas"); setSearchTerm(""); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === "matriculas" ? "bg-primary text-on-primary shadow-md" : "text-primary hover:bg-primary/5"}`}
            >
              Log de Matrículas
            </button>
            <button 
              onClick={() => { setActiveTab("remanejamentos"); setSearchTerm(""); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === "remanejamentos" ? "bg-primary text-on-primary shadow-md" : "text-primary hover:bg-primary/5"}`}
            >
              Log de Remanejamentos
            </button>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-40" size={16} />
            <input 
              type="text" 
              placeholder="Pesquisar registros..."
              className="w-full bg-surface-container-lowest border border-surface-border rounded-full py-2 pl-10 pr-4 text-xs outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-surface-container-lowest rounded-[2rem] border border-surface-border shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          <div className="flex-1 overflow-auto">
            <AnimatePresence mode="wait">
              {activeTab === "turmas" && (
                <motion.div key="turmas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
                  {filteredTurmas.length === 0 ? (
                    <div className="p-12 text-center text-on-surface-variant italic">Nenhuma turma correspondente encontrada.</div>
                  ) : (
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-surface-container-low text-primary font-bold">
                          <th className="px-4 py-3.5 rounded-l-xl">Turma</th>
                          <th className="px-4 py-3.5">Modalidade</th>
                          <th className="px-4 py-3.5">Componente</th>
                          <th className="px-4 py-3.5">Dia / Horário</th>
                          <th className="px-4 py-3.5">Formador</th>
                          <th className="px-4 py-3.5 text-center">Inscritos</th>
                          <th className="px-4 py-3.5 text-center rounded-r-xl">Vagas Livres</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {filteredTurmas.map((t, idx) => {
                          const total = t.vagas_totais || t.vagas + (t.matriculados || 0);
                          const pct = total > 0 ? Math.round(((t.matriculados || 0) / total) * 100) : 0;
                          return (
                            <tr key={t.id || idx} className="hover:bg-primary/5 transition-colors">
                              <td className="px-4 py-4 font-bold text-primary">{t.nome_turma_matricula}</td>
                              <td className="px-4 py-4">{t.modalidade}</td>
                              <td className="px-4 py-4">{t.componente}</td>
                              <td className="px-4 py-4">
                                <span className="font-semibold block">{t.dia_semana}</span>
                                <span className="text-[10px] text-on-surface-variant opacity-75">{t.horario_ini} ({t.turno})</span>
                              </td>
                              <td className="px-4 py-4">{t.formador || "A definir"}</td>
                              <td className="px-4 py-4 text-center">
                                <span className="font-bold">{t.matriculados || 0}</span> / {total}
                                <div className="w-16 bg-surface-container h-1.5 rounded-full overflow-hidden mx-auto mt-1.5">
                                  <div className="bg-primary h-full" style={{ width: `${pct}%` }} />
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${t.vagas > 0 ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"}`}>
                                  {t.vagas} Vagas
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </motion.div>
              )}

              {activeTab === "matriculas" && (
                <motion.div key="matriculas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
                  {filteredMatriculas.length === 0 ? (
                    <div className="p-12 text-center text-on-surface-variant italic">Nenhum registro de matrícula encontrado.</div>
                  ) : (
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-surface-container-low text-primary font-bold">
                          <th className="px-4 py-3.5 rounded-l-xl">Cursista</th>
                          <th className="px-4 py-3.5">E-mail</th>
                          <th className="px-4 py-3.5">Fluxo</th>
                          <th className="px-4 py-3.5">Unidade Escolar</th>
                          <th className="px-4 py-3.5">Turma Alocada</th>
                          <th className="px-4 py-3.5">Data/Hora</th>
                          <th className="px-4 py-3.5 text-center rounded-r-xl">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {filteredMatriculas.map((m, idx) => (
                          <tr key={m.id || idx} className="hover:bg-primary/5 transition-colors">
                            <td className="px-4 py-4 font-bold text-primary">{m.cursistaNome}</td>
                            <td className="px-4 py-4">{m.cursistaEmail}</td>
                            <td className="px-4 py-4">
                              <span className="bg-secondary-container text-on-secondary-container font-black px-2 py-0.5 rounded text-[10px]">
                                {m.fluxo || "EP"}
                              </span>
                            </td>
                            <td className="px-4 py-4 truncate max-w-[200px]">{m.EstabExeNome || "Não informado"}</td>
                            <td className="px-4 py-4 font-semibold">{m.turmaNome}</td>
                            <td className="px-4 py-4 text-on-surface-variant">
                              {m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000).toLocaleString() : "A definir"}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 rounded-full font-bold text-[10px]">
                                {m.status || "CONFIRMADA"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </motion.div>
              )}

              {activeTab === "remanejamentos" && (
                <motion.div key="remanejamentos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
                  {filteredRemanejamentos.length === 0 ? (
                    <div className="p-12 text-center text-on-surface-variant italic">Nenhum registro de remanejamento encontrado.</div>
                  ) : (
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-surface-container-low text-primary font-bold">
                          <th className="px-4 py-3.5 rounded-l-xl">Cursista</th>
                          <th className="px-4 py-3.5">E-mail</th>
                          <th className="px-4 py-3.5">Tipo Alteração</th>
                          <th className="px-4 py-3.5">Turma Origem</th>
                          <th className="px-4 py-3.5">Pretendido / Detalhes</th>
                          <th className="px-4 py-3.5">Solicitado Em</th>
                          <th className="px-4 py-3.5 text-center rounded-r-xl">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {filteredRemanejamentos.map((r, idx) => (
                          <tr key={r.id || idx} className="hover:bg-primary/5 transition-colors">
                            <td className="px-4 py-4 font-bold text-primary">{r.nomeCompleto || r.cursistaNome || "Cursista"}</td>
                            <td className="px-4 py-4">{r.cursistaEmail}</td>
                            <td className="px-4 py-4 font-semibold text-secondary">{r.tipoAlteracao}</td>
                            <td className="px-4 py-4">{r.turmaOrigemNome || "Não informada"}</td>
                            <td className="px-4 py-4">
                              {r.tipoAlteracao === "Turma (horário)" && (
                                <span className="block font-medium">Horário: {r.atHorarioPretendido}</span>
                              )}
                              {r.tipoAlteracao === "Modalidade" && (
                                <span className="block font-medium">Modalidade: {r.amModalidadeDestino}</span>
                              )}
                              <span className="text-[10px] text-on-surface-variant opacity-75 truncate block max-w-[250px]" title={r.atJustificativa || r.justificativa}>
                                {r.atJustificativa || r.justificativa || "Sem justificativa"}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-on-surface-variant">
                              {r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleString() : "A definir"}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                r.status === "PENDENTE" 
                                  ? "bg-amber-500/10 text-amber-700" 
                                  : r.status === "DEFERIDO" || r.status === "APROVADO"
                                    ? "bg-emerald-500/10 text-emerald-700" 
                                    : "bg-red-500/10 text-red-700"
                              }`}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
