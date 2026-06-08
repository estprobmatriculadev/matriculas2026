import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, updateDoc, doc, increment } from "firebase/firestore";

export interface RemanejamentoRequest {
  // Personal & Base
  matriculaId?: string;
  cursistaEmail: string;
  nomeCompleto: string;
  rg: string;
  cpf: string;
  telefone: string;
  padroesEstagio: string;
  tipoAlteracao: string;
  
  // Specifics
  atComponente?: string;
  atAnoFormativo?: string;
  atHorarioAtual?: string;
  atHorarioPretendido?: string;
  atJustificativa?: string;
  
  amModalidadeAtual?: string;
  amModalidadeDestino?: string;
  amHorarioPretendido?: string;
  
  status?: "PENDENTE" | "APROVADO" | "NEGADO";
}

export const solicitarRemanejamento = async (data: any) => {
  try {
    // Remove undefined values to prevent Firestore errors
    const cleanedData = Object.entries(data).reduce((acc: any, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    const docRef = await addDoc(collection(db, "remanejamentos"), {
      ...cleanedData,
      status: "PENDENTE",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Erro ao solicitar remanejamento:", error);
    return { success: false, error: error.message };
  }
};

export const processarAprovacaoRemanejamento = async (requestId: string, adminComment?: string) => {
  // Logic to update status and potentially swap the student in the 'matriculas' collection
  try {
    const requestRef = doc(db, "remanejamentos", requestId);
    await updateDoc(requestRef, {
      status: "APROVADO",
      adminComment,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const processarSolicitacaoRemanejamento = async (requestId: string, status: "DEFERIDO" | "INDEFERIDO") => {
  try {
    const requestRef = doc(db, "remanejamentos", requestId);
    await updateDoc(requestRef, {
      status: status,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao processar solicitação de remanejamento:", error);
    return { success: false, error: error.message };
  }
};

