"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy 
} from "firebase/firestore";
import AppLayout from "@/components/AppLayout";
import { processarSolicitacaoRemanejamento } from "@/services/remanejamentoService";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight, 
  User, 
  School,
  AlertCircle,
  Loader2,
  Filter
} from "lucide-react";

export default function TecnicoRemanejamentoPage() {
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("PENDENTE");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "remanejamentos"),
      where("status", "==", filter),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setSolicitacoes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filter]);

  const handleProcessar = async (id: string, decisao: "DEFERIDO" | "INDEFERIDO") => {
    setProcessing(id);
    const result = await processarSolicitacaoRemanejamento(id, decisao);
    if (!result.success) {
      alert("Erro ao processar: " + result.error);
    }
    setProcessing(null);
  };

  return (
    <AppLayout userRole="ADMIN">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">Fila de Remanejamento</h1>
            <p className="text-on-surface-variant">Análise e aprovação de trocas de turma em tempo real.</p>
          </div>
          
          <div className="flex bg-surface-container p-1 rounded-2xl border border-surface-border">
            {["PENDENTE", "DEFERIDO", "INDEFERIDO"].map((s) => (
              <button 
                key={s}
                onClick={() => setFilter(s)}
                className={`px-6 py-2 rounded-xl text-[10px] font-bold transition-all uppercase tracking-wider ${filter === s ? "bg-primary text-on-primary shadow-lg" : "text-primary hover:bg-primary/5"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-on-surface-variant text-sm font-medium">Carregando solicitações...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {solicitacoes.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface-container-lowest p-20 rounded-[2rem] text-center border-2 border-dashed border-surface-border text-on-surface-variant">
                  <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-6 opacity-40">
                    <CheckCircle2 size={40} />
                  </div>
                  <p className="text-lg font-bold">Tudo em dia!</p>
                  <p className="text-sm opacity-60">Nenhuma solicitação com status {filter} no momento.</p>
                </motion.div>
              ) : (
                solicitacoes.map((s) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={s.id}
                    className="bg-surface-container-lowest p-6 rounded-[2rem] border border-surface-border shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="grid md:grid-cols-4 gap-8 items-center">
                      {/* User Info */}
                      <div className="md:col-span-1 border-r border-surface-border pr-6">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                            {s.cursistaNome.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-primary truncate max-w-[150px]">{s.cursistaNome}</p>
                            <p className="text-[10px] text-on-surface-variant">{s.cursistaEmail}</p>
                          </div>
                        </div>
                        <div className="bg-surface-container-low px-3 py-1 rounded-full inline-block">
                          <span className="text-[9px] font-black text-primary uppercase">{s.fluxo}</span>
                        </div>
                      </div>

                      {/* Path Info */}
                      <div className="md:col-span-2 flex items-center justify-center gap-6">
                        <div className="text-center">
                          <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Origem</p>
                          <div className="bg-surface-container px-4 py-2 rounded-xl border border-surface-border">
                            <p className="font-bold text-primary text-xs">{s.turmaOrigemNome}</p>
                          </div>
                        </div>
                        <ArrowRight className="text-primary opacity-30 mt-4" size={24} />
                        <div className="text-center">
                          <p className="text-[10px] uppercase font-bold text-primary mb-1">Destino</p>
                          <div className="bg-primary/5 px-4 py-2 rounded-xl border border-primary/20">
                            <p className="font-bold text-primary text-xs">{s.turmaDestinoNome}</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="md:col-span-1 flex flex-col gap-2">
                        {filter === "PENDENTE" ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleProcessar(s.id, "DEFERIDO")}
                              disabled={!!processing}
                              className="flex-1 bg-primary text-on-primary py-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider hover:bg-primary-container transition-all active:scale-95 disabled:opacity-30"
                            >
                              {processing === s.id ? <Loader2 className="animate-spin mx-auto" /> : "Deferir"}
                            </button>
                            <button 
                              onClick={() => handleProcessar(s.id, "INDEFERIDO")}
                              disabled={!!processing}
                              className="flex-1 border-2 border-primary text-primary py-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider hover:bg-primary/5 transition-all active:scale-95 disabled:opacity-30"
                            >
                              Indeferir
                            </button>
                          </div>
                        ) : (
                          <div className={`text-center py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest ${filter === "DEFERIDO" ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"}`}>
                            {filter}
                          </div>
                        )}
                        <p className="text-[9px] text-center text-on-surface-variant italic">Solicitado em: {new Date(s.createdAt?.seconds * 1000).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-surface-border">
                      <p className="text-xs text-on-surface-variant flex items-start gap-2">
                        <AlertCircle size={14} className="shrink-0 mt-0.5 text-primary opacity-40" />
                        <strong>Justificativa:</strong> {s.justificativa || "Sem justificativa informada."}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
