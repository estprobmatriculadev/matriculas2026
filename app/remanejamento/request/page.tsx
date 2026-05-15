"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowRightLeft, 
  Send, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowLeft,
  User,
  FileText,
  Upload,
  ChevronRight,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { solicitarRemanejamento } from "@/services/remanejamentoService";
import AppLayout from "@/components/AppLayout";
import { syncUserSession } from "@/services/userService";

export default function RequestRemanejamentoPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userRole, setUserRole] = useState<string>("CURSISTA");
  const [matricula, setMatricula] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Form State based on CSV fields
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    rg: "",
    cpf: "",
    telefone: "",
    padroesEstagio: "1 Padrão",
    tipoAlteracao: "Turma (horário)", // Turma, Modalidade, Vínculo
    
    // AT Fields
    atComponente: "",
    atAnoFormativo: "1º Ano",
    atHorarioAtual: "",
    atHorarioPretendido: "",
    atJustificativa: "",
    
    // AM Fields
    amModalidadeAtual: "",
    amModalidadeDestino: "",
    amHorarioPretendido: "",
    
    // EP Fields (Vínculos)
    epDoisPadroes: "Sim",
    epDesejaUnificar: "Sim"
  });

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) { router.push("/login"); return; }

      try {
        const { role } = await syncUserSession(user);
        setUserRole(role);
        
        if (role !== "CURSISTA") {
          setError("Acesso restrito a cursistas.");
          setLoading(false);
          return;
        }

        const qM = query(collection(db, "matriculas"), where("cursistaEmail", "==", user.email), orderBy("createdAt", "desc"), limit(1));
        const snapM = await getDocs(qM);
        if (!snapM.empty) {
          const mData = snapM.docs[0].data();
          setMatricula({ id: snapM.docs[0].id, ...mData });
          setFormData(prev => ({
            ...prev,
            nomeCompleto: mData.cursistaNome || user.displayName || "",
            atComponente: mData.turmaNome || mData.nome_turma_matricula || "",
            atAnoFormativo: mData.anoFormativo || mData.ano_formativo_calc || "1º Ano"
          }));
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [router]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await solicitarRemanejamento({
        ...formData,
        matriculaId: matricula?.id,
        cursistaEmail: auth.currentUser?.email || "",
        status: "PENDENTE"
      });
      if (res.success) {
        setSuccess(true);
        setTimeout(() => router.push("/dashboard"), 3000);
      } else { setError(res.error || "Erro ao enviar."); }
    } catch (err) { setError("Erro de conexão."); } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
    </div>
  );

  return (
    <AppLayout userRole={userRole}>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <header>
          <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-primary font-bold text-sm mb-4 hover:underline">
            <ArrowLeft size={16} /> Voltar ao Dashboard
          </button>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <ArrowRightLeft className="text-secondary" />
            Solicitação de Remanejamento 2026
          </h1>
          <p className="text-on-surface-variant">Formulário oficial para alteração de turma, modalidade ou vínculo.</p>
        </header>

        {success ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container-lowest p-12 rounded-[2rem] text-center shadow-xl border border-emerald-200">
            <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-primary mb-2">Solicitação Enviada!</h2>
            <p className="text-on-surface-variant mb-4">Seu pedido foi registrado com sucesso.</p>
            <div className="text-[10px] uppercase font-bold text-primary opacity-40">Você será redirecionado em instantes...</div>
          </motion.div>
        ) : (
          <div className="bg-surface-container-lowest rounded-[3rem] border border-surface-border shadow-sm overflow-hidden">
            {/* Stepper Header */}
            <div className="bg-surface-container-low px-10 py-6 border-b border-surface-border flex justify-between">
              {[1, 2, 3].map(i => (
                <div key={i} className={`flex items-center gap-2 ${step >= i ? "text-primary" : "text-on-surface-variant opacity-40"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= i ? "bg-primary text-on-primary" : "bg-surface-container-high"}`}>
                    {i}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider hidden md:block">
                    {i === 1 ? "Dados Pessoais" : i === 2 ? "Tipo de Solicitação" : "Justificativa"}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-10">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-primary uppercase ml-1">Nome Completo</label>
                        <input 
                          className="w-full bg-surface-container-low border border-surface-border rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          value={formData.nomeCompleto}
                          onChange={e => setFormData({...formData, nomeCompleto: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-primary uppercase ml-1">Telefone (com DDD)</label>
                        <input 
                          placeholder="41999999999"
                          className="w-full bg-surface-container-low border border-surface-border rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          value={formData.telefone}
                          onChange={e => setFormData({...formData, telefone: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-primary uppercase ml-1">RG (apenas números)</label>
                        <input 
                          className="w-full bg-surface-container-low border border-surface-border rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          value={formData.rg}
                          onChange={e => setFormData({...formData, rg: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-primary uppercase ml-1">CPF (apenas números)</label>
                        <input 
                          className="w-full bg-surface-container-low border border-surface-border rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          value={formData.cpf}
                          onChange={e => setFormData({...formData, cpf: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="p-6 bg-secondary-container/10 border border-secondary-container/20 rounded-[2rem] flex items-start gap-4">
                      <Info className="text-secondary shrink-0 mt-1" />
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        <b>Importante:</b> Conforme a IN N.º 005/2026 – DEDUC/SEED, o cursista deve procurar a direção da escola caso identifique indisponibilidade de horário.
                      </p>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-sm font-bold text-primary">O que você deseja realizar?</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {["Turma (horário)", "Modalidade", "Vínculo de Padrões"].map(t => (
                          <button 
                            key={t}
                            onClick={() => setFormData({...formData, tipoAlteracao: t})}
                            className={`p-6 rounded-3xl border-2 text-sm font-bold transition-all ${formData.tipoAlteracao === t ? "border-primary bg-primary/5 text-primary" : "border-surface-border bg-white text-on-surface-variant hover:bg-surface-container-low"}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {formData.tipoAlteracao === "Turma (horário)" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-surface-container-low rounded-[2rem] border border-surface-border">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-primary uppercase ml-1">Horário Atual</label>
                          <input 
                            placeholder="Ex: Segunda-feira 08h00"
                            className="w-full bg-white border border-surface-border rounded-xl px-4 py-3 text-sm outline-none"
                            value={formData.atHorarioAtual}
                            onChange={e => setFormData({...formData, atHorarioAtual: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-primary uppercase ml-1">Horário Pretendido</label>
                          <input 
                            placeholder="Ex: Quarta-feira 13h30"
                            className="w-full bg-white border border-surface-border rounded-xl px-4 py-3 text-sm outline-none"
                            value={formData.atHorarioPretendido}
                            onChange={e => setFormData({...formData, atHorarioPretendido: e.target.value})}
                          />
                        </div>
                      </div>
                    )}

                    {formData.tipoAlteracao === "Modalidade" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-surface-container-low rounded-[2rem] border border-surface-border">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-primary uppercase ml-1">Modalidade Atual</label>
                          <select 
                            className="w-full bg-white border border-surface-border rounded-xl px-4 py-3 text-sm outline-none"
                            value={formData.amModalidadeAtual}
                            onChange={e => setFormData({...formData, amModalidadeAtual: e.target.value})}
                          >
                            <option value="">Selecione...</option>
                            <option value="Docente">Docente</option>
                            <option value="Equipe Gestora">Equipe Gestora</option>
                            <option value="Técnico">Técnico</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-primary uppercase ml-1">Modalidade Destino</label>
                          <select 
                            className="w-full bg-white border border-surface-border rounded-xl px-4 py-3 text-sm outline-none"
                            value={formData.amModalidadeDestino}
                            onChange={e => setFormData({...formData, amModalidadeDestino: e.target.value})}
                          >
                            <option value="">Selecione...</option>
                            <option value="Docente">Docente</option>
                            <option value="Equipe Gestora">Equipe Gestora</option>
                            <option value="Técnico">Técnico</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-sm font-bold text-primary block">Justificativa para a alteração</label>
                      <textarea 
                        required
                        className="w-full bg-surface-container-low border border-surface-border rounded-[2rem] p-6 text-sm min-h-[200px] outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Descreva detalhadamente o motivo da sua solicitação..."
                        value={formData.atJustificativa}
                        onChange={e => setFormData({...formData, atJustificativa: e.target.value})}
                      />
                    </div>
                    
                    <div className="border-2 border-dashed border-surface-border rounded-[2rem] p-10 text-center space-y-4 hover:bg-surface-container-low transition-colors cursor-pointer group">
                      <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary group-hover:scale-110 transition-transform">
                        <Upload size={32} />
                      </div>
                      <div>
                        <p className="font-bold text-primary">Anexar Comprovante (Opcional)</p>
                        <p className="text-xs text-on-surface-variant">Apenas PDF ou Imagens (Print RH-SEED)</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div className="mt-8 p-4 bg-error-container text-on-error-container rounded-2xl flex items-center gap-3">
                  <AlertCircle size={18} />
                  <span className="text-xs font-bold">{error}</span>
                </div>
              )}

              <div className="mt-12 flex justify-between items-center">
                {step > 1 ? (
                  <button onClick={() => setStep(step - 1)} className="px-8 py-4 text-primary font-bold text-sm">Voltar</button>
                ) : <div />}
                
                {step < 3 ? (
                  <button 
                    onClick={() => setStep(step + 1)}
                    className="bg-primary text-on-primary font-bold px-10 py-4 rounded-full shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-[1.02] transition-transform"
                  >
                    Próximo <ChevronRight size={18} />
                  </button>
                ) : (
                  <button 
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-secondary text-on-secondary font-bold px-12 py-4 rounded-full shadow-lg shadow-secondary/20 flex items-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                    Finalizar Solicitação
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
