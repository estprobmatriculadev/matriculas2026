"use client";

import { useState, useEffect } from "react";
import { 
  ArrowRightLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  MessageSquare, 
  ArrowRight,
  Loader2,
  Filter,
  Check,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { processarSolicitacaoRemanejamento, RemanejamentoRequest } from "@/services/remanejamentoService";

export default function ApprovalQueuePage() {
  const [requests, setRequests] = useState<RemanejamentoRequest[]>([]);
  const [filter, setFilter] = useState<string>("PENDENTE");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [motivoTecnico, setMotivoTecnico] = useState("");

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "remanejamentos"),
      where("status", "==", filter),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RemanejamentoRequest[];
      setRequests(data);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filter]);

  const handleProcess = async (id: string, decisao: "DEFERIDO" | "INDEFERIDO") => {
    if (decisao === "INDEFERIDO" && !motivoTecnico) {
      alert("Por favor, insira o motivo do indeferimento.");
      return;
    }

    setProcessingId(id);
    const result = await processarSolicitacaoRemanejamento(
      id, 
      decisao, 
      auth.currentUser?.email || "tecnico@escola.pr.gov.br",
      motivoTecnico || (decisao === "DEFERIDO" ? "Aprovado conforme solicitado." : "")
    );

    if (!result.success) {
      alert("Erro ao processar: " + result.error);
    } else {
      setMotivoTecnico("");
    }
    setProcessingId(null);
  };

  return (
    <div className="w-full max-w-7xl p-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ArrowRightLeft className="text-brand-ep-light" />
            Central de Remanejamento
          </h1>
          <p className="text-white/40">Analise e gerencie solicitações de troca de turma</p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          {["PENDENTE", "DEFERIDO", "INDEFERIDO"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${filter === f ? 'bg-brand-ep-light text-white shadow-lg shadow-brand-ep-light/20' : 'text-white/40 hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 opacity-20">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p>Carregando solicitações...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="glass rounded-3xl p-20 text-center text-white/20">
          <Filter className="w-16 h-16 mx-auto mb-4 opacity-10" />
          <p>Nenhuma solicitação encontrada com status <span className="font-bold text-white/40">{filter}</span></p>
        </div>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {requests.map((req) => (
              <motion.div
                key={req.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass rounded-3xl overflow-hidden border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="p-8 grid md:grid-cols-4 gap-8">
                  {/* User Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-ep-light/10 rounded-full flex items-center justify-center text-brand-ep-light">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold">{req.cursistaNome}</p>
                        <p className="text-[10px] text-white/40">{req.cursistaEmail}</p>
                      </div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl">
                      <p className="text-[10px] text-white/40 uppercase mb-1 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Justificativa Cursista
                      </p>
                      <p className="text-xs italic text-white/60">"{req.motivoCursista}"</p>
                    </div>
                  </div>

                  {/* Flow View */}
                  <div className="md:col-span-2 flex items-center justify-center gap-6">
                    <div className="flex-1 bg-white/5 p-4 rounded-2xl text-center border border-white/5">
                      <p className="text-[10px] text-white/30 uppercase mb-1">Origem</p>
                      <p className="font-bold text-sm">{req.turmaOrigemNome}</p>
                    </div>
                    <div className="w-8 h-8 bg-brand-ep-light/20 rounded-full flex items-center justify-center text-brand-ep-light shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    <div className="flex-1 bg-brand-ep-light/10 p-4 rounded-2xl text-center border border-brand-ep-light/20">
                      <p className="text-[10px] text-brand-ep-light/60 uppercase mb-1">Destino Solicitado</p>
                      <p className="font-bold text-sm text-brand-ep-light">{req.turmaDestinoNome}</p>
                    </div>
                  </div>

                  {/* Actions or Status */}
                  <div className="flex flex-col justify-center gap-3">
                    {req.status === "PENDENTE" ? (
                      <>
                        <input 
                          type="text"
                          placeholder="Obs. do Técnico (opcional)"
                          value={req.id === processingId ? motivoTecnico : ""}
                          onChange={(e) => {
                            setProcessingId(req.id!);
                            setMotivoTecnico(e.target.value);
                          }}
                          className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-brand-ep-light"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleProcess(req.id!, "DEFERIDO")}
                            disabled={!!processingId}
                            className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                          >
                            {processingId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Deferir
                          </button>
                          <button
                            onClick={() => handleProcess(req.id!, "INDEFERIDO")}
                            disabled={!!processingId}
                            className="bg-red-500 hover:bg-red-400 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                          >
                            <X className="w-3 h-3" />
                            Indeferir
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className={`flex items-center gap-2 font-bold text-sm justify-end ${req.status === 'DEFERIDO' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {req.status === 'DEFERIDO' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        {req.status}
                      </div>
                    )}
                    <p className="text-[10px] text-white/20 text-right flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" /> {req.createdAt?.toDate().toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
