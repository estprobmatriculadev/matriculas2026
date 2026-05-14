"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  GraduationCap, 
  ArrowRight, 
  CheckCircle2, 
  ArrowRightLeft, 
  FileText, 
  Calendar, 
  Clock,
  Loader2,
  Library
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

export default function DashboardPage() {
  const router = useRouter();
  const [matricula, setMatricula] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMatricula = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const q = query(
          collection(db, "matriculas"), 
          where("cursistaEmail", "==", user.email),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setMatricula({ id: snap.docs[0].id, ...snap.docs[0].data() });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    checkMatricula();
  }, [router]);

  const flows = [
    {
      id: "EP",
      title: "Estágio Probatório",
      description: "Fluxo obrigatório para servidores QPM em período de avaliação.",
      icon: GraduationCap,
      color: "from-brand-ep-light to-brand-ep-dark",
      link: "/matricula/EP"
    },
    {
      id: "PEDFOR",
      title: "PEDFOR",
      description: "Curso de formação contínua. Limite de uma vaga por escola.",
      icon: BookOpen,
      color: "from-brand-pedfor-blue to-brand-pedfor-purple",
      link: "/matricula/PEDFOR"
    }
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 opacity-20">
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <p>Acessando portal...</p>
    </div>
  );

  return (
    <div className="max-w-6xl w-full p-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-bold mb-2">Bem-vindo(a), {auth.currentUser?.displayName?.split(" ")[0]}</h1>
        <p className="text-white/40">Gerencie suas formações e matrículas para 2026.</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Actions */}
        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence>
            {matricula ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass p-8 rounded-3xl border-brand-ep-light/30 bg-brand-ep-light/5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <CheckCircle2 className="w-32 h-32 text-brand-ep-light" />
                </div>
                
                <div className="relative z-10">
                  <span className="bg-brand-ep-light text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
                    Matrícula Confirmada
                  </span>
                  <h2 className="text-3xl font-bold mb-6">{matricula.turmaNome}</h2>
                  
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-white/40 uppercase">Dia da Semana</p>
                        <p className="text-sm font-semibold">{matricula.diaSemana || "Não definido"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-white/40 uppercase">Horário</p>
                        <p className="text-sm font-semibold">{matricula.horarioIni || "A definir"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <button className="btn-primary flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Comprovante
                    </button>
                    <button 
                      onClick={() => router.push("/remanejamento/request")}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <ArrowRightLeft className="w-4 h-4" /> Solicitar Troca
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {flows.map((flow, index) => (
                  <motion.div
                    key={flow.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => router.push(flow.link)}
                    className="glass group cursor-pointer p-8 rounded-3xl hover:bg-white/10 transition-all border-white/5 hover:border-white/20"
                  >
                    <div className={`w-14 h-14 bg-gradient-to-br ${flow.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                      <flow.icon className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">{flow.title}</h2>
                    <p className="text-white/40 text-xs mb-6">{flow.description}</p>
                    <div className="flex items-center text-xs font-bold uppercase tracking-wider group-hover:gap-2 transition-all">
                      Inscrever-se <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-6">
              <Library className="w-4 h-4 text-brand-ep-light" />
              Recursos Rápidos
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-xs font-semibold flex items-center justify-between group">
                Biblioteca de Materiais
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
              </button>
              <button className="w-full text-left p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-xs font-semibold flex items-center justify-between group">
                Cronograma 2026
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
              </button>
              <button className="w-full text-left p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-xs font-semibold flex items-center justify-between group">
                Dúvidas Frequentes
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
