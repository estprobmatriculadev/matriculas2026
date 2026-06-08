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
  Info,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { solicitarRemanejamento } from "@/services/remanejamentoService";
import AppLayout from "@/components/AppLayout";
import { syncUserSession } from "@/services/userService";

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "";

export default function RequestRemanejamentoPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userRole, setUserRole] = useState<string>("CURSISTA");
  const [matricula, setMatricula] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    rg: "",
    cpf: "",
    telefone: "",
    padroesEstagio: "1 Padrão",
    tipoAlteracao: "Turma (horário)",
    atHorarioAtual: "",
    atHorarioPretendido: "",
    atJustificativa: "",
    amModalidadeAtual: "",
    amModalidadeDestino: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) { router.push("/login"); return; }
      try {
        const { role } = await syncUserSession(user);
        setUserRole(role);
        const qM = query(collection(db, "matriculas"), where("cursistaEmail", "==", user.email), orderBy("createdAt", "desc"), limit(1));
        const snapM = await getDocs(qM);
        if (!snapM.empty) {
          const mData = snapM.docs[0].data();
          setMatricula({ id: snapM.docs[0].id, ...mData });
          setFormData(prev => ({
            ...prev,
            nomeCompleto: mData.cursistaNome || user.displayName || "",
            atComponente: mData.turmaNome || mData.nome_turma_matricula || ""
          }));
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setError("");

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const payload = {
          action: "SALVAR_ANEXO",
          payload: {
            fileName: `${auth.currentUser?.email}_${Date.now()}_${file.name}`,
            mimeType: file.type,
            base64: base64
          }
        };

        const response = await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success) {
          setFileUrl(result.url);
        } else {
          setError("Erro ao subir arquivo para o Drive: " + result.error);
        }
        setUploadingFile(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Erro ao processar arquivo.");
      setUploadingFile(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await solicitarRemanejamento({
        ...formData,
        comprovanteUrl: fileUrl,
        matriculaId: matricula?.id || null,
        cursistaEmail: auth.currentUser?.email || "",
        status: "PENDENTE",
        fluxo: matricula?.fluxo || "EP",
        turmaOrigemNome: matricula?.turmaNome || matricula?.nome_turma_matricula || "Não informada"
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
            <ArrowLeft size={16} /> Voltar ao Início
          </button>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <ArrowRightLeft className="text-secondary" />
            Solicitação de Remanejamento
          </h1>
          <p className="text-on-surface-variant">Complete os dados para análise da CFDEG.</p>
        </header>

        {success ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container-lowest p-12 rounded-[2rem] text-center shadow-xl border border-emerald-200">
            <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-primary mb-2">Solicitação Enviada!</h2>
            <p className="text-on-surface-variant mb-4">Seu pedido foi registrado e será salvo no Drive institucional.</p>
            <div className="text-[10px] uppercase font-bold text-primary opacity-40">Redirecionando...</div>
          </motion.div>
        ) : (
          <div className="bg-surface-container-lowest rounded-[3rem] border border-surface-border shadow-sm overflow-hidden">
            <div className="bg-surface-container-low px-10 py-6 border-b border-surface-border flex justify-between">
              {[1, 2, 3].map(i => (
                <div key={i} className={`flex items-center gap-2 ${step >= i ? "text-primary" : "text-on-surface-variant opacity-40"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= i ? "bg-primary text-on-primary" : "bg-surface-container-high"}`}>
                    {i}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider hidden md:block">
                    {i === 1 ? "Dados Pessoais" : i === 2 ? "Solicitação" : "Anexos"}
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
                        <label className="text-xs font-black text-primary uppercase ml-1 tracking-widest">Nome Completo</label>
                        <input className="w-full bg-surface-container-low border border-surface-border rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={formData.nomeCompleto} onChange={e => setFormData({...formData, nomeCompleto: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-primary uppercase ml-1 tracking-widest">Telefone</label>
                        <input className="w-full bg-surface-container-low border border-surface-border rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-primary uppercase ml-1 tracking-widest">RG</label>
                        <input className="w-full bg-surface-container-low border border-surface-border rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={formData.rg} onChange={e => setFormData({...formData, rg: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-primary uppercase ml-1 tracking-widest">CPF</label>
                        <input className="w-full bg-surface-container-low border border-surface-border rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-sm font-black text-primary">Tipo de Remanejamento</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {["Turma (horário)", "Modalidade", "Vínculo de Padrões"].map(t => (
                          <button key={t} onClick={() => setFormData({...formData, tipoAlteracao: t})} className={`p-6 rounded-3xl border-2 text-sm font-bold transition-all ${formData.tipoAlteracao === t ? "border-primary bg-primary/5 text-primary" : "border-surface-border bg-white hover:bg-surface-container-low"}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm font-black text-primary block">Justificativa Detalhada</label>
                      <textarea className="w-full bg-surface-container-low border border-surface-border rounded-[2rem] p-6 text-sm min-h-[150px] outline-none" value={formData.atJustificativa} onChange={e => setFormData({...formData, atJustificativa: e.target.value})} />
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    <div className="p-10 border-2 border-dashed border-surface-border rounded-[3rem] text-center relative group hover:bg-primary/5 transition-all">
                      <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary group-hover:scale-110 transition-transform">
                        {uploadingFile ? <Loader2 className="animate-spin" /> : fileUrl ? <Check size={32} /> : <Upload size={32} />}
                      </div>
                      <h4 className="text-xl font-black text-primary">{fileUrl ? "Arquivo Carregado!" : "Anexar Comprovante (Drive)"}</h4>
                      <p className="text-sm text-on-surface-variant mt-2">Clique aqui para subir o PDF da justificativa ou print do RH-SEED.</p>
                      {fileUrl && <p className="text-[10px] text-emerald-600 mt-2 font-bold uppercase tracking-widest">Salvo com sucesso no Google Drive</p>}
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
                  <button onClick={() => setStep(step - 1)} className="px-8 py-4 text-primary font-black text-sm uppercase tracking-widest">Voltar</button>
                ) : <div />}
                
                {step < 3 ? (
                  <button onClick={() => setStep(step + 1)} className="bg-primary text-on-primary font-black px-10 py-4 rounded-full shadow-xl flex items-center gap-2 hover:scale-105 transition-all">
                    Próximo <ChevronRight size={18} />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={submitting || !fileUrl} className="bg-secondary text-on-secondary font-black px-12 py-4 rounded-full shadow-xl flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50">
                    {submitting ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                    Finalizar e Salvar
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
