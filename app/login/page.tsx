"use client";
export const dynamic = "force-dynamic";


import { useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ShieldCheck, Info, Loader2 } from "lucide-react";
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

      await syncUserSession(result.user);
      router.push("/dashboard");
    } catch (error: any) {
      console.error(error);
      setError("Erro ao autenticar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Decorative background elements from the model style */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-surface-container-highest/30 rounded-full blur-[120px] -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-primary/5 rounded-full blur-[120px] -ml-32 -mb-32" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-2xl border border-surface-border z-10"
      >
        {/* Banner Section */}
        <div className="w-full bg-white p-8 flex items-center justify-center border-b border-surface-border">
          <img 
            src="https://www.educacao.pr.gov.br/sites/default/arquivos_restritos/files/imagem/2025-07/estagio-probatorio690x311.png" 
            alt="Estágio Probatório"
            className="w-full h-auto max-h-32 object-contain"
          />
        </div>

        <div className="p-10 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary mb-2">Sistema de Matrículas</h1>
            <p className="text-on-surface-variant text-sm">Gestão Integrada EP & PEDFOR</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-error-container text-on-error-container rounded-2xl flex items-start gap-3"
            >
              <Info className="w-5 h-5 shrink-0" />
              <p className="text-xs font-medium">{error}</p>
            </motion.div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-primary text-on-primary hover:bg-primary-container font-bold py-4 rounded-full flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/icon_google.svg" className="w-5 h-5" alt="Google Logo" />
                  Entrar com @escola
                </>
              )}
            </button>

            <div className="flex items-center gap-2 justify-center text-outline text-[10px] uppercase tracking-widest font-bold">
              <ShieldCheck className="w-3 h-3" />
              Acesso Institucional Seguro
            </div>
          </div>
        </div>

        <div className="bg-surface-container-low p-6 text-center border-t border-surface-border">
          <p className="text-on-surface-variant text-[10px] leading-relaxed">
            © 2026 Secretaria da Educação do Paraná<br/>
            Coordenação de Formação de Docentes e Gestores
          </p>
        </div>
      </motion.div>
    </div>
  );
}
