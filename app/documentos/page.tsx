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
  Search, 
  MessageSquare, 
  Send, 
  Bot, 
  Download,
  Info,
  Upload,
  Mail,
  Loader2,
  X
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
    { role: "assistant", content: "Olá! Sou o Assistente Clovis. Como posso ajudar você com suas dúvidas sobre matrículas, EP ou PedFor?" }
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
    setInput("");
    setChatLoading(true);
    
    const history = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    try {
      const response = await getGeminiResponse(input, history);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Desculpe, tive um erro ao processar. Tente novamente em instantes." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const isAdmin = userRole === "ADMIN" || userRole === "TECNICO";

  return (
    <AppLayout userRole={userRole}>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Documentos e Suporte</h1>
            <p className="text-on-surface-variant">Acesse editais, manuais e tire suas dúvidas com nossa IA.</p>
          </div>
          <button 
            onClick={() => setShowSupport(true)}
            className="flex items-center gap-2 px-6 py-3 bg-secondary text-on-secondary font-bold rounded-full shadow-lg hover:scale-105 transition-all"
          >
            <Mail size={18} /> Suporte Técnico
          </button>
        </header>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Documentos List */}
          <div className="lg:col-span-2 space-y-6">
            {isAdmin && (
              <div className="bg-surface-container-low p-6 rounded-[2rem] border border-primary/20">
                <h3 className="text-xs font-bold text-primary uppercase mb-4 flex items-center gap-2">
                  <Upload size={14} /> Novo Documento (Admin)
                </h3>
                <form onSubmit={handleUploadDoc} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input 
                    placeholder="Título do Edital"
                    className="bg-white border border-surface-border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    value={newDoc.titulo}
                    onChange={e => setNewDoc({...newDoc, titulo: e.target.value})}
                  />
                  <input 
                    placeholder="Link (URL)"
                    className="bg-white border border-surface-border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    value={newDoc.url}
                    onChange={e => setNewDoc({...newDoc, url: e.target.value})}
                  />
                  <button 
                    disabled={uploading}
                    className="bg-primary text-on-primary font-bold rounded-xl py-2 text-sm hover:opacity-90 disabled:opacity-50"
                  >
                    {uploading ? "Salvando..." : "Adicionar Link"}
                  </button>
                </form>
              </div>
            )}

            <div className="bg-surface-container-lowest rounded-[2rem] border border-surface-border shadow-sm overflow-hidden">
              <div className="px-8 py-4 border-b border-surface-border bg-surface-container-low flex justify-between items-center">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">Editais e Documentos EP / PedFor</span>
              </div>
              
              <div className="divide-y divide-surface-border">
                {docs.length === 0 ? (
                  <div className="p-12 text-center text-on-surface-variant italic">
                    Nenhum documento disponível no momento.
                  </div>
                ) : (
                  docs.map(d => (
                    <div key={d.id} className="p-6 flex items-center justify-between hover:bg-surface-container-low transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
                          <FileText size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface">{d.titulo}</h4>
                          <p className="text-xs text-on-surface-variant">{d.categoria || "Geral"}</p>
                        </div>
                      </div>
                      <a 
                        href={d.url} 
                        target="_blank" 
                        className="p-3 bg-surface-container rounded-full text-primary hover:bg-primary hover:text-on-primary transition-all shadow-sm"
                      >
                        <Download size={18} />
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* FAQ IA Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-primary text-on-primary rounded-[2rem] p-8 shadow-xl relative overflow-hidden flex flex-col h-[600px]">
              <div className="z-10 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-on-primary/20 rounded-full flex items-center justify-center">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold">Assistente Clovis</h3>
                    <p className="text-[10px] opacity-60 uppercase tracking-widest font-bold">Respostas Instantâneas</p>
                  </div>
                </div>

                <div className="flex-1 bg-white/10 rounded-2xl p-4 overflow-y-auto space-y-4 mb-4 scrollbar-hide">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] ${m.role === "user" ? "bg-secondary-container text-on-secondary-container font-medium" : "bg-white/10 text-white"}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex gap-2">
                      <div className="p-3 rounded-2xl bg-white/10 text-white italic text-[10px]">Clovis está pensando...</div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="relative">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Digite sua dúvida..."
                    className="w-full bg-white/10 border border-white/20 rounded-full py-3 pl-4 pr-12 text-sm text-white placeholder-white/40 focus:outline-none focus:bg-white/20 transition-all"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={chatLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
              
              <div className="absolute -bottom-10 -right-10 opacity-10">
                <MessageSquare size={180} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Modal */}
      <AnimatePresence>
        {showSupport && (
          <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] max-w-lg w-full p-10 shadow-2xl relative"
            >
              <button onClick={() => setShowSupport(false)} className="absolute top-6 right-6 text-on-surface-variant hover:text-primary">
                <X size={24} />
              </button>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  <Mail size={32} />
                </div>
                <h2 className="text-2xl font-bold text-primary">Suporte Técnico</h2>
                <p className="text-sm text-on-surface-variant mt-2">Envie sua dúvida para a equipe de coordenação.</p>
              </div>

              <form action={`mailto:est.probmatricula@escola.pr.gov.br`} method="GET" className="space-y-6">
                <input type="hidden" name="subject" value="Solicitação de Suporte - SGM" />
                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase">Mensagem</label>
                  <textarea 
                    name="body"
                    required
                    placeholder="Descreva seu problema aqui..."
                    className="w-full bg-surface-container-low border border-surface-border rounded-2xl p-4 text-sm min-h-[120px] outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-primary text-on-primary font-bold rounded-full shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Abrir Cliente de E-mail
                </button>
              </form>
              
              <div className="mt-8 pt-6 border-t border-surface-border text-center">
                <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">Email Oficial</p>
                <p className="text-sm font-bold text-primary">est.probmatricula@escola.pr.gov.br</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
