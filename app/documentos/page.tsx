"use client";

import { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  Search, 
  Download, 
  MessageCircle, 
  Send, 
  X, 
  Bot, 
  User,
  Loader2,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { getGeminiResponse } from "@/services/geminiService";

export default function DocumentosPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "model", text: string }[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const q = query(collection(db, "documentos"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || chatLoading) return;
    
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setChatLoading(true);

    const history = messages.map(m => ({ 
      role: m.role, 
      parts: [{ text: m.text }] 
    }));

    const response = await getGeminiResponse(userMsg, history);
    setMessages(prev => [...prev, { role: "model", text: response }]);
    setChatLoading(false);
  };

  return (
    <div className="max-w-6xl w-full p-6">
      <header className="mb-12">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="text-brand-ep-light" />
          Documentos Oficiais
        </h1>
        <p className="text-white/40">Manuais, editais e orientações institucionais para 2026.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Documents List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex justify-center py-20 opacity-20"><Loader2 className="animate-spin" /></div>
          ) : docs.length === 0 ? (
            <div className="glass p-12 text-center rounded-3xl text-white/20">Nenhum documento publicado no momento.</div>
          ) : (
            docs.map(doc => (
              <motion.div 
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-6 rounded-2xl flex items-center justify-between group hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-brand-ep-light">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold">{doc.titulo}</h3>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest">{doc.categoria}</p>
                  </div>
                </div>
                <a 
                  href={doc.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-brand-ep-light hover:text-white transition-all"
                >
                  <Download className="w-4 h-4" />
                </a>
              </motion.div>
            ))
          )}
        </div>

        {/* FAQ Widget / Quick Access */}
        <div className="space-y-6">
          <div 
            onClick={() => setChatOpen(true)}
            className="glass p-8 rounded-3xl bg-brand-ep-light/10 border-brand-ep-light/20 cursor-pointer group hover:bg-brand-ep-light/20 transition-all"
          >
            <Bot className="w-10 h-10 text-brand-ep-light mb-4" />
            <h3 className="text-xl font-bold mb-2">Dúvidas? Fale com o Clovis</h3>
            <p className="text-sm text-white/50 mb-6">Nosso assistente de IA está pronto para responder sobre prazos e regras.</p>
            <div className="flex items-center gap-2 text-brand-ep-light font-bold text-sm">
              Iniciar Chat <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </div>

      {/* Gemini Chat Sidebar/Modal */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed inset-y-0 right-0 w-full max-w-md glass z-50 shadow-2xl flex flex-col border-l border-white/10"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-brand-ep-light/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-ep-light rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Assistente Clovis</h4>
                  <span className="text-[10px] text-brand-ep-light font-bold uppercase tracking-widest">Online</span>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white/40 hover:text-white"><X /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.length === 0 && (
                <div className="text-center py-20 text-white/20">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  <p className="text-sm">Olá! Como posso ajudar com sua matrícula hoje?</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-brand-ep-light text-white' : 'bg-white/5 text-white/80'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-4 rounded-2xl"><Loader2 className="w-4 h-4 animate-spin opacity-40" /></div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 border-t border-white/5 bg-black/20">
              <div className="relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Sua dúvida aqui..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 outline-none focus:border-brand-ep-light transition-all"
                />
                <button 
                  onClick={handleSendMessage}
                  className="absolute right-3 top-3 w-10 h-10 bg-brand-ep-light text-white rounded-xl flex items-center justify-center hover:scale-105 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
