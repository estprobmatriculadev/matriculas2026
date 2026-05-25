import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where, orderBy } from "firebase/firestore";
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
    return userSnap.data() as { role: string; tutorariosIds?: string[] };
  }
};

export const getTutoriariosMatriculas = async (tutorEmail: string) => {
  try {
    const tutorRef = doc(db, "users", tutorEmail.toLowerCase());
    const tutorSnap = await getDoc(tutorRef);
    
    if (!tutorSnap.exists() || tutorSnap.data().role !== "TUTOR") {
      throw new Error("Usuário não é um TUTOR válido");
    }
    
    const tutorariosIds: string[] = tutorSnap.data().tutorariosIds || [];
    if (tutorariosIds.length === 0) {
      return [];
    }

    // Buscar matrículas de todos os cursistas que este tutor acompanha
    const matriculasRef = collection(db, "matriculas");
    
    const querySnapshots = await Promise.all(
      tutorariosIds.map((cursistaNome: string) =>
        getDocs(query(
          matriculasRef,
          where("cursistaNome", "==", cursistaNome),
          orderBy("createdAt", "desc")
        ))
      )
    );

    const matriculas: any[] = [];
    querySnapshots.forEach((snap, index) => {
      snap.docs.forEach((doc: any) => {
        matriculas.push({
          id: doc.id,
          ...doc.data(),
          tutoriarioNome: tutorariosIds[index]
        });
      });
    });

    return matriculas;
  } catch (error) {
    console.error("Erro ao buscar matrículas dos tutorados:", error);
    return [];
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
