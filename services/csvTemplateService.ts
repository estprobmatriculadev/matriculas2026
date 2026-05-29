// Serviço para gerar templates de CSV para importação

export const generateCursistasTemplate = () => {
  const headers = [
    "EmailGoogleEducation",
    "nome_completo",
    "cpf",
    "data_nascimento",
    "telefone",
    "escola_nomeacao",
    "modalidade_vinculacao",
    "ano_ingresso_rede",
    "municipio",
  ];

  const exampleRow = [
    "professor@escola.pr.gov.br",
    "João Silva Santos",
    "123.456.789-00",
    "1985-06-15",
    "(41) 98765-4321",
    "E.M. Prof. José de Alencar",
    "QPM",
    "2020",
    "Curitiba",
  ];

  const csv = [headers.join(","), exampleRow.join(",")].join("\n");
  return csv;
};

export const generateTurmasTemplate = () => {
  const headers = [
    "id_turma",
    "nome_turma_matricula",
    "modalidade",
    "ano_formativo",
    "vagas_totais",
    "data_inicio",
    "data_termino",
    "responsavel",
    "descricao",
  ];

  const exampleRow = [
    "TURMA001",
    "Turma A - Estágio Probatório 2026",
    "Presencial",
    "1º Ano",
    "30",
    "2026-02-01",
    "2026-12-20",
    "Admin",
    "Turma regular do programa de formação",
  ];

  const csv = [headers.join(","), exampleRow.join(",")].join("\n");
  return csv;
};

export const downloadCSV = (content: string, filename: string) => {
  const element = document.createElement("a");
  const file = new Blob([content], { type: "text/csv;charset=utf-8" });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};
