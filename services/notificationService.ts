import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import { initializeApp } from "firebase/app";

let messaging: Messaging | null = null;

// Inicializar Firebase Messaging
const initializeMessaging = () => {
  if (typeof window !== "undefined" && !messaging) {
    try {
      messaging = getMessaging();
    } catch (error) {
      console.warn("Firebase Messaging não está disponível");
    }
  }
  return messaging;
};

// Registrar o Service Worker
export const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator && typeof window !== "undefined") {
    try {
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      console.log("Service Worker registrado com sucesso:", registration);
      return registration;
    } catch (error) {
      console.error("Erro ao registrar Service Worker:", error);
    }
  }
};

// Solicitar permissão e obter token FCM
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    // Verificar suporte do navegador
    if (!("Notification" in window)) {
      console.warn("Este navegador não suporta notificações");
      return null;
    }

    // Solicitar permissão
    if (Notification.permission === "denied") {
      console.warn("Permissão de notificação foi negada");
      return null;
    }

    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("Permissão de notificação não foi concedida");
        return null;
      }
    }

    // Registrar Service Worker
    await registerServiceWorker();

    // Inicializar messaging
    const msg = initializeMessaging();
    if (!msg) return null;

    // Obter token
    const token = await getToken(msg, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    console.log("FCM Token obtido:", token);
    return token;
  } catch (error) {
    console.error("Erro ao solicitar permissão de notificação:", error);
    return null;
  }
};

// Configurar listener para mensagens de foreground
export const setupNotificationListener = (callback?: (message: any) => void) => {
  try {
    const msg = initializeMessaging();
    if (!msg) return;

    onMessage(msg, (payload) => {
      console.log("Notificação recebida em foreground:", payload);

      // Mostrar notificação no navegador
      if (payload.notification) {
        new Notification(payload.notification.title || "Nova notificação", {
          icon: payload.notification.icon,
          badge: "/icon.png",
          body: payload.notification.body,
        });
      }

      // Chamar callback se fornecido
      if (callback) {
        callback(payload);
      }
    });
  } catch (error) {
    console.error("Erro ao configurar listener de notificações:", error);
  }
};

// Armazenar token FCM no Firestore
export const saveNotificationToken = async (userId: string, token: string) => {
  try {
    const response = await fetch("/api/notifications/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, token }),
    });

    if (!response.ok) {
      throw new Error("Erro ao salvar token");
    }

    console.log("Token de notificação salvo com sucesso");
  } catch (error) {
    console.error("Erro ao salvar token de notificação:", error);
  }
};
