import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export type Modality = "DOCENTE" | "EQUIPE GESTORA" | "TÉCNICOS";
export type FormativeYear = "1º ANO" | "2º/3º ANO";

export interface UserVinculo {
  Vinculo: string;
  DiscNome: string;
  DiscFuncExeNome: string;
  EstabExeNome: string;
  GrupoExeDescricao: string;
  TurnoExeDescricao: string;
  PeriodoIni: string;
  modalidade_calc: Modality;
  ano_formativo_calc: FormativeYear;
  componente_matriz: string;
}

export const normalizarString = (str: string): string => {
  return str
    ?.toString()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase() || "";
};

export const mapearComponenteParaTurma = (
  discNome: string,
  modalidade: Modality,
  discFuncExeNome: string
): string => {
  if (modalidade === "EQUIPE GESTORA") return "EQ GESTORA";
  
  const discEfetivo = (!discNome || discNome.toUpperCase() === "NULL") 
    ? (discFuncExeNome || "") 
    : discNome;
    
  if (!discEfetivo) return "";

  const n = normalizarString(discEfetivo);
  
  if (n.includes("PORTUGUES") || n === "LINGUA PORTUGUESA") return "PORTUGUES";
  if (n.includes("LEITURA") || n.includes("REDACAO") || n.includes("LITERATURA")) return "PORTUGUES";
  if (n === "MATEMATICA") return "MATEMATICA";
  if (n === "HISTORIA") return "HISTORIA";
  if (n === "GEOGRAFIA") return "GEOGRAFIA";
  if (n === "BIOLOGIA") return "BIOLOGIA";
  if (n === "FISICA") return "FISICA";
  if (n === "QUIMICA") return "QUIMICA";
  if (n === "FILOSOFIA") return "FILOSOFIA";
  if (n === "SOCIOLOGIA") return "SOCIOLOGIA";
  if (n === "ARTE") return "ARTE";
  if (n === "CIENCIAS") return "CIENCIAS";
  if (n.includes("INGLES")) return "INGLES";
  if (n === "EDUCACAO FISICA") return "EDUCACAO FISICA";
  if (n === "PEDAGOGO" || n === "ORIENTADOR EDUCACIONAL" || n === "EQUIPE PEDAGOGICA") return "EQ GESTORA";
  
  return n;
};

export const calcularAnoFormativo = (periodoIni: string): FormativeYear => {
  if (!periodoIni) return "2º/3º ANO";
  const data = new Date(periodoIni);
  if (isNaN(data.getTime())) return "2º/3º ANO";

  const time = data.getTime();
  // Simplified ranges from legacy codigo.gs
  if (time >= new Date("2025-05-11").getTime()) return "1º ANO";
  return "2º/3º ANO";
};

export const processarPerfilCursista = (dados: any[]): UserVinculo[] => {
  const resultados = dados.map((v) => {
    const estab = normalizarString(v.EstabExeNome);
    const func = normalizarString(v.DiscFuncExeNome);
    const disc = normalizarString(v.DiscNome);
    const grupo = normalizarString(v.GrupoExeDescricao);

    let modalidade: Modality = "DOCENTE";
    if (
      estab.includes("NUCLEO REG EDUCACAO") ||
      estab.includes("SEED") ||
      grupo.includes("NRE") ||
      grupo.includes("SEED") ||
      disc.includes("ATUA NUCLEO") ||
      func.includes("ATUA NUCLEO")
    ) {
      modalidade = "TÉCNICOS";
    } else if (
      grupo === "LOTACAO NO MUNICIPIO" ||
      func.includes("DIRETOR") ||
      func.includes("EQUIPE PEDAGOGICA") ||
      disc.includes("PEDAGOGO")
    ) {
      modalidade = "EQUIPE GESTORA";
    }

    const ano_formativo_calc = calcularAnoFormativo(v.PeriodoIni);

    return {
      ...v,
      modalidade_calc: modalidade,
      ano_formativo_calc,
    };
  });

  // Regra de Ouro: Se qualquer QPM for 1º Ano, tudo é 1º Ano
  const temIndicio1oAnoQPM = resultados.some((v) => {
    const isQPM = v.Vinculo?.toUpperCase().includes("QPM") || v.GrupoExeDescricao?.toUpperCase().includes("QPM");
    return isQPM && v.ano_formativo_calc === "1º ANO";
  });

  if (temIndicio1oAnoQPM) {
    resultados.forEach((v) => {
      v.ano_formativo_calc = "1º ANO";
    });
  }

  // Mapear componentes
  resultados.forEach((v) => {
    v.componente_matriz = mapearComponenteParaTurma(v.DiscNome, v.modalidade_calc, v.DiscFuncExeNome);
  });

  return resultados;
};

export const verificarCotaEscolaPEDFOR = async (escolaNome: string): Promise<boolean> => {
  const q = query(
    collection(db, "matriculas"),
    where("fluxo", "==", "PEDFOR"),
    where("EstabExeNome", "==", normalizarString(escolaNome)),
    where("status", "==", "CONFIRMADA")
  );
  const snapshot = await getDocs(q);
  return snapshot.size > 0; // Se já existe, cota atingida
};
