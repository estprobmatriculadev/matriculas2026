import { db } from "@/lib/firebase";
import { 
  doc, 
  runTransaction, 
  serverTimestamp, 
  collection,
  addDoc
} from "firebase/firestore";
import { triggerNotificarTecnico } from "./appsScriptBridge";

export type RemanejamentoStatus = "PENDENTE" | "DEFERIDO" | "INDEFERIDO";

export interface RemanejamentoRequest {
  id?: string;
  matriculaId: string;
  cursistaEmail: string;
  cursistaNome: string;
  turmaOrigemId: string;
  turmaOrigemNome: string;
  turmaDestinoId: string;
  turmaDestinoNome: string;
  motivoCursista: string;
  motivoTecnico?: string;
  status: RemanejamentoStatus;
  createdAt: any;
  processedAt?: any;
  tecnicoEmail?: string;
}

// 1. Cursista solicita a troca
export const solicitarRemanejamento = async (data: Omit<RemanejamentoRequest, "status" | "createdAt">) => {
  try {
    const docRef = await addDoc(collection(db, "remanejamentos"), {
      ...data,
      status: "PENDENTE",
      createdAt: serverTimestamp()
    });

    // Notificar técnico via Apps Script
    triggerNotificarTecnico({
      cursistaNome: data.cursistaNome,
      turmaOrigem: data.turmaOrigemNome,
      turmaDestino: data.turmaDestinoNome
    });

    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// 2. Técnico processa a solicitação (Deferir ou Indeferir)
export const processarSolicitacaoRemanejamento = async (
  requestId: string, 
  decisao: "DEFERIDO" | "INDEFERIDO",
  tecnicoEmail: string,
  motivoTecnico: string
) => {
  try {
    const result = await runTransaction(db, async (transaction) => {
      const requestRef = doc(db, "remanejamentos", requestId);
      const requestSnap = await transaction.get(requestRef);
      
      if (!requestSnap.exists()) throw new Error("Solicitação não encontrada.");
      const requestData = requestSnap.data() as RemanejamentoRequest;
      
      if (requestData.status !== "PENDENTE") throw new Error("Esta solicitação já foi processada.");

      if (decisao === "INDEFERIDO") {
        transaction.update(requestRef, {
          status: "INDEFERIDO",
          motivoTecnico,
          tecnicoEmail,
          processedAt: serverTimestamp()
        });
        return { success: true, status: "INDEFERIDO" };
      }

      // Se DEFERIDO, executar a troca de turmas (Lógica Transacional)
      const matriculaRef = doc(db, "matriculas", requestData.matriculaId);
      const turmaOrigemRef = doc(db, "turmas", requestData.turmaOrigemId);
      const turmaDestinoRef = doc(db, "turmas", requestData.turmaDestinoId);

      const tOrigemSnap = await transaction.get(turmaOrigemRef);
      const tDestinoSnap = await transaction.get(turmaDestinoRef);
      const matriculaSnap = await transaction.get(matriculaRef);

      if (!tDestinoSnap.exists() || tDestinoSnap.data().vagas <= 0) {
        throw new Error("A turma de destino não possui mais vagas.");
      }

      // Atualizar Vagas
      if (tOrigemSnap.exists()) {
        transaction.update(turmaOrigemRef, {
          vagas: (tOrigemSnap.data().vagas || 0) + 1,
          matriculados: (tOrigemSnap.data().matriculados || 1) - 1
        });
      }

      const tDestinoData = tDestinoSnap.data();
      transaction.update(turmaDestinoRef, {
        vagas: tDestinoData.vagas - 1,
        matriculados: (tDestinoData.matriculados || 0) + 1
      });

      // Atualizar Matrícula
      transaction.update(matriculaRef, {
        turmaId: requestData.turmaDestinoId,
        turmaNome: tDestinoData.nome_turma_matricula,
        updatedAt: serverTimestamp(),
        historicoRemanejamento: [
          ...(matriculaSnap.data()?.historicoRemanejamento || []),
          { requestId, data: new Date(), status: "DEFERIDO" }
        ]
      });

      // Finalizar Solicitação
      transaction.update(requestRef, {
        status: "DEFERIDO",
        motivoTecnico,
        tecnicoEmail,
        processedAt: serverTimestamp()
      });

      // Log de Auditoria
      const auditRef = doc(collection(db, "logs"));
      transaction.set(auditRef, {
        acao: "REMANEJAMENTO_APROVADO",
        usuario: tecnicoEmail,
        matriculaId: requestData.matriculaId,
        timestamp: serverTimestamp()
      });

      return { success: true, status: "DEFERIDO" };
    });

    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
