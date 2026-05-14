"use client";

import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogIn, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email || "";

      if (!email.toLowerCase().endsWith("@escola.pr.gov.br")) {
        await auth.signOut();
        setError("Acesso restrito a contas @escola.pr.gov.br.");
        return;
      }

      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError("Erro ao realizar login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-12 rounded-3xl max-w-md w-full text-center"
    >
      <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-600/20">
        <ShieldCheck className="w-10 h-10 text-white" />
      </div>

      <h1 className="text-3xl font-bold mb-2">Portal de Matrículas</h1>
      <p className="text-white/50 uppercase tracking-widest text-xs font-semibold mb-8">
        Sistema Integrado EP & PEDFOR
      </p>

      <div className="w-12 h-1 bg-gradient-to-r from-amber-500 to-red-600 mx-auto mb-8 rounded-full" />

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleLogin}
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-3"
      >
        <LogIn className="w-5 h-5" />
        {loading ? "Autenticando..." : "Entrar com @escola"}
      </button>

      <p className="mt-8 text-white/30 text-xs leading-relaxed">
        Utilize seu e-mail institucional para acessar o sistema.<br />
        Em caso de dúvidas, entre em contato com a CFDEG.
      </p>
    </motion.div>
  );
}
