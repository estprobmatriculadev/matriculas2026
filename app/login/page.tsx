"use client";

import { useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { LogIn, ShieldCheck, Info } from "lucide-react";
import { motion } from "framer-motion";
import { syncUserSession } from "@/services/userService";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;

      if (!email?.endsWith("@escola.pr.gov.br")) {
        await auth.signOut();
        setError("Acesso restrito: Use seu e-mail institucional @escola.pr.gov.br");
        return;
      }

      const { role } = await syncUserSession(result.user);
      router.push("/dashboard");
    } catch (error: any) {
      console.error(error);
      setError("Erro ao autenticar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0d1b4b] relative overflow-hidden">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-ep-dark/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-ep-blue/20 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass rounded-[40px] overflow-hidden shadow-2xl border border-white/10"
      >
        {/* Banner Institucional */}
        <div className="w-full h-48 bg-white relative overflow-hidden p-8 flex items-center justify-center">
          <img 
            src="https://www.educacao.pr.gov.br/sites/default/arquivos_restritos/files/imagem/2025-07/estagio-probatorio690x311.png" 
            alt="Estágio Probatório"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="p-10 space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Portal de Matrículas</h2>
            <p className="text-white/40 text-sm">Secretaria da Educação do Paraná</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3"
            >
              <Info className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-xs text-red-200">{error}</p>
            </motion.div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-white text-[#0d1b4b] hover:bg-white/90 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-xl active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-[#0d1b4b]/20 border-t-[#0d1b4b] rounded-full animate-spin" />
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/icon_google.svg" className="w-5 h-5" alt="Google" />
                  Entrar com @escola
                </>
              )}
            </button>

            <div className="flex items-center gap-2 justify-center text-white/30 text-[10px] uppercase tracking-widest font-bold">
              <ShieldCheck className="w-3 h-3" />
              Acesso Institucional Seguro
            </div>
          </div>
        </div>

        <div className="bg-black/20 p-6 text-center border-t border-white/5">
          <p className="text-white/20 text-[10px] leading-relaxed">
            Ao acessar, você concorda com os termos de uso e política de privacidade da SEED-PR.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
