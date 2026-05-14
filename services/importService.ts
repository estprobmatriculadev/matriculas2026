import { db } from "@/lib/firebase";
import { writeBatch, doc, collection } from "firebase/firestore";
import { normalizarString } from "./userService";

export const importarDadosBase = async (colecao: string, items: any[]) => {
  const batch = writeBatch(db);
  const collectionRef = collection(db, colecao);

  items.forEach((item) => {
    // Sanitização de todos os campos string
    const sanitizedItem: any = {};
    Object.keys(item).forEach((key) => {
      const val = item[key];
      sanitizedItem[key] = typeof val === "string" ? normalizarString(val) : val;
    });

    // Usar email como ID se for cursista, ou id_turma se for turma
    let docRef;
    if (colecao === "cursistas" && sanitizedItem.EmailGoogleEducation) {
      docRef = doc(collectionRef, sanitizedItem.EmailGoogleEducation.toLowerCase());
    } else if (colecao === "turmas" && sanitizedItem.id_turma) {
      docRef = doc(collectionRef, sanitizedItem.id_turma.toString());
    } else {
      docRef = doc(collectionRef);
    }

    batch.set(docRef, sanitizedItem);
  });

  await batch.commit();
};
