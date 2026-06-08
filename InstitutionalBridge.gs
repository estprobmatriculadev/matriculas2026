/**
 * Google Apps Script - Ponte Institucional de Matrículas
 * Este script deve ser publicado como "Web App" com acesso "Anyone" (ou restrito ao domínio).
 */

const FOLDER_ID = "1xCYLKGD8BnIuwU851MQhPI48dUOYWb-7"; // Pasta: Comprovantes 2026

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    switch (action) {
      case "GERAR_COMPROVANTE":
        return ContentService.createTextOutput(JSON.stringify(gerarComprovante(data.payload)))
          .setMimeType(ContentService.MimeType.JSON);
      
      case "NOTIFICAR_TECNICO":
        return ContentService.createTextOutput(JSON.stringify(notificarTecnico(data.payload)))
          .setMimeType(ContentService.MimeType.JSON);

      case "SALVAR_ANEXO":
        return ContentService.createTextOutput(JSON.stringify(salvarAnexo(data.payload)))
          .setMimeType(ContentService.MimeType.JSON);

      case "SALVAR_MATRICULA":
        return ContentService.createTextOutput(JSON.stringify(salvarMatricula(data.payload)))
          .setMimeType(ContentService.MimeType.JSON);

      default:
        return ContentService.createTextOutput(JSON.stringify({ error: "Ação não reconhecida" }))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function salvarAnexo(payload) {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const contentType = payload.mimeType || "application/pdf";
    const blob = Utilities.newBlob(Utilities.base64Decode(payload.base64), contentType, payload.fileName);
    const file = folder.createFile(blob);
    
    return { success: true, url: file.getUrl(), id: file.getId() };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function gerarComprovante(payload) {
  // 1. Criar o documento temporário
  const doc = DocumentApp.create(`Comprovante_${payload.cursistaEmail}_${Date.now()}`);
  const body = doc.getBody();
  
  // 2. Estilizar o cabeçalho institucional
  body.appendParagraph("GOVERNO DO ESTADO DO PARANÁ").setHeading(DocumentApp.ParagraphHeading.HEADING1).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  body.appendParagraph("SECRETARIA DA EDUCAÇÃO - CFDEG").setHeading(DocumentApp.ParagraphHeading.HEADING2).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  body.appendHorizontalRule();
  
  // 3. Inserir dados da matrícula
  body.appendParagraph("\nCOMPROVANTE DE MATRÍCULA - 2026").setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  body.appendParagraph(`\nCursista: ${payload.cursistaNome}`);
  body.appendParagraph(`E-mail: ${payload.cursistaEmail}`);
  body.appendParagraph(`Programa: ${payload.programa}`);
  body.appendParagraph(`Turma: ${payload.turmaNome}`);
  body.appendParagraph(`Dia/Horário: ${payload.diaSemana} - ${payload.horarioIni}`);
  body.appendParagraph(`Data da Matrícula: ${new Date().toLocaleString()}`);
  
  body.appendParagraph("\n\nEste documento é um comprovante digital gerado pelo Sistema Integrado de Matrículas.").setFontSize(8).setItalic(true);
  
  doc.saveAndClose();
  
  // 4. Converter para PDF e salvar na pasta correta
  const pdfBlob = doc.getAs(MimeType.PDF);
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const file = folder.createFile(pdfBlob);
  
  // 5. Limpar arquivo temporário
  DriveApp.getFileById(doc.getId()).setTrashed(true);
  
  // 6. Enviar e-mail de confirmação
  GmailApp.sendEmail(payload.cursistaEmail, "Confirmação de Matrícula - 2026", 
    `Olá ${payload.cursistaNome},\n\nSua matrícula no programa ${payload.programa} foi realizada com sucesso.\n\nSua turma: ${payload.turmaNome}\n\nO comprovante oficial está disponível no link: ${file.getUrl()}`);

  return { success: true, fileUrl: file.getUrl(), fileId: file.getId() };
}

function notificarTecnico(payload) {
  const tecnicoEmail = "tecnico.matriculas@escola.pr.gov.br"; // E-mail do setor técnico
  GmailApp.sendEmail(tecnicoEmail, "Nova Solicitação de Remanejamento", 
    `Uma nova solicitação de remanejamento foi aberta.\n\nCursista: ${payload.cursistaNome}\nTurma Atual: ${payload.turmaOrigem}\nTurma Pretendida: ${payload.turmaDestino}\n\nAcesse o painel para analisar.`);
  
  return { success: true };
}

function salvarMatricula(payload) {
  try {
    const ss = SpreadsheetApp.openById("1pGYz2rIOllQhIETd2DUU8RZ4cV4ZO5lt8GlUDGphMSw");
    const sheet = ss.getSheetByName("Data");
    const agora = new Date();
    
    sheet.appendRow([
      agora,
      payload.cursistaNome || "",
      payload.cursistaCpf || "",
      payload.cursistaEmail || "",
      payload.vinculoOrigem || "",
      payload.modalidadeOrigem || "",
      payload.turmaId || "",
      payload.turmaNome || "",
      payload.protocolo || "",
      payload.cursistaTelefone || "",
      payload.temNecessidade || "NÃO",
      payload.tipoDeficiencia || "",
      payload.necessidades || "",
      "CONFIRMADA", // Status 1 / Matrícula
      "CONFIRMADA", // Status 2
      payload.diaSemana || "",
      payload.horarioIni || "",
      payload.turno || "",
      payload.anoFormativo || "",
      payload.componente || "",
      "", // Col 20
      payload.turmaNome || "" // Col 21
    ]);
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}
