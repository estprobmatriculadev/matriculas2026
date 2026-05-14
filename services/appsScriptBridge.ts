/**
 * Serviço de comunicação com o Google Apps Script (Middleware)
 */

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "";

export const triggerGerarComprovante = async (payload: {
  cursistaNome: string;
  cursistaEmail: string;
  programa: string;
  turmaNome: string;
  diaSemana: string;
  horarioIni: string;
}) => {
  if (!APPS_SCRIPT_URL) {
    console.warn("URL do Apps Script não configurada.");
    return { success: false, error: "Integração desativada" };
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", // Apps Script exige no-cors para redirecionamentos
      body: JSON.stringify({
        action: "GERAR_COMPROVANTE",
        payload
      })
    });

    // Como usamos no-cors, o fetch não retorna o corpo da resposta por segurança.
    // Em produção, o Apps Script processará o PDF e enviará o e-mail em background.
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao chamar Apps Script:", error);
    return { success: false, error: error.message };
  }
};

export const triggerNotificarTecnico = async (payload: {
  cursistaNome: string;
  turmaOrigem: string;
  turmaDestino: string;
}) => {
  if (!APPS_SCRIPT_URL) return;

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify({
        action: "NOTIFICAR_TECNICO",
        payload
      })
    });
  } catch (err) {
    console.error(err);
  }
};
