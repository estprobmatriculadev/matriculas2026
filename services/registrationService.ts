import { db } from "@/lib/firebase";
import { 
  doc, 
  runTransaction, 
  serverTimestamp, 
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { normalizarString } from "./userService";

export interface RegistrationData {
  cursistaEmail: string;
  cursistaNome: string;
  turmaId: string;
  fluxo: "EP" | "PEDFOR";
  EstabExeNome: string;
  vinculoOrigem: string;
}

export const efetivarMatricula = async (data: RegistrationData) => {
  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. Verificar Vagas na Turma
      const turmaRef = doc(db, "turmas", data.turmaId);
      const turmaDoc = await transaction.get(turmaRef);
      
      if (!turmaDoc.exists()) {
        throw new Error("Turma não encontrada.");
      }

      const turmaData = turmaDoc.data();
      if (turmaData.vagas <= 0) {
        throw new Error("Esta turma não possui mais vagas disponíveis.");
      }

      // 2. Se for PEDFOR, verificar Cota por Escola
      if (data.fluxo === "PEDFOR") {
        const escolaKey = normalizarString(data.EstabExeNome);
        const quotaRef = doc(db, "quotas_pedfor", escolaKey);
        const quotaDoc = await transaction.get(quotaRef);

        if (quotaDoc.exists() && quotaDoc.data().ocupada) {
          throw new Error("Sua escola já atingiu o limite de 1 vaga para o curso PEDFOR.");
        }
        
        // Reservar cota da escola
        transaction.set(quotaRef, { 
          ocupada: true, 
          email: data.cursistaEmail,
          updatedAt: serverTimestamp() 
        }, { merge: true });
      }

      // 3. Verificar se o usuário já está matriculado (Prevenção de duplicidade)
      // Nota: Idealmente usaríamos uma coleção de 'trava_usuario' para garantir atomicidade via transaction
      // mas aqui simplificamos para fins de demonstração.
      
      // 4. Gerar Protocolo
      const timestamp = Date.now();
      const protocolo = `${data.fluxo}${new Date().getFullYear()}${timestamp}`;

      // 5. Baixar Vaga
      transaction.update(turmaRef, {
        vagas: turmaData.vagas - 1,
        matriculados: (turmaData.matriculados || 0) + 1
      });

      // 6. Criar Registro de Matrícula
      const matriculaRef = doc(collection(db, "matriculas"));
      transaction.set(matriculaRef, {
        ...data,
        protocolo,
        status: "CONFIRMADA",
        createdAt: serverTimestamp(),
      });

      return { protocolo };
    });

    return { success: true, protocolo: result.protocolo };
  } catch (error: any) {
    console.error("Erro na transação de matrícula:", error);
    return { success: false, error: error.message };
  }
};
