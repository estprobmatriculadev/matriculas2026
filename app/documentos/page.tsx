"use client";
export const dynamic = "force-dynamic";


import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import AppLayout from "@/components/AppLayout";
import { getGeminiResponse } from "@/services/geminiService";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Search, 
  MessageSquare, 
  Send, 
  User, 
  Bot, 
  ExternalLink,
  Download,
  Info
} from "lucide-react";

export default function DocumentosPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    { role: "assistant", content: "Olá! Sou o Assistente Clovis. Como posso ajudar você com suas dúvidas sobre matrículas, EP ou PedFor?" }
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    carregarDocumentos();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const carregarDocumentos = async () => {
    const q = query(collection(db, "documentos"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    
    const response = await getGeminiResponse(input);
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        <header>
          <h1 className="text-3xl font-bold text-primary">Documentos e Suporte</h1>
          <p className="text-on-surface-variant">Acesse editais, manuais e tire suas dúvidas com nossa IA.</p>
        </header>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Documentos List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Buscar documento ou edital..." 
                className="w-full bg-surface-container-lowest border border-surface-border rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
              />
            </div>

            <div className="bg-surface-container-lowest rounded-[2rem] border border-surface-border shadow-sm overflow-hidden">
              <div className="px-8 py-4 border-b border-surface-border bg-surface-container-low flex justify-between items-center">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">Documentos Oficiais</span>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded font-bold">PDF / LINKS</span>
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
            <div className="bg-primary text-on-primary rounded-[2rem] p-8 shadow-xl relative overflow-hidden flex flex-col h-[500px]">
              <div className="z-10 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-on-primary/20 rounded-full flex items-center justify-center">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold">Assistente Clovis</h3>
                    <p className="text-[10px] opacity-60 uppercase tracking-widest font-bold">Powered by Gemini IA</p>
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
              
              <div className="absolute -bottom-10 -right-10 opacity-10">
                <MessageSquare size={180} />
              </div>
            </div>

            <div className="mt-8 bg-surface-container p-6 rounded-2xl border border-surface-border">
              <h4 className="text-xs font-bold text-primary uppercase mb-3 flex items-center gap-2">
                <Info size={14} /> Dicas de Suporte
              </h4>
              <ul className="text-[11px] text-on-surface-variant space-y-2">
                <li>• Pergunte sobre prazos de matrícula.</li>
                <li>• Tire dúvidas sobre a "Regra de Ouro".</li>
                <li>• Saiba como solicitar remanejamento.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
