import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { User } from "firebase/auth";

export interface UserVinculo {
  DiscFuncExeNome: string;
  EstabExeNome: string;
  Vinculo: string;
  modalidade_calc?: string;
  ano_formativo_calc?: string;
  componente_matriz?: string;
  nome_da_mae?: string;
}

export const syncUserSession = async (user: User) => {
  if (!user.email) throw new Error("E-mail não fornecido pelo provedor.");
  
  const emailLower = user.email.toLowerCase();
  const userRefLower = doc(db, "users", emailLower);
  const userSnapLower = await getDoc(userRefLower);

  let role = "CURSISTA";
  let createdAt = serverTimestamp();
  if (userSnapLower.exists()) {
    role = userSnapLower.data().role || "CURSISTA";
    if (userSnapLower.data().createdAt) {
      createdAt = userSnapLower.data().createdAt;
    }
  }

  const userData = {
    uid: user.uid,
    email: emailLower,
    displayName: user.displayName,
    photoURL: user.photoURL,
    lastLogin: serverTimestamp(),
    role: role,
    createdAt: createdAt
  };

  // Sync to lowercase document
  await setDoc(userRefLower, userData, { merge: true });

  // Sync to original casing document if different to support Firestore Security Rules
  if (user.email !== emailLower) {
    const userRefOriginal = doc(db, "users", user.email);
    await setDoc(userRefOriginal, userData, { merge: true });
  }

  return { role };
};

export const processarPerfilCursista = (dados: any[]): UserVinculo[] => {
  return dados.map(d => {
    let modalidade = "N/A";
    let ano = "N/A";
    
    const obs = (d.Observacao || "").toUpperCase();
    if (obs.includes("EJA")) modalidade = "EJA";
    else if (obs.includes("REGULAR")) modalidade = "REGULAR";
    else if (obs.includes("PROFISSIONAL")) modalidade = "PROFISSIONAL";

    const matriz = (d.ComponenteCurricularMatriz || "").toUpperCase();
    if (matriz.includes("1 ANO")) ano = "1 ANO";
    else if (matriz.includes("2 ANO")) ano = "2 ANO";
    else if (matriz.includes("3 ANO")) ano = "3 ANO";

    return {
      DiscFuncExeNome: d.DiscFuncExeNome || d.nome || "",
      EstabExeNome: d.EstabExeNome || "",
      Vinculo: d.Vinculo || d.vinculo || "",
      modalidade_calc: modalidade,
      ano_formativo_calc: ano,
      componente_matriz: d.ComponenteCurricularMatriz || d.componente || "",
      nome_da_mae: d.nome_da_mae || d.nome_mae || ""
    };
  });
};

export const normalizarString = (str: string): string => {
  return str
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};
