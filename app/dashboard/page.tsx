"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit, doc, setDoc, onSnapshot } from "firebase/firestore";
import AppLayout from "@/components/AppLayout";
import { motion } from "framer-motion";
import { 
  Loader2, 
  ChevronRight,
  School,
  FileText,
  MoveUp,
  CalendarDays,
  AlertCircle,
  Edit2,
  Save,
  Clock
} from "lucide-react";
import { syncUserSession } from "@/services/userService";

export default function DashboardPage() {
  const router = useRouter();
  const [matricula, setMatricula] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("CURSISTA");
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState<any[]>([]);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ dia: "", mes: "", titulo: "", desc: "" });

  useEffect(() => {
    const initializeDashboard = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const { role } = await syncUserSession(user);
        setUserRole(role);

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

    initializeDashboard();

    // Listen to important dates
    const unsubscribeDates = onSnapshot(collection(db, "dates"), (snap) => {
      setDates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsubscribeDates();
  }, [router]);

  const handleSaveDate = async (id: string) => {
    await setDoc(doc(db, "dates", id), editForm, { merge: true });
    setEditingDate(null);
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
    </div>
  );

  const isAdmin = userRole === "ADMIN" || userRole === "TECNICO";

  return (
    <AppLayout userRole={userRole}>
      <div className="space-y-stack-lg">
        {/* Welcome Hero Section */}
        <section className="bg-primary text-on-primary p-8 rounded-[2rem] shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="z-10 max-w-2xl">
            <h2 className="text-3xl font-bold mb-2">Bem-vindo, {auth.currentUser?.displayName?.split(" ")[0]}!</h2>
            <p className="text-lg opacity-80 mb-8 leading-relaxed">
              Sua jornada formativa está em andamento. Acompanhe abaixo o status da sua matrícula e as próximas etapas.
            </p>
            
            <div className="inline-flex items-center gap-6 bg-on-primary/10 border border-on-primary/20 px-8 py-5 rounded-2xl">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-70 mb-1">Status da Matrícula</span>
                <span className="text-lg font-semibold text-secondary-container">
                  {matricula ? "Matrícula Confirmada" : "Inscrição Pendente"}
                </span>
              </div>
              <div className="w-[1px] h-10 bg-on-primary/20"></div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-70 mb-1">Ciclo Atual</span>
                <span className="text-lg font-semibold">1º Semestre de 2026</span>
              </div>
            </div>
          </div>
          <div className="hidden lg:block opacity-20 transform translate-x-12">
            <School size={180} />
          </div>
        </section>

        {/* Action Cards Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {/* Card 1: Comprovante */}
          <div className="bg-surface-container-lowest border border-surface-border p-8 rounded-[2rem] flex flex-col items-start gap-4 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-surface-container rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary mb-1">Comprovante Digital</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">Baixe o documento oficial de matrícula e situação funcional atualizada.</p>
            </div>
            <button className="mt-6 px-6 py-2.5 border-2 border-primary text-primary text-sm font-bold rounded-full hover:bg-primary hover:text-on-primary transition-all">
              Ver Documento
            </button>
          </div>

          {/* Card 2: Remanejamento */}
          <div className="bg-surface-container-lowest border border-surface-border p-8 rounded-[2rem] flex flex-col items-start gap-4 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-secondary-container rounded-2xl flex items-center justify-center text-on-secondary-container group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
              <MoveUp size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary mb-1">Remanejamento</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">Inicie ou acompanhe seu processo de troca de turma ou unidade escolar.</p>
            </div>
            {userRole === "CURSISTA" ? (
              <button 
                onClick={() => router.push("/remanejamento/request")}
                className="mt-6 px-6 py-2.5 border-2 border-primary text-primary text-sm font-bold rounded-full hover:bg-primary hover:text-on-primary transition-all"
              >
                Solicitar Troca
              </button>
            ) : (
              <button 
                onClick={() => router.push("/tecnico/remanejamento")}
                className="mt-6 px-6 py-2.5 border-2 border-primary text-primary text-sm font-bold rounded-full hover:bg-primary hover:text-on-primary transition-all"
              >
                Gerenciar Fila
              </button>
            )}
          </div>

          {/* Card 3: Inscrição (Aviso 2º Semestre) */}
          <div className="bg-primary text-on-primary p-8 rounded-[2rem] flex flex-col items-start gap-4 hover:shadow-2xl transition-all relative overflow-hidden group">
            <div className="z-10 h-full flex flex-col">
              <div className="w-14 h-14 bg-on-primary/20 rounded-2xl flex items-center justify-center mb-6">
                <CalendarDays size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Nova Inscrição</h3>
              <div className="bg-white/10 p-4 rounded-xl border border-white/20 mb-6">
                <p className="text-sm font-bold flex items-center gap-2">
                  <Clock size={16} /> 🕒 Próxima janela em breve!
                </p>
                <p className="text-xs opacity-80 mt-1">
                  As inscrições para o próximo ciclo iniciarão no **segundo semestre de 2026**. Fique atento! 🤡✨
                </p>
              </div>
              <button 
                disabled
                className="mt-auto px-8 py-3 bg-white/20 text-white font-bold rounded-full flex items-center gap-2 opacity-50 cursor-not-allowed"
              >
                Indisponível no Momento
              </button>
            </div>
            <div className="absolute -bottom-6 -right-6 opacity-10 group-hover:scale-110 transition-transform">
              <School size={120} />
            </div>
          </div>
        </div>

        {/* Important Dates */}
        <section className="bg-surface-container-lowest border border-surface-border rounded-[2rem] overflow-hidden shadow-sm">
          <div className="px-8 py-6 border-b border-surface-border flex justify-between items-center bg-surface-container-low">
            <h3 className="text-xl font-bold text-primary flex items-center gap-3">
              <span className="material-symbols-outlined">calendar_month</span>
              Próximas Datas Importantes
            </h3>
          </div>
          <div className="divide-y divide-surface-border">
            {dates.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant italic">Nenhuma data cadastrada.</div>
            ) : (
              dates.map(date => (
                <div key={date.id} className="px-8 py-6 flex flex-col md:flex-row items-center gap-8 hover:bg-surface-container-low transition-colors group">
                  <div className="flex flex-col items-center justify-center min-w-[80px] h-20 bg-surface-container rounded-2xl border-l-4 border-primary">
                    {editingDate === date.id ? (
                      <input 
                        className="w-12 text-center font-bold bg-transparent border-b border-primary outline-none"
                        value={editForm.dia}
                        onChange={e => setEditForm({...editForm, dia: e.target.value})}
                      />
                    ) : (
                      <span className="text-2xl font-bold text-primary">{date.dia}</span>
                    )}
                    {editingDate === date.id ? (
                      <input 
                        className="w-12 text-center text-[10px] font-bold bg-transparent outline-none"
                        value={editForm.mes}
                        onChange={e => setEditForm({...editForm, mes: e.target.value})}
                      />
                    ) : (
                      <span className="text-[10px] font-bold uppercase text-primary">{date.mes}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    {editingDate === date.id ? (
                      <input 
                        className="block w-full font-bold text-on-surface bg-transparent border-b border-primary outline-none mb-1"
                        value={editForm.titulo}
                        onChange={e => setEditForm({...editForm, titulo: e.target.value})}
                      />
                    ) : (
                      <h4 className="font-bold text-on-surface">{date.titulo}</h4>
                    )}
                    {editingDate === date.id ? (
                      <input 
                        className="block w-full text-sm text-on-surface-variant bg-transparent outline-none"
                        value={editForm.desc}
                        onChange={e => setEditForm({...editForm, desc: e.target.value})}
                      />
                    ) : (
                      <p className="text-sm text-on-surface-variant">{date.desc}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingDate === date.id ? (
                        <button 
                          onClick={() => handleSaveDate(date.id)}
                          className="p-2 bg-secondary text-on-secondary rounded-full"
                        >
                          <Save size={18} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            setEditingDate(date.id);
                            setEditForm({ dia: date.dia, mes: date.mes, titulo: date.titulo, desc: date.desc });
                          }}
                          className="p-2 bg-primary/10 text-primary rounded-full"
                        >
                          <Edit2 size={18} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
