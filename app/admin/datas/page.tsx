"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import AppLayout from "@/components/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle
} from "lucide-react";

interface DataImportante {
  id?: string;
  titulo: string;
  descricao: string;
  data: string;
  prioridade: "alta" | "media" | "baixa";
  createdAt?: any;
}

export default function DatasImportantesPage() {
  const [datas, setDatas] = useState<DataImportante[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<DataImportante>({
    titulo: "",
    descricao: "",
    data: "",
    prioridade: "media"
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "datas_importantes"), orderBy("data", "asc")),
      (snapshot) => {
        setDatas(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DataImportante)));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo || !formData.data) {
      setError("Título e data são obrigatórios");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "datas_importantes", editingId), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "datas_importantes"), {
          ...formData,
          createdAt: serverTimestamp()
        });
      }

      setFormData({ titulo: "", descricao: "", data: "", prioridade: "media" });
      setEditingId(null);
      setShowForm(false);
      setError("");
    } catch (err) {
      setError("Erro ao salvar data importante");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (data: DataImportante) => {
    setFormData(data);
    setEditingId(data.id || null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja deletar esta data importante?")) {
      await deleteDoc(doc(db, "datas_importantes", id));
    }
  };

  const getPrioridadeCor = (prioridade: string) => {
    switch (prioridade) {
      case "alta":
        return "bg-red-500/20 text-red-700 border-red-500/30";
      case "media":
        return "bg-amber-500/20 text-amber-700 border-amber-500/30";
      case "baixa":
        return "bg-emerald-500/20 text-emerald-700 border-emerald-500/30";
      default:
        return "";
    }
  };

  const getDataFormatada = (dataStr: string) => {
    const data = new Date(dataStr);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(data);
  };

  const proximasDatasSemanas = datas.filter(d => {
    const dataObj = new Date(d.data);
    const hoje = new Date();
    const diferenca = dataObj.getTime() - hoje.getTime();
    return diferenca > 0 && diferenca < 30 * 24 * 60 * 60 * 1000; // Próximos 30 dias
  });

  return (
    <AppLayout userRole="ADMIN">
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Datas Importantes</h1>
            <p className="text-on-surface-variant">Gerencie as próximas datas relevantes do programa.</p>
          </div>
          <button
            onClick={() => {
              setFormData({ titulo: "", descricao: "", data: "", prioridade: "media" });
              setEditingId(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-full shadow-lg hover:scale-105 transition-all"
          >
            <Plus size={18} /> Nova Data
          </button>
        </header>

        {/* Próximas Datas (Resumo) */}
        {proximasDatasSemanas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/10 border border-primary/30 rounded-[2rem] p-6"
          >
            <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
              <AlertCircle size={18} /> Próximas datas (30 dias)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proximasDatasSemanas.map(d => (
                <div key={d.id} className="bg-surface-container-low rounded-xl p-4">
                  <p className="font-bold text-sm">{d.titulo}</p>
                  <p className="text-xs text-on-surface-variant">{getDataFormatada(d.data)}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Lista de Datas */}
        <div className="bg-surface-container-lowest rounded-[2rem] border border-surface-border shadow-sm overflow-hidden">
          <div className="px-8 py-4 border-b border-surface-border bg-surface-container-low flex justify-between items-center">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              <Calendar size={14} className="inline mr-2" />
              Calendário de Eventos
            </span>
            <span className="text-xs text-on-surface-variant">{datas.length} data(s)</span>
          </div>

          <div className="divide-y divide-surface-border max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : datas.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant">
                Nenhuma data importante cadastrada.
              </div>
            ) : (
              datas.map(d => (
                <motion.div
                  key={d.id}
                  layout
                  className="p-6 flex items-start justify-between hover:bg-surface-container-low transition-colors group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-on-surface">{d.titulo}</h4>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${getPrioridadeCor(d.prioridade)}`}
                      >
                        {d.prioridade === "alta" ? "Alta" : d.prioridade === "media" ? "Média" : "Baixa"}
                      </span>
                    </div>
                    {d.descricao && (
                      <p className="text-sm text-on-surface-variant mb-2">{d.descricao}</p>
                    )}
                    <p className="text-xs text-on-surface-variant">
                      📅 {getDataFormatada(d.data)}
                    </p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(d)}
                      className="p-2 rounded-lg hover:bg-primary/20 text-primary"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id!)}
                      className="p-2 rounded-lg hover:bg-error/20 text-error"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-lowest rounded-[2rem] border border-surface-border shadow-xl max-w-md w-full p-8 space-y-6"
            >
              <h2 className="text-2xl font-bold text-primary">
                {editingId ? "Editar Data" : "Nova Data Importante"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Título"
                  value={formData.titulo}
                  onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full bg-surface-container p-3 rounded-xl border border-surface-border outline-none focus:ring-2 focus:ring-primary/20"
                />

                <textarea
                  placeholder="Descrição (opcional)"
                  value={formData.descricao}
                  onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full bg-surface-container p-3 rounded-xl border border-surface-border outline-none focus:ring-2 focus:ring-primary/20 resize-none h-24"
                />

                <input
                  type="date"
                  value={formData.data}
                  onChange={e => setFormData({ ...formData, data: e.target.value })}
                  className="w-full bg-surface-container p-3 rounded-xl border border-surface-border outline-none focus:ring-2 focus:ring-primary/20"
                />

                <select
                  value={formData.prioridade}
                  onChange={e => setFormData({ ...formData, prioridade: e.target.value as "alta" | "media" | "baixa" })}
                  className="w-full bg-surface-container p-3 rounded-xl border border-surface-border outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="baixa">Prioridade Baixa</option>
                  <option value="media">Prioridade Média</option>
                  <option value="alta">Prioridade Alta</option>
                </select>

                {error && (
                  <p className="text-error text-sm flex items-center gap-2">
                    <AlertCircle size={14} /> {error}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setError("");
                    }}
                    className="flex-1 py-3 bg-surface-container rounded-xl font-bold hover:bg-surface-container-high transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="animate-spin" size={16} /> Salvando...
                      </>
                    ) : (
                      editingId ? "Atualizar" : "Criar"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
