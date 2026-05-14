"use client";

import { useRouter } from "next/navigation";
import { BookOpen, GraduationCap, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const router = useRouter();

  const flows = [
    {
      id: "EP",
      title: "Estágio Probatório",
      description: "Fluxo obrigatório para servidores QPM em período de avaliação.",
      icon: GraduationCap,
      color: "from-blue-500 to-indigo-600",
      link: "/matricula/EP"
    },
    {
      id: "PEDFOR",
      title: "PEDFOR",
      description: "Curso de formação contínua. Limite de uma vaga por escola.",
      icon: BookOpen,
      color: "from-emerald-500 to-teal-600",
      link: "/matricula/PEDFOR"
    }
  ];

  return (
    <div className="max-w-4xl w-full">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold mb-4">Selecione o Fluxo de Inscrição</h1>
        <p className="text-white/60">Escolha o programa que deseja se matricular abaixo.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8">
        {flows.map((flow, index) => (
          <motion.div
            key={flow.id}
            initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => router.push(flow.link)}
            className="glass group cursor-pointer p-8 rounded-3xl hover:bg-white/10 transition-all duration-500 border-white/5 hover:border-white/20"
          >
            <div className={`w-16 h-16 bg-gradient-to-br ${flow.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
              <flow.icon className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold mb-3">{flow.title}</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-8">
              {flow.description}
            </p>

            <div className="flex items-center text-sm font-semibold group-hover:gap-2 transition-all">
              Acessar fluxo
              <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-16 text-center text-white/20 text-xs">
        © 2026 Secretaria da Educação do Paraná — CFDEG
      </div>
    </div>
  );
}
