"use client";

import { useEffect, useState, use } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { processarPerfilCursista, UserVinculo } from "@/services/userService";
import { efetivarMatricula } from "@/services/registrationService";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2, ArrowLeft, Filter } from "lucide-react";

interface PageProps {
  params: Promise<{ fluxo: string }>;
}

export default function MatriculaPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const fluxoSolicitado = resolvedParams.fluxo as "EP" | "PEDFOR";
  
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [perfil, setPerfil] = useState<UserVinculo[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
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
  }, [fluxoSolicitado]);

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
      const todasTurmas = turmasSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const turmasFiltradas = todasTurmas.filter((t: any) => {
        if (fluxoSolicitado === "EP") {
          const matchModalidade = vinculos.some(v => v.modalidade_calc === t.modalidade);
          const matchAno = vinculos.some(v => v.ano_formativo_calc === t.ano_formativo);
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
      cursistaNome: perfil[0].DiscFuncExeNome || user.displayName || "Cursista",
      turmaId: selectedTurma,
      fluxo: fluxoSolicitado,
      EstabExeNome: perfil[0].EstabExeNome,
    });

    if (result.success) {
      setProtocolo(result.matriculaId || "OK");
    } else {
      setError(result.error || "Erro desconhecido");
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="flex flex-col items-center gap-4 py-20">
      <Loader2 className="w-12 h-12 text-brand-ep-light animate-spin" />
      <p className="text-white/60">Processando informações...</p>
    </div>
  );

  if (protocolo) return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-12 rounded-3xl text-center max-w-lg mx-auto">
      <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
      <h1 className="text-3xl font-bold mb-2">Matrícula Realizada!</h1>
      <p className="text-white/60 mb-8">Sua inscrição no fluxo {fluxoSolicitado} foi confirmada.</p>
      <button onClick={() => router.push("/dashboard")} className="btn-secondary w-full">Voltar ao Início</button>
    </motion.div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto p-6">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="text-right">
          <h1 className="text-2xl font-bold">Matrícula {fluxoSolicitado}</h1>
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
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Filter className="w-3 h-3" /> Perfil Identificado
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-white/30 uppercase">Modalidade</p>
                <p className="font-medium text-brand-ep-light">{perfil[0]?.modalidade_calc}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase">Ano Formativo</p>
                <p className="font-medium text-brand-pedfor-blue">{perfil[0]?.ano_formativo_calc}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3">Turmas Disponíveis</h2>
          {turmas.length === 0 ? (
            <div className="glass p-12 rounded-3xl text-center text-white/40">Nenhuma turma disponível.</div>
          ) : (
            <div className="space-y-4">
              {turmas.map((t: any) => (
                <div 
                  key={t.id}
                  onClick={() => setSelectedTurma(t.id)}
                  className={`glass p-6 rounded-2xl cursor-pointer transition-all border-2 ${selectedTurma === t.id ? 'border-brand-ep-light bg-brand-ep-light/5' : 'border-transparent hover:bg-white/5'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-lg">{t.nome_turma_matricula}</h4>
                      <p className="text-sm text-white/50">{t.formador}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-brand-ep-light">{t.vagas}</p>
                      <p className="text-[10px] text-white/30 uppercase">vagas</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={handleMatricula}
            disabled={!selectedTurma || loading}
            className="btn-primary w-full mt-8 disabled:opacity-50"
          >
            {loading ? "Processando..." : "Confirmar Inscrição"}
          </button>
        </div>
      </div>
    </div>
  );
}
