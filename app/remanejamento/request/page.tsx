"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowRightLeft, 
  Search, 
  Send, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { solicitarRemanejamento } from "@/services/remanejamentoService";

export default function RequestRemanejamentoPage() {
  const router = useRouter();
  const [matricula, setMatricula] = useState<any>(null);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<any>(null);
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // 1. Pegar matrícula atual
        const qM = query(
          collection(db, "matriculas"), 
          where("cursistaEmail", "==", user.email),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const snapM = await getDocs(qM);
        if (snapM.empty) {
          setError("Você não possui uma matrícula ativa para solicitar remanejamento.");
          setLoading(false);
          return;
        }
        const mData = { id: snapM.docs[0].id, ...snapM.docs[0].data() };
        setMatricula(mData);

        // 2. Pegar turmas disponíveis compatíveis
        const qT = query(
          collection(db, "turmas"),
          where("vagas", ">", 0),
          where("ano_formativo", "==", mData.anoFormativo || mData.ano_formativo_calc || "1º ANO")
        );
        const snapT = await getDocs(qT);
        setTurmas(snapT.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => t.id !== mData.turmaId));

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!selectedTurma || !motivo) return;
    setSubmitting(true);
    setError("");

    const res = await solicitarRemanejamento({
      matriculaId: matricula.id,
      cursistaEmail: auth.currentUser?.email || "",
      cursistaNome: auth.currentUser?.displayName || "",
      turmaOrigemId: matricula.turmaId,
      turmaOrigemNome: matricula.turmaNome,
      turmaDestinoId: selectedTurma.id,
      turmaDestinoNome: selectedTurma.nome_turma_matricula,
      motivoCursista: motivo
    });

    if (res.success) {
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 3000);
    } else {
      setError(res.error || "Erro ao enviar solicitação.");
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 opacity-20">
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <p>Carregando opções...</p>
    </div>
  );

  return (
    <div className="max-w-4xl w-full p-6">
      <header className="mb-12">
        <button 
          onClick={() => router.back()}
          className="text-white/40 hover:text-white mb-6 flex items-center gap-2 text-sm transition-all"
        >
          ← Voltar ao Dashboard
        </button>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ArrowRightLeft className="text-brand-pedfor-green" />
          Solicitar Troca de Turma
        </h1>
        <p className="text-white/40">Escolha uma nova turma e aguarde a análise técnica.</p>
      </header>

      {error && !matricula ? (
        <div className="glass p-12 text-center rounded-3xl border-red-500/20">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white/60 mb-6">{error}</p>
          <button onClick={() => router.push("/dashboard")} className="btn-secondary">Voltar</button>
        </div>
      ) : success ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass p-12 text-center rounded-3xl border-emerald-500/20">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2 text-emerald-500">Solicitação Enviada!</h2>
          <p className="text-white/50 mb-8">O setor técnico analisará seu pedido. Você receberá uma atualização em breve no seu dashboard.</p>
          <p className="text-[10px] text-white/20 uppercase tracking-widest">Redirecionando...</p>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Current Class Card */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-2xl bg-white/5 border-white/5">
              <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Sua Turma Atual</h3>
              <p className="text-xl font-bold mb-2">{matricula?.turmaNome}</p>
              <div className="flex gap-4 text-xs text-white/40">
                <span>{matricula?.diaSemana}</span>
                <span>•</span>
                <span>{matricula?.horarioIni}</span>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl">
              <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Por que deseja trocar?</h3>
              <textarea 
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: Mudança de horário no trabalho, conflito de agenda..."
                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm h-32 outline-none focus:border-brand-pedfor-green transition-all"
              />
            </div>
          </div>

          {/* Target Selection Side */}
          <div className="flex flex-col h-full">
            <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Selecione a Nova Turma</h3>
            <div className="flex-1 space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {turmas.map(t => (
                <div 
                  key={t.id}
                  onClick={() => setSelectedTurma(t)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${selectedTurma?.id === t.id ? 'bg-brand-pedfor-green/10 border-brand-pedfor-green' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                >
                  <p className="font-bold text-sm">{t.nome_turma_matricula}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-[10px] text-white/40"><Calendar className="w-3 h-3" /> {t.dia_semana}</span>
                    <span className="flex items-center gap-1 text-[10px] text-white/40"><Clock className="w-3 h-3" /> {t.horario_ini}</span>
                    <span className="ml-auto text-[10px] font-bold text-brand-pedfor-green">{t.vagas} VAGAS</span>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={handleSubmit}
              disabled={submitting || !selectedTurma || !motivo}
              className="btn-primary w-full mt-8 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar para Análise
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
