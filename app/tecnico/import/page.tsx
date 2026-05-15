"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, writeBatch, serverTimestamp } from "firebase/firestore";
import AppLayout from "@/components/AppLayout";
import Papa from "papaparse";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Database,
  Table,
  ArrowRight
} from "lucide-react";

export default function ImportPage() {
  const [data, setData] = useState<any[]>([]);
  const [type, setType] = useState<"cursistas" | "turmas">("cursistas");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setData(results.data);
      }
    });
  };

  const handleImport = async () => {
    setLoading(true);
    const batch = writeBatch(db);
    
    try {
      data.forEach((item) => {
        const id = type === "cursistas" ? item.email.toLowerCase() : item.id;
        const ref = doc(db, type, id);
        batch.set(ref, { 
          ...item, 
          updatedAt: serverTimestamp() 
        });
      });

      await batch.commit();
      setSuccess(true);
      setData([]);
    } catch (err) {
      setError("Erro ao importar dados. Verifique o formato do arquivo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout userRole="ADMIN">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Importação de Dados</h1>
            <p className="text-on-surface-variant">Atualize a base de dados via arquivo CSV.</p>
          </div>
          <div className="flex bg-surface-container p-1 rounded-2xl border border-surface-border">
            <button 
              onClick={() => { setType("cursistas"); setData([]); }}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${type === "cursistas" ? "bg-primary text-on-primary shadow-lg" : "text-primary hover:bg-primary/5"}`}
            >
              Cursistas
            </button>
            <button 
              onClick={() => { setType("turmas"); setData([]); }}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${type === "turmas" ? "bg-primary text-on-primary shadow-lg" : "text-primary hover:bg-primary/5"}`}
            >
              Turmas
            </button>
          </div>
        </header>

        {success && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 p-6 rounded-[2rem] flex items-center gap-4">
            <CheckCircle2 size={24} />
            <p className="font-bold">Importação concluída com sucesso!</p>
            <button onClick={() => setSuccess(false)} className="ml-auto text-xs underline">Fechar</button>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-surface-border shadow-sm text-center">
              <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
                <Upload size={32} />
              </div>
              <h3 className="font-bold text-primary mb-2">Upload de CSV</h3>
              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                Selecione o arquivo com as colunas padrão para importar para a coleção <span className="font-bold text-primary uppercase">{type}</span>.
              </p>
              
              <label className="block">
                <span className="sr-only">Escolher arquivo</span>
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-on-surface-variant
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-xs file:font-bold
                    file:bg-primary file:text-on-primary
                    hover:file:bg-primary-container
                    cursor-pointer"
                />
              </label>
            </div>

            <div className="bg-surface-container p-6 rounded-2xl border border-surface-border">
              <h4 className="text-[10px] font-bold text-primary uppercase mb-4 flex items-center gap-2">
                <Database size={14} /> Estatísticas da Base
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-on-surface-variant">Prontos para envio</span>
                  <span className="text-lg font-bold text-primary">{data.length}</span>
                </div>
                <button 
                  onClick={handleImport}
                  disabled={data.length === 0 || loading}
                  className="w-full py-3 bg-secondary-container text-on-secondary-container font-bold rounded-full flex items-center justify-center gap-2 disabled:opacity-30 hover:scale-105 active:scale-95 transition-all"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <><Database size={16} /> Processar Agora</>}
                </button>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-2">
            <div className="bg-surface-container-lowest rounded-[2rem] border border-surface-border shadow-sm overflow-hidden h-[600px] flex flex-col">
              <div className="px-8 py-4 border-b border-surface-border bg-surface-container-low flex justify-between items-center">
                <h3 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                  <Table size={14} /> Pré-visualização dos Dados
                </h3>
              </div>

              <div className="flex-1 overflow-auto">
                {data.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-40 p-12 text-center">
                    <FileSpreadsheet size={64} className="mb-4" />
                    <p>Carregue um arquivo CSV para visualizar os dados aqui antes de processar.</p>
                  </div>
                ) : (
                  <table className="w-full text-xs text-left">
                    <thead className="bg-surface-container-low sticky top-0">
                      <tr>
                        {Object.keys(data[0]).map(k => (
                          <th key={k} className="px-4 py-3 font-bold border-b border-surface-border text-primary">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {data.slice(0, 50).map((row, i) => (
                        <tr key={i} className="hover:bg-primary/5 transition-colors">
                          {Object.values(row).map((val: any, j) => (
                            <td key={j} className="px-4 py-3 whitespace-nowrap">{val}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              {data.length > 50 && (
                <div className="p-4 bg-surface-container-low text-center text-[10px] text-on-surface-variant border-t border-surface-border">
                  Exibindo as primeiras 50 linhas de {data.length} registros.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
