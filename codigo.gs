/**
 * SISTEMA DE MATRÍCULA - ESTÁGIO PROBATÓRIO 2026
 * Backend: BigQuery (Leitura) & Google Sheets (Gravação)
 *
 * VERSÃO 5.2
 * -----------------------------------------------------------------
 * v5.1 — Correção: DiscNome NULL em vínculos SC02 usa DiscFuncExeNome
 *         como fallback em todo o pipeline de classificação e busca.
 * v5.2 — Correções adicionais:
 *   [1] obterDadosUsuario     : JOIN robusto a DiscNome NULL/string 'NULL'
 *   [2] mapearComponenteParaTurma : 3º parâmetro discFuncExeNome como fallback
 *   [3] processarVinculos     : repassa DiscFuncExeNome ao mapear componente_matriz
 *   [4] buscarTurmasMultiplas : repassa DiscFuncExeNome; deduplicação de condições SQL;
 *                               correção do filtro INTEGRAL (omite filtro de hora)
 *   [5] calcularLimiteMatriculas : fallback DiscFuncExeNome; filtra chaves vazias do Set
 *   [6] efetivarMatricula     : bloqueia gravação quando escolhas está vazio
 *   [7] Remoção do bloco de debug hardcoded de usuário específico
 *   [+] Integração: Limpeza de payload (Raquel) e Regra de Ouro (Lidiane)
 * -----------------------------------------------------------------
 */

// ================================
// CONFIGURAÇÕES GLOBAIS
// ================================
const PROJECT_ID  = 'data-studio-educacao';
const DATASET_ID  = 'matriculas_ep_2026';
const SPREADSHEET_ID = '1pGYz2rIOllQhIETd2DUU8RZ4cV4ZO5lt8GlUDGphMSw';

// Links externos
const LINK_FORM_SUPRIMENTO    = "https://forms.gle/s9TDgZZtFQjpTHGBA";
const LINK_AVALIACAO_FORMATIVA = "https://bit.ly/form-avaliacao-formativa";

// Mensagens para usuários não encontrados na base
const MSG_PERGUNTA_NAO_ENCONTRADO = "Você é servidor(a) da rede estadual do Paraná e está em período de Estágio Probatório?";
const MSG_INSTRUCAO_SIM = "Seu cadastro ainda não consta em nossa base. Preencha o formulário abaixo para solicitar sua inclusão.";
const MSG_NAO = "Apenas servidores estaduais do Paraná em período de Estágio Probatório podem realizar a matrícula.";


// ================================
// ROTAS (PÁGINAS)
// ================================

/**
 * Ponto de entrada da Web App. Roteia para o template HTML correto
 * com base no parâmetro `page` da URL.
 *
 * @param {Object} e - Evento do Apps Script com parâmetros da URL.
 * @returns {HtmlOutput} Página renderizada.
 */
function doGet(e) {
  const page      = (e && e.parameter && e.parameter.page) ? e.parameter.page : "login";
  const scriptUrl = ScriptApp.getService().getUrl();

  const rotas = {
    index:       { template: "index",           title: "Matrícula - Estágio Probatório 2026" },
    confirmacao: { template: "confirmacao",      title: "Confirmação - Estágio Probatório 2026" },
    relatorio:   { template: "report",           title: "Relatório de Turmas - Estágio Probatório 2026" },
    encerrado:   { template: "index_encerrado",  title: "Inscrições Encerradas - Estágio Probatório 2026" }
  };

  const rota    = rotas[page] || { template: "index_encerrado", title: "Inscrições Encerradas - Estágio Probatório 2026" };
  const tmpl    = HtmlService.createTemplateFromFile(rota.template);
  tmpl.scriptUrl = scriptUrl;

  return tmpl.evaluate()
    .setTitle(rota.title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}


// ================================
// FUNÇÕES PRINCIPAIS
// ================================

/**
 * Verifica se o usuário autenticado é elegível para matrícula.
 *
 * @returns {Object} Objeto com `status` e dados relevantes.
 */
function verificarElegibilidade() {
  try {
    const email = Session.getActiveUser().getEmail();
    if (!email) return { status: "ERRO_SERVIDOR", erro: "Usuário não autenticado." };

    if (!email.toLowerCase().endsWith("@escola.pr.gov.br")) {
      return { status: "EMAIL_INVALIDO", mensagem: "Acesso restrito a contas @escola.pr.gov.br." };
    }

    const dados = processarVinculos(obterDadosUsuario(email));

    if (!dados || dados.length === 0) {
      return {
        status:        "NAO_ENCONTRADO",
        email:         email,
        pergunta:      MSG_PERGUNTA_NAO_ENCONTRADO,
        instrucao_sim: MSG_INSTRUCAO_SIM,
        link_form:     LINK_FORM_SUPRIMENTO,
        mensagem_nao:  MSG_NAO
      };
    }

    const maxMatriculas = calcularLimiteMatriculas(dados);
    const dataSheet     = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Data");
    const registros     = (dataSheet && dataSheet.getLastRow() > 0)
      ? dataSheet.getDataRange().getValues()
      : [];

    const minhasMatriculas = registros.filter(row =>
      (row[3] || "").toString().trim().toLowerCase() === email.toLowerCase()
    );

    if (minhasMatriculas.length >= maxMatriculas) {
      const turmasMatriculadas = minhasMatriculas.map(row => ({
        id_turma:      String(row[6]  || ""),
        nome_turma:    String(row[7]  || ""),
        dia_semana:    String(row[15] || ""),
        horario_ini:   String(row[16] || ""),
        turno:         normalizarTurnoExibicao(String(row[17] || "")),
        ano_formativo: String(row[18] || ""),
        componente:    String(row[19] || "")
      }));

      const dataMatricula = minhasMatriculas[0][0];
      return {
        status: "JA_MATRICULADO",
        nome:   dados[0].Nome || "",
        cpf:    dados[0].Cpf  || "",
        email:  email,
        matricula: {
          data:      (dataMatricula instanceof Date) ? dataMatricula.toISOString() : null,
          turmas:    turmasMatriculadas,
          protocolo: String(minhasMatriculas[0][8] || "")
        }
      };
    }

    // [CORREÇÃO RAQUEL] Limpeza de payload para evitar erro de serialização no BQ
    const vinculosLimpos = dados.map(v => ({
      Vinculo: String(v.Vinculo || ""),
      modalidade_calc: String(v.modalidade_calc || ""),
      ano_formativo_calc: String(v.ano_formativo_calc || ""),
      ano_formativo_db: String(v.ano_formativo_db || ""),
      DiscNome: String(v.DiscNome || ""),
      DiscFuncExeNome: String(v.DiscFuncExeNome || ""),
      EstabExeNome: String(v.EstabExeNome || ""),
      GrupoExeDescricao: String(v.GrupoExeDescricao || ""),
      TurnoExeDescricao: String(v.TurnoExeDescricao || ""),
      componente_matriz: String(v.componente_matriz || ""),
      obrigatorio: !!v.obrigatorio
    }));

    return {
      status:               "ELEGIVEL",
      nome:                 (dados[0].Nome || "").toString().toUpperCase(),
      email:                email,
      vinculos:             vinculosLimpos,
      maxMatriculas:        maxMatriculas,
      matriculasExistentes: minhasMatriculas.length
    };

  } catch (e) {
    console.error("Erro crítico verificarElegibilidade: ", e);
    return { status: "ERRO_SERVIDOR", erro: e.toString() };
  }
}


/**
 * Busca as turmas disponíveis para os vínculos QPM do cursista.
 */
function buscarTurmasMultiplas(vinculos) {
  if (!vinculos || vinculos.length === 0) return [];

  const vinculosQPM = vinculos.filter(v =>
    v.Vinculo === "QPM" ||
    (v.GrupoExeDescricao || "").toString().toUpperCase().includes("QPM")
  );

  if (vinculosQPM.length === 0) return [];

  const turnos = [...new Set(
    vinculosQPM.map(v => v.TurnoExeDescricao || v.Turno_Exe).filter(Boolean)
  )];

  const temIntegral = turnos.some(t =>
    (t || "").toUpperCase().trim() === "INTEGRAL"
  );

  const horariosFiltro = [];
  if (!temIntegral) {
    const filtrosUnicos = new Set();
    turnos.forEach(turno => {
      const t = (turno || "").toUpperCase().trim();
      if ((t === "MANHA" || t === "MANHÃ" || t === "MATUTINO") && !filtrosUnicos.has("MANHA")) {
        filtrosUnicos.add("MANHA");
        horariosFiltro.push(`CAST(SPLIT(horario_ini, ':')[OFFSET(0)] AS INT64) < 12`);
      }
      if ((t === "TARDE" || t === "VESPERTINO") && !filtrosUnicos.has("TARDE")) {
        filtrosUnicos.add("TARDE");
        horariosFiltro.push(`(CAST(SPLIT(horario_ini, ':')[OFFSET(0)] AS INT64) >= 12 AND CAST(SPLIT(horario_ini, ':')[OFFSET(0)] AS INT64) < 18)`);
      }
      if ((t === "NOITE" || t === "NOTURNO") && !filtrosUnicos.has("NOITE")) {
        filtrosUnicos.add("NOITE");
        horariosFiltro.push(`CAST(SPLIT(horario_ini, ':')[OFFSET(0)] AS INT64) >= 18`);
      }
    });
  }

  const filtroHoras = horariosFiltro.length > 0 ? `AND (${horariosFiltro.join(" OR ")})` : "";
  const condicoesSet = new Set();
  const condicoes    = [];

  vinculosQPM.forEach(v => {
    const modalidadeBusca = v.modalidade_calc;
    const ano = v.ano_formativo_calc;
    const componenteParaFiltro = mapearComponenteParaTurma(v.DiscNome, v.modalidade_calc, v.DiscFuncExeNome);

    const chave = `${modalidadeBusca}|${ano}|${componenteParaFiltro}`;
    if (condicoesSet.has(chave)) return;
    condicoesSet.add(chave);

    const sqlModalidade = (modalidadeBusca === "EQUIPE GESTORA")
      ? `(modalidade LIKE '%GESTORA%' OR modalidade = 'DOCENTE')`
      : `modalidade = '${modalidadeBusca}'`;

    condicoes.push(`(
      ${sqlModalidade}
      AND ano_formativo = '${ano}'
      AND (componente LIKE '%GESTORA%' OR componente = '${componenteParaFiltro}' OR modalidade = 'TÉCNICOS')
      ${filtroHoras}
    )`);
  });

  if (condicoes.length === 0) return [];

  const sql = `
    SELECT id_turma, nome_turma_matricula_busca AS nome_turma_matricula,
           dia_semana, horario_ini, cod_sere, vagas,
           componente, modalidade, ano_formativo, formador
    FROM \`${PROJECT_ID}.${DATASET_ID}.turmas_matriculas\`
    WHERE vagas > 0
      AND (${condicoes.join(" OR ")})
    ORDER BY vagas DESC
  `;

  const turmasBQ = runQuery(sql);

  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Data");
    if (sheet && sheet.getLastRow() > 0) {
      const contagem = {};
      sheet.getDataRange().getValues().forEach(row => {
        const nomeBusca = String(row[21] || "").trim().toUpperCase();
        if (!nomeBusca) return;
        const anoForm = String(row[18] || "").trim().toUpperCase();
        const status  = String(row[13] || "").toUpperCase();
        if (status !== "CANCELADO" && status !== "EXCLUIDO" && status !== "RECUSADO") {
          const key = `${nomeBusca}|${anoForm}`;
          contagem[key] = (contagem[key] || 0) + 1;
        }
      });

      return turmasBQ.filter(t => {
        const key = `${String(t.nome_turma_matricula || "").trim().toUpperCase()}|${String(t.ano_formativo || "").trim().toUpperCase()}`;
        const ocupadas   = contagem[key] || 0;
        const capacidade = parseInt(t.vagas) || 0;
        const disponiveis = capacidade - ocupadas;
        t.vagas = disponiveis;
        t.vagas_totais = capacidade;
        t.matriculados_realtime = ocupadas;
        return disponiveis > 0;
      });
    }
  } catch (err) {
    console.error("Erro vagas real-time:", err.message);
  }

  return turmasBQ;
}


/**
 * Grava a matrícula na planilha.
 */
function efetivarMatricula(professor, escolhas, acessibilidade) {
  try {
    if (!escolhas || escolhas.length === 0) throw new Error("Nenhuma turma selecionada.");

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Data");
    const agora = new Date();
    const email = Session.getActiveUser().getEmail();
    const protocolo = "EP" + Utilities.formatDate(agora, Session.getScriptTimeZone(), "yyyyMMddHHmmss");

    const idsTurmas = escolhas.map(e => e.turmaId);
    const sqlCheck = `SELECT id_turma, nome_turma_matricula_busca, vagas, ano_formativo FROM \`${PROJECT_ID}.${DATASET_ID}.turmas_matriculas\` WHERE id_turma IN ('${idsTurmas.join("','")}')`;
    const turmasBQ = runQuery(sqlCheck);

    const mapaCapacidade = {};
    turmasBQ.forEach(t => {
      const chave = `${String(t.nome_turma_matricula_busca || "").trim().toUpperCase()}|${String(t.ano_formativo || "").trim().toUpperCase()}`;
      mapaCapacidade[chave] = parseInt(t.vagas);
    });

    const dadosAll = sheet.getDataRange().getValues();
    const mapaOcupacao = {};
    dadosAll.forEach(r => {
      const nomeBusca = String(r[21] || "").trim().toUpperCase();
      const anoCount  = String(r[18] || "").trim().toUpperCase();
      const st = String(r[13] || "").toUpperCase();
      if (nomeBusca && st !== "CANCELADO" && st !== "EXCLUIDO" && st !== "RECUSADO") {
        const key = `${nomeBusca}|${anoCount}`;
        mapaOcupacao[key] = (mapaOcupacao[key] || 0) + 1;
      }
    });

    const cpfUsuario = String(professor.Cpf || "").replace(/\D/g, "");
    const matriculasUsuario = dadosAll.filter(r => {
      const rowEmail = String(r[3] || "").trim().toLowerCase();
      const rowCpf   = String(r[2] || "").replace(/\D/g, "");
      const st = String(r[13] || "").toUpperCase();
      return (rowEmail === email.toLowerCase() || rowCpf === cpfUsuario) && st !== "CANCELADO" && st !== "EXCLUIDO" && st !== "RECUSADO";
    });

    for (const esc of escolhas) {
      const chaveNome = String(esc.turmaNome || "").trim().toUpperCase();
      const chaveAno  = String(esc.anoFormativo || "").trim().toUpperCase();
      const chave     = `${chaveNome}|${chaveAno}`;

      const jaMatriculado = matriculasUsuario.some(r => String(r[21] || "").trim().toUpperCase() === chaveNome && String(r[18] || "").trim().toUpperCase() === chaveAno);
      if (jaMatriculado) throw new Error(`Você já possui uma solicitação ativa para "${esc.turmaNome}".`);

      const cap = mapaCapacidade[chave] || 0;
      const ocup = mapaOcupacao[chave] || 0;
      if (cap > 0 && ocup >= cap) throw new Error(`Turma "${chaveNome}" esgotada.`);
    }

    escolhas.forEach(esc => {
      sheet.appendRow([
        agora, professor.Nome, professor.Cpf, email,
        esc.vinculoOrigem, esc.modalidadeOrigem, esc.turmaId, esc.turmaNome,
        protocolo, professor.TelefoneCelular || "",
        acessibilidade.temNecessidade === "sim" ? "SIM" : "NÃO",
        acessibilidade.tipoDeficiencia || "",
        (acessibilidade.necessidades || []).join(", "),
        "PENDENTE", "PENDENTE",
        esc.diaSemana || "", esc.horarioIni || "", esc.turno || "",
        esc.anoFormativo || "", esc.componente || "",
        "", esc.turmaNome || ""
      ]);
    });

    return { sucesso: true, protocolo };
  } catch (e) {
    return { sucesso: false, erro: e.toString() };
  }
}


// ================================
// BIGQUERY
// ================================

function obterDadosUsuario(email) {
  const sql = `
    SELECT s.*, m.modalidade AS modalidade_calc, c.chamamento AS chamamento_calc, c.ano_formativo AS ano_formativo_db
    FROM \`${PROJECT_ID}.${DATASET_ID}.servidores_cursistas_2026\` AS s
    LEFT JOIN \`${PROJECT_ID}.${DATASET_ID}.analise_modalidades\` AS m
      ON s.GrupoExeDescricao = m.grupo_exe
      AND ((s.DiscNome IS NOT NULL AND s.DiscNome != 'NULL' AND s.DiscNome = m.disc_func) OR s.DiscFuncExeNome = m.disc_func)
    LEFT JOIN \`${PROJECT_ID}.${DATASET_ID}.analise_chamamentos\` AS c
      ON s.PeriodoIni BETWEEN c.data_inicio AND c.data_fim AND s.Vinculo = 'QPM'
    WHERE LOWER(s.EmailGoogleEducation) = LOWER('${email}')
  `;
  return runQuery(sql);
}

function runQuery(sql) {
  const request = { query: sql, useLegacySql: false };
  const queryResults = BigQuery.Jobs.query(request, PROJECT_ID);
  if (!queryResults.rows) return [];

  const normalizarValor = (campo, val) => {
    if (!val) return val;
    if (campo === "modalidade_calc" || campo === "modalidade") {
      const v = val.toString().trim().toUpperCase();
      if (v === "DOCENTES") return "DOCENTE";
      if (v === "TECNICOS") return "TÉCNICOS";
      if (v === "EQUIPE GESTORES") return "EQUIPE GESTORA";
    }
    return val;
  };

  return queryResults.rows.map(row => {
    const obj = {};
    queryResults.schema.fields.forEach((field, i) => {
      let val = row.f[i].v;
      if (field.name === "nome_turma_matricula" && val) val = removerAcentos(val);
      obj[field.name] = normalizarValor(field.name, val);
    });
    return obj;
  });
}


// ================================
// CLASSIFICAÇÃO DE VÍNCULOS
// ================================

function processarVinculos(dados) {
  if (!dados || dados.length === 0) return [];

  const norm = str => (str || "").toString().trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const resultados = dados.map(v => {
    const estab = norm(v.EstabExeNome);
    const func  = norm(v.DiscFuncExeNome);
    const disc  = norm(v.DiscNome);
    const grupo = norm(v.GrupoExeDescricao);

    if (estab.includes("NUCLEO REG EDUCACAO") || estab.includes("SEED") || grupo.includes("NRE") || grupo.includes("SEED") || disc.includes("ATUA NUCLEO") || func.includes("ATUA NUCLEO") || disc.includes("ATUA SEED") || func.includes("ATUA SEED")) {
      v.modalidade_calc = "TÉCNICOS";
    } else if (grupo === "LOTACAO NO MUNICIPIO" || ((grupo === "OUTROS" || grupo === "NULL" || grupo === "ESCOLA" || grupo === "CEEBJA") && (func.includes("DIRETOR") || func.includes("EQUIPE PEDAGOGICA") || disc.includes("PEDAGOGO") || disc.includes("ORIENTADOR")))) {
      v.modalidade_calc = "EQUIPE GESTORA";
    } else {
      v.modalidade_calc = "DOCENTE";
    }

    v.ano_formativo_db_raw = v.ano_formativo_db;
    v.ano_formativo_calc   = "2º/3º ANO";

    if (v.ano_formativo_db && (v.ano_formativo_db.includes("1") && v.ano_formativo_db.includes("ANO"))) {
        v.ano_formativo_calc = "1º ANO";
    } else if (v.ano_formativo_db) {
        v.ano_formativo_calc = "2º/3º ANO";
    } else if (v.PeriodoIni) {
      try {
        const dataStr = (typeof v.PeriodoIni === "object" && v.PeriodoIni.value) ? v.PeriodoIni.value : v.PeriodoIni;
        v.ano_formativo_calc = calcularAnoFormativoPorData(dataStr);
      } catch (err) {
        v.ano_formativo_calc = "2º/3º ANO";
      }
    }
    return v;
  });

  // [CORREÇÃO LIDIANE] Regra de Ouro: Se qualquer QPM for 1º Ano, tudo é 1º Ano
  const temIndicio1oAnoQPM = resultados.some(v => {
      const isQPM = (v.Vinculo || "").toString().toUpperCase().includes("QPM") || (v.GrupoExeDescricao || "").toString().toUpperCase().includes("QPM");
      return isQPM && v.ano_formativo_calc === "1º ANO";
  });
  
  const temQualquerQPM = resultados.some(v => (v.Vinculo || "").toString().toUpperCase().includes("QPM") || (v.GrupoExeDescricao || "").toString().toUpperCase().includes("QPM"));
  
  if (temQualquerQPM) {
    const anoFinal = temIndicio1oAnoQPM ? "1º ANO" : "2º/3º ANO";
    resultados.forEach(v => { v.ano_formativo_calc = anoFinal; });
  }

  const vinculoQPM = resultados.find(v => (v.Vinculo === "QPM" || (v.GrupoExeDescricao || "").toString().toUpperCase().includes("QPM")) && v.DiscNome && v.DiscNome !== "NULL");
  if (vinculoQPM) {
    const discMestre = vinculoQPM.DiscNome;
    resultados.forEach(v => {
      if (!v.DiscNome || v.DiscNome === "NULL") v.DiscNome = discMestre;
    });
  }

  if (resultados.some(v => v.modalidade_calc === "TÉCNICOS")) {
    resultados.forEach(v => { 
        v.modalidade_calc = "TÉCNICOS"; 
        // Técnicos podem seguir o ano do QPM ingressante se for o caso
    });
  }

  resultados.forEach(v => {
    v.componente_matriz = mapearComponenteParaTurma(v.DiscNome, v.modalidade_calc, v.DiscFuncExeNome);
  });

  return resultados;
}

function mapearComponenteParaTurma(discNome, modalidade, discFuncExeNome) {
  if (modalidade === "EQUIPE GESTORA") return "EQ GESTORA";
  const discEfetivo = (!discNome || discNome.toString().trim().toUpperCase() === "NULL") ? (discFuncExeNome || "") : discNome;
  if (!discEfetivo) return "";

  const n = discEfetivo.toString().trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
  return discEfetivo;
}

function calcularLimiteMatriculas(dados) {
  if (!dados || dados.length === 0) return 1;
  const vinculosQPM = dados.filter(v => v.Vinculo === "QPM" || (v.GrupoExeDescricao || "").toString().toUpperCase().includes("QPM"));
  if (vinculosQPM.length === 0) return 1;
  const unicos = new Set();
  vinculosQPM.forEach(v => {
    let chave = "";
    if (v.modalidade_calc === "EQUIPE GESTORA") chave = "EQ_GESTORA";
    else if (v.modalidade_calc === "TÉCNICOS") chave = "TECNICOS";
    else chave = mapearComponenteParaTurma(v.DiscNome, "DOCENTE", v.DiscFuncExeNome);
    if (chave) unicos.add(chave);
  });
  return unicos.size > 0 ? unicos.size : 1;
}

function calcularAnoFormativoPorData(dataStr) {
  if (!dataStr) return "2º/3º ANO";
  let data = new Date(dataStr);
  if (isNaN(data.getTime())) {
    const parts = dataStr.split("/");
    if (parts.length === 3) data = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  }
  if (isNaN(data.getTime())) return "2º/3º ANO";
  const time = data.getTime();
  const ranges = [
    { i: "2024-01-15", f: "2024-04-30", ano: "2º/3º ANO" },
    { i: "2024-05-01", f: "2024-12-31", ano: "2º/3º ANO" },
    { i: "2025-01-01", f: "2025-05-10", ano: "2º/3º ANO" },
    { i: "2025-05-11", f: "2025-12-31", ano: "1º ANO"    },
    { i: "2026-01-01", f: "2026-05-31", ano: "1º ANO"    },
    { i: "2026-06-01", f: "2026-12-31", ano: "1º ANO"    }
  ];
  for (const r of ranges) {
    if (time >= new Date(r.i).getTime() && time <= new Date(r.f).getTime()) return r.ano;
  }
  return time < new Date("2024-01-15").getTime() ? "2º/3º ANO" : "1º ANO";
}

function removerAcentos(texto) {
  if (!texto) return "";
  return texto.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

function normalizarTurnoExibicao(turno) {
  if (!turno) return "";
  const t = turno.toString().toUpperCase().trim();
  if (t.includes("MANH") || t.includes("MATUTINO")) return "Manhã";
  if (t.includes("TARDE") || t.includes("VESPERTINO")) return "Tarde";
  if (t.includes("NOIT") || t.includes("NOTURNO")) return "Noite";
  return turno;
}