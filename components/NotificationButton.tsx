"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle2, AlertCircle } from "lucide-react";
import { requestNotificationPermission, setupNotificationListener, saveNotificationToken } from "@/services/notificationService";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationButtonProps {
  userId?: string;
}

export default function NotificationButton({ userId }: NotificationButtonProps) {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [loading, setLoading] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [status, setStatus] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const notifPerm = Notification.permission as NotificationPermission;
      setPermission(notifPerm);

      // Configurar listener de notificações se já tem permissão
      if (notifPerm === "granted") {
        setupNotificationListener();
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      const token = await requestNotificationPermission();

      if (token && userId) {
        await saveNotificationToken(userId, token);
        setStatus("success");
        setPermission("granted");
      } else if (!token) {
        setStatus("error");
        setPermission("denied");
      }

      setupNotificationListener();
    } catch (error) {
      console.error("Erro ao solicitar notificações:", error);
      setStatus("error");
    } finally {
      setLoading(false);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    }
  };

  const isEnabled = permission === "granted";

  return (
    <div className="relative">
      <button
        onClick={handleRequestPermission}
        disabled={loading}
        className={`relative p-2 rounded-xl transition-all ${
          isEnabled
            ? "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20"
            : "text-on-surface-variant hover:bg-surface-container"
        } disabled:opacity-50`}
        title={isEnabled ? "Notificações ativadas" : "Ativar notificações"}
      >
        <Bell size={20} />
        {isEnabled && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
        )}
      </button>

      {/* Status Toast */}
      <AnimatePresence>
        {showStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full mt-2 bg-surface-container-low rounded-xl p-3 min-w-max shadow-lg border border-surface-border text-xs"
          >
            <div className="flex items-center gap-2">
              {status === "success" ? (
                <>
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Notificações habilitadas!</span>
                </>
              ) : (
                <>
                  <AlertCircle size={14} className="text-error" />
                  <span>Erro ao habilitar notificações</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
