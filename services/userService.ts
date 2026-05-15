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
}

export const syncUserSession = async (user: User) => {
  if (!user.email) throw new Error("E-mail não fornecido pelo provedor.");
  
  const userRef = doc(db, "users", user.email.toLowerCase());
  const userSnap = await getDoc(userRef);

  const userData = {
    uid: user.uid,
    email: user.email.toLowerCase(),
    displayName: user.displayName,
    photoURL: user.photoURL,
    lastLogin: serverTimestamp(),
  };

  if (!userSnap.exists()) {
    await setDoc(userRef, { ...userData, role: "CURSISTA", createdAt: serverTimestamp() });
    return { role: "CURSISTA" };
  } else {
    await setDoc(userRef, userData, { merge: true });
    return userSnap.data() as { role: string };
  }
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
      DiscFuncExeNome: d.DiscFuncExeNome || "",
      EstabExeNome: d.EstabExeNome || "",
      Vinculo: d.Vinculo || "",
      modalidade_calc: modalidade,
      ano_formativo_calc: ano,
      componente_matriz: d.ComponenteCurricularMatriz || ""
    };
  });
};
