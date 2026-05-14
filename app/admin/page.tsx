"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { motion } from "framer-motion";
import { Users, LayoutDashboard, PieChart, Activity } from "lucide-react";

export default function AdminDashboard() {
  const [turmas, setTurmas] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalVagas: 0, totalOcupadas: 0 });

  useEffect(() => {
    const q = query(collection(db, "turmas"), orderBy("nome_turma_matricula"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTurmas(data);

      let vagas = 0;
      let ocupadas = 0;
      data.forEach((t: any) => {
        vagas += (t.vagas_totais || t.vagas || 0);
        ocupadas += (t.matriculados || 0);
      });
      setStats({ totalVagas: vagas, totalOcupadas: ocupadas });
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full max-w-7xl p-8">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LayoutDashboard className="text-amber-500" />
            Painel Administrativo
          </h1>
          <p className="text-white/40">Gestão de Vagas em Tempo Real</p>
        </div>
        
        <div className="flex gap-4">
          <div className="glass px-6 py-3 rounded-2xl flex items-center gap-4">
            <Users className="text-blue-400" />
            <div>
              <p className="text-[10px] uppercase text-white/30">Total Inscritos</p>
              <p className="text-xl font-bold">{stats.totalOcupadas}</p>
            </div>
          </div>
          <div className="glass px-6 py-3 rounded-2xl flex items-center gap-4">
            <Activity className="text-emerald-400" />
            <div>
              <p className="text-[10px] uppercase text-white/30">Ocupação</p>
              <p className="text-xl font-bold">
                {stats.totalVagas > 0 ? Math.round((stats.totalOcupadas / stats.totalVagas) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {turmas.map((t) => (
          <motion.div 
            layout
            key={t.id}
            className="glass p-6 rounded-2xl border-white/5"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold">{t.nome_turma_matricula}</h3>
                <p className="text-xs text-white/40">{t.modalidade} | {t.ano_formativo}</p>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-bold ${t.vagas > 5 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {t.vagas} RESTANTES
              </span>
            </div>

            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-2">
              <div 
                className="bg-amber-500 h-full transition-all duration-1000" 
                style={{ width: `${((t.matriculados || 0) / (t.vagas_totais || t.vagas + t.matriculados || 1)) * 100}%` }}
              />
            </div>
            
            <div className="flex justify-between text-[10px] text-white/30">
              <span>{t.matriculados || 0} matriculados</span>
              <span>{t.vagas_totais || (t.vagas + (t.matriculados || 0))} total</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
