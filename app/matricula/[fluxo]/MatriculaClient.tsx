"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { processarPerfilCursista, UserVinculo, normalizarString } from "@/services/userService";
import { efetivarMatricula } from "@/services/registrationService";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2, Search, ArrowLeft, Filter } from "lucide-react";

interface Turma {
  id: string;
  modalidade: string;
  ano_formativo: string;
  nome_turma_matricula: string;
  vagas: number;
  vagas_totais?: number;
  matriculados?: number;
  formador: string;
  dia_semana: string;
  horario_ini: string;
  turno?: string;
}

interface MatriculaClientProps {
  fluxo: "EP" | "PEDFOR";
}

export default function MatriculaClient({ fluxo }: MatriculaClientProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [perfil, setPerfil] = useState<UserVinculo[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
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
  }, [fluxo]);

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
      const todasTurmas: Turma[] = turmasSnap.docs.map((d) => ({
        id: d.id,
        modalidade: d.data().modalidade || "",
        ano_formativo: d.data().ano_formativo || "",
        nome_turma_matricula: d.data().nome_turma_matricula || "",
        vagas: d.data().vagas || 0,
        vagas_totais: d.data().vagas_totais,
        matriculados: d.data().matriculados,
        formador: d.data().formador || "",
        dia_semana: d.data().dia_semana || "",
        horario_ini: d.data().horario_ini || "",
        turno: d.data().turno,
      }));

      const turmasFiltradas = todasTurmas.filter((t) => {
        if (fluxo === "EP") {
          const matchModalidade = vinculos.some((v) => v.modalidade_calc === t.modalidade);
          const matchAno = vinculos.some((v) => v.ano_formativo_calc === t.ano_formativo);
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
      cursistaNome: perfil[0].DiscFuncExeNome || user.displayName,
      turmaId: selectedTurma,
      fluxo,
      EstabExeNome: perfil[0].EstabExeNome,
      vinculoOrigem: perfil[0].Vinculo,
    });

    if (result.success) {
      setProtocolo(result.protocolo!);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  if (loading)
    return (
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
        <p className="text-white/60">Processando informações...</p>
      </div>
    );

  if (protocolo)
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass p-12 rounded-3xl text-center max-w-lg"
      >
        <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-2">Matrícula Realizada!</h1>
        <p className="text-white/60 mb-8">Sua inscrição no fluxo {fluxo} foi confirmada com sucesso.</p>

        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl mb-8">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Protocolo</p>
          <p className="text-2xl font-mono font-bold text-amber-400">{protocolo}</p>
        </div>

        <button onClick={() => router.push("/dashboard")} className="btn-secondary w-full">
          Voltar ao Início
        </button>
      </motion.div>
    );

  return (
    <div className="w-full max-w-5xl">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
        <div className="text-right">
          <h1 className="text-2xl font-bold">Matrícula {fluxo}</h1>
          <p className="text-sm text-white/40">{perfil[0]?.EstabExeNome}</p>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-2xl mb-8 flex gap-4 items-center">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 rounded-2xl">
            <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Perfil Identificado
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-white/30">Modalidade</p>
                <p className="font-medium text-amber-400">{perfil[0]?.modalidade_calc}</p>
              </div>
              <div>
                <p className="text-xs text-white/30">Ano Formativo</p>
                <p className="font-medium text-blue-400">{perfil[0]?.ano_formativo_calc}</p>
              </div>
              <div>
                <p className="text-xs text-white/30">Componente</p>
                <p className="font-medium">{perfil[0]?.componente_matriz}</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-200/70 text-xs leading-relaxed">
            <p>
              <strong>Atenção:</strong> As turmas exibidas são filtradas automaticamente de acordo com sua compatibilidade de horário e perfil funcional.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
            Turmas Disponíveis
            <span className="bg-white/10 text-xs px-2 py-1 rounded-full font-normal text-white/60">{turmas.length}</span>
          </h2>

          {turmas.length === 0 ? (
            <div className="glass p-12 rounded-3xl text-center text-white/40">Nenhuma turma disponível para o seu perfil no momento.</div>
          ) : (
            <div className="space-y-4">
              {turmas.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTurma(t.id)}
                  className={`glass p-6 rounded-2xl cursor-pointer transition-all border-2 ${selectedTurma === t.id ? "border-amber-500 bg-amber-500/5" : "border-transparent hover:bg-white/5"}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-lg">{t.nome_turma_matricula}</h4>
                      <p className="text-sm text-white/50 mb-4">{t.formador}</p>

                      <div className="flex flex-wrap gap-3">
                        <span className="bg-white/5 text-[10px] uppercase font-bold px-2 py-1 rounded border border-white/10">{t.dia_semana}</span>
                        <span className="bg-white/5 text-[10px] uppercase font-bold px-2 py-1 rounded border border-white/10">{t.horario_ini}</span>
                        <span className="bg-white/5 text-[10px] uppercase font-bold px-2 py-1 rounded border border-white/10">{t.turno}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-amber-500">{t.vagas}</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-tighter">vagas</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-12">
            <button
              onClick={handleMatricula}
              disabled={!selectedTurma || loading}
              className="btn-primary w-full disabled:opacity-50 disabled:grayscale transition-all"
            >
              {loading ? "Processando..." : "Confirmar Inscrição"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
