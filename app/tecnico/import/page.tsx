"use client";

import { useState } from "react";
import Papa from "papaparse";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Table as TableIcon, 
  ArrowRight,
  Database,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { importarDadosBase } from "@/services/importService";

type ImportType = "cursistas" | "turmas";

export default function ImportPage() {
  const [type, setType] = useState<ImportType>("cursistas");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setSuccess(false);
      setError("");
      
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setPreview(results.data.slice(0, 10)); // Show first 10 rows
        },
        error: (err) => {
          setError("Erro ao ler o arquivo CSV: " + err.message);
        }
      });
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          await importarDadosBase(type, results.data);
          setSuccess(true);
          setPreview([]);
          setFile(null);
        } catch (err: any) {
          setError("Erro na importação: " + err.message);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <div className="w-full max-w-6xl p-8">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Database className="text-blue-500" />
            Importação de Dados
          </h1>
          <p className="text-white/40">Popule as coleções do sistema via CSV</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Config Side */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 rounded-2xl">
            <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-6">Configuração</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/30 block mb-2">Tipo de Dado</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setType("cursistas")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${type === "cursistas" ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40'}`}
                  >
                    Cursistas
                  </button>
                  <button 
                    onClick={() => setType("turmas")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${type === "turmas" ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40'}`}
                  >
                    Turmas
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <label className="relative glass border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all">
                  <Upload className="w-8 h-8 text-blue-500 mb-4" />
                  <span className="text-sm font-semibold">{file ? file.name : "Selecionar CSV"}</span>
                  <span className="text-xs text-white/30 mt-2">Clique para procurar</span>
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-6 rounded-2xl flex items-center gap-4">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <p className="text-sm">Importação concluída com sucesso!</p>
              </motion.div>
            )}
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-2xl flex items-center gap-4">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <p className="text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="btn-primary w-full flex items-center justify-center gap-3 py-4 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
            {loading ? "Processando..." : "Iniciar Importação"}
          </button>
        </div>

        {/* Preview Side */}
        <div className="lg:col-span-2">
          <div className="glass rounded-3xl overflow-hidden min-h-[400px]">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-white/40" />
                Pré-visualização (10 primeiras linhas)
              </h3>
              {preview.length > 0 && (
                <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-white/40 uppercase">Válido</span>
              )}
            </div>

            <div className="overflow-x-auto">
              {preview.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-white/20">
                  <FileSpreadsheet className="w-16 h-16 mb-4 opacity-10" />
                  <p>Aguardando upload de arquivo...</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-white/5 text-white/40 border-b border-white/5">
                      {Object.keys(preview[0]).map(key => (
                        <th key={key} className="px-6 py-4 font-semibold uppercase tracking-tighter">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="px-6 py-4 text-white/60 truncate max-w-[150px]">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
