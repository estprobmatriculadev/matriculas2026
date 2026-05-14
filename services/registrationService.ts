import { db } from "@/lib/firebase";
import { 
  doc, 
  runTransaction, 
  serverTimestamp, 
  collection
} from "firebase/firestore";
import { triggerGerarComprovante } from "./appsScriptBridge";

export interface RegistrationData {
  cursistaEmail: string;
  cursistaNome: string;
  turmaId: string;
  fluxo: "EP" | "PEDFOR";
  EstabExeNome?: string;
  vinculoOrigem?: string; // Adicionado para corrigir o erro de build
  anoFormativo?: string;
  diaSemana?: string;
  horarioIni?: string;
  turno?: string;
}

export const efetivarMatricula = async (data: RegistrationData) => {
  try {
    const result = await runTransaction(db, async (transaction) => {
      const turmaRef = doc(db, "turmas", data.turmaId);
      const turmaDoc = await transaction.get(turmaRef);

      if (!turmaDoc.exists()) {
        throw new Error("Turma não encontrada.");
      }

      const turmaData = turmaDoc.data();
      if (turmaData.vagas <= 0) {
        throw new Error("Não há vagas disponíveis para esta turma.");
      }

      const matriculaRef = doc(collection(db, "matriculas"));
      transaction.set(matriculaRef, {
        ...data,
        turmaNome: turmaData.nome_turma_matricula,
        createdAt: serverTimestamp(),
        status: "CONFIRMADA"
      });

      transaction.update(turmaRef, {
        vagas: turmaData.vagas - 1,
        matriculados: (turmaData.matriculados || 0) + 1
      });

      return { 
        id: matriculaRef.id, 
        turmaNome: turmaData.nome_turma_matricula,
        diaSemana: turmaData.dia_semana,
        horarioIni: turmaData.horario_ini
      };
    });

    triggerGerarComprovante({
      cursistaNome: data.cursistaNome,
      cursistaEmail: data.cursistaEmail,
      programa: data.fluxo,
      turmaNome: result.turmaNome,
      diaSemana: result.diaSemana || "A definir",
      horarioIni: result.horarioIni || "A definir"
    });

    return { success: true, matriculaId: result.id };
  } catch (error: any) {
    console.error("Erro na transação de matrícula:", error);
    return { success: false, error: error.message };
  }
};
