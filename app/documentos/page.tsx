"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import AppLayout from "@/components/AppLayout";
import { getGeminiResponse } from "@/services/geminiService";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  MessageSquare, 
  Send, 
  Bot, 
  Download,
  Upload,
  Mail,
  Loader2,
  X,
  Search,
  Sparkles
} from "lucide-react";
import { syncUserSession } from "@/services/userService";

export default function DocumentosPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>("CURSISTA");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  
  // Doc Upload Form
  const [newDoc, setNewDoc] = useState({ titulo: "", url: "", categoria: "Geral" });

  // Chat State
  const [messages, setMessages] = useState<any[]>([
    { role: "assistant", content: "Olá! Sou o Assistente Clovis. Estou aqui para ajudar você com dúvidas sobre as matrículas 2026, Estágio Probatório ou PedFor. O que deseja saber?" }
  ]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const user = auth.currentUser;
      if (user) {
        const { role } = await syncUserSession(user);
        setUserRole(role);
      }
    };
    init();

    const unsubscribe = onSnapshot(query(collection(db, "documentos"), orderBy("createdAt", "desc")), (snap) => {
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.titulo || !newDoc.url) return;
    setUploading(true);
    await addDoc(collection(db, "documentos"), {
      ...newDoc,
      createdAt: serverTimestamp()
    });
    setNewDoc({ titulo: "", url: "", categoria: "Geral" });
    setUploading(false);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || chatLoading) return;
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setChatLoading(true);
    
    const history = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    try {
      const response = await getGeminiResponse(currentInput, history);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: "assistant", content: "Desculpe, tive um erro ao processar. Verifique se a chave de API está configurada na Vercel." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const isManagement = userRole === "ADMIN" || userRole === "TECNICO";

  return (
    <AppLayout userRole={userRole}>
      <div className="max-w-7xl mx-auto space-y-12 pb-20">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary rounded-[1.5rem] flex items-center justify-center text-on-primary shadow-xl shadow-primary/20">
              <FileText size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-primary tracking-tighter">Central de Apoio</h1>
              <p className="text-on-surface-variant font-medium">Documentos oficiais e inteligência artificial.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowSupport(true)}
            className="flex items-center gap-3 px-8 py-4 bg-secondary text-on-secondary font-black rounded-full shadow-xl hover:scale-105 transition-all group"
          >
            <Mail size={20} className="group-hover:rotate-12 transition-transform" /> Suporte CFDEG
          </button>
        </header>

        <div className="grid lg:grid-cols-12 gap-10">
          {/* FAQ IA Section (Centralized & Larger) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-primary text-on-primary rounded-[3rem] p-10 shadow-2xl relative overflow-hidden flex flex-col h-[700px]">
              <div className="z-10 flex-1 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                      <Bot size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight">Assistente Clóvis</h3>
                      <p className="text-[10px] opacity-60 uppercase font-black tracking-[0.2em]">IA Institucional de Matrículas</p>
                    </div>
                  </div>
                  <Sparkles className="text-secondary-container animate-pulse" />
                </div>

                <div className="flex-1 bg-white/5 border border-white/10 rounded-[2rem] p-6 overflow-y-auto space-y-6 mb-6 scrollbar-hide backdrop-blur-sm">
                  {messages.map((m, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: m.role === "user" ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div className={`p-5 rounded-[1.8rem] text-sm leading-relaxed max-w-[85%] shadow-sm ${
                        m.role === "user" 
                          ? "bg-secondary text-on-secondary font-bold rounded-tr-none" 
                          : "bg-white text-primary font-medium rounded-tl-none"
                      }`}>
                        {m.content}
                      </div>
                    </motion.div>
                  ))}
                  {chatLoading && (
                    <div className="flex gap-4">
                      <div className="p-4 rounded-[1.8rem] bg-white/10 text-white italic text-xs animate-pulse">
                        Clóvis está analisando sua dúvida...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="relative group">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Como posso te ajudar hoje?"
                    className="w-full bg-white border-2 border-transparent focus:border-secondary rounded-[2rem] py-5 pl-8 pr-16 text-primary placeholder-primary/30 outline-none transition-all shadow-xl"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={chatLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-secondary text-on-secondary rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
              
              <div className="absolute -bottom-20 -right-20 opacity-5 pointer-events-none">
                <MessageSquare size={400} />
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="lg:col-span-5 space-y-8">
            {isManagement && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container-high p-8 rounded-[3rem] border border-primary/10 shadow-lg">
                <h3 className="text-xs font-black text-primary uppercase mb-6 flex items-center gap-2 tracking-widest">
                  <Upload size={14} /> Painel de Publicação (Admin)
                </h3>
                <form onSubmit={handleUploadDoc} className="space-y-4">
                  <input 
                    placeholder="Título do Edital/Documento"
                    className="w-full bg-white border border-surface-border rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    value={newDoc.titulo}
                    onChange={e => setNewDoc({...newDoc, titulo: e.target.value})}
                  />
                  <input 
                    placeholder="Link do Documento (Drive/Portal)"
                    className="w-full bg-white border border-surface-border rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    value={newDoc.url}
                    onChange={e => setNewDoc({...newDoc, url: e.target.value})}
                  />
                  <button 
                    disabled={uploading}
                    className="w-full bg-primary text-on-primary font-black rounded-2xl py-4 text-sm hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/20 transition-all active:scale-95"
                  >
                    {uploading ? <Loader2 className="animate-spin mx-auto" /> : "Publicar Documento"}
                  </button>
                </form>
              </motion.div>
            )}

            <div className="bg-surface-container-lowest rounded-[3rem] border border-surface-border shadow-xl overflow-hidden flex flex-col h-full max-h-[700px]">
              <div className="px-10 py-6 border-b border-surface-border bg-surface-container-low flex justify-between items-center">
                <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">Biblioteca Digital</span>
                <Search size={16} className="text-on-surface-variant opacity-40" />
              </div>
              
              <div className="flex-1 overflow-y-auto divide-y divide-surface-border scrollbar-hide">
                {docs.length === 0 ? (
                  <div className="p-20 text-center text-on-surface-variant italic opacity-40">
                    Nenhum documento disponível.
                  </div>
                ) : (
                  docs.map(d => (
                    <div key={d.id} className="p-8 flex items-center justify-between hover:bg-surface-container-low transition-colors group">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all shadow-sm">
                          <FileText size={28} />
                        </div>
                        <div>
                          <h4 className="font-black text-primary leading-tight">{d.titulo}</h4>
                          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mt-1">{d.categoria || "Geral"}</p>
                        </div>
                      </div>
                      <a 
                        href={d.url} 
                        target="_blank" 
                        className="p-4 bg-surface-container rounded-full text-primary hover:bg-primary hover:text-on-primary transition-all shadow-md group-hover:rotate-12"
                      >
                        <Download size={20} />
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Modal (Unchanged functionality, improved UI) */}
      <AnimatePresence>
        {showSupport && (
          <div className="fixed inset-0 bg-primary/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-[3.5rem] max-w-xl w-full p-12 shadow-2xl relative border-4 border-white"
            >
              <button onClick={() => setShowSupport(false)} className="absolute top-8 right-8 text-on-surface-variant hover:text-primary transition-colors">
                <X size={32} />
              </button>
              <div className="text-center mb-10">
                <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-primary shadow-inner">
                  <Mail size={48} />
                </div>
                <h2 className="text-3xl font-black text-primary tracking-tighter">Suporte Técnico CFDEG</h2>
                <p className="text-on-surface-variant font-medium mt-2">Dúvidas sobre o sistema ou processos de matrícula.</p>
              </div>

              <form action={`mailto:est.probmatricula@escola.pr.gov.br`} method="GET" className="space-y-8">
                <input type="hidden" name="subject" value="Solicitação de Suporte - Portal de Matrículas" />
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-4">Descreva sua solicitação</label>
                  <textarea 
                    name="body"
                    required
                    placeholder="Olá, gostaria de ajuda com..."
                    className="w-full bg-surface-container-low border-2 border-surface-border rounded-[2.5rem] p-8 text-sm min-h-[150px] outline-none focus:border-primary transition-all shadow-inner"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-5 bg-primary text-on-primary font-black rounded-full shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all text-lg tracking-tight"
                >
                  Enviar para est.probmatricula@escola.pr.gov.br
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
