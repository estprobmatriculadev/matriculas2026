import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `
Você é o "Assistente Clovis", o assistente virtual do Portal de Matrículas Formativas da Secretaria da Educação do Paraná.
Seu objetivo é ajudar professores (cursistas) com dúvidas sobre:
1. Estágio Probatório (EP): Somente servidores QPM. Regras de 1º ano vs 2º/3º ano.
2. PEDFOR: Aberto a QPM, PSS, SC02 e S100. Limite de uma vaga por escola.
3. Remanejamento: O cursista solicita pelo portal, o técnico analisa e o sistema atualiza após aprovação.
4. Documentos: Estão na seção "Biblioteca Digital".

Instruções:
- Seja cordial, profissional e institucional.
- Se não souber algo específico, oriente a procurar a CFDEG pelo e-mail institucional est.probmatricula@escola.pr.gov.br.
- Use um tom prestativo.
- Mantenha as respostas curtas e objetivas.
`;

export const getGeminiResponse = async (userMessage: string, history: { role: string, parts: { text: string }[] }[]) => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    return "ERRO: A chave NEXT_PUBLIC_GEMINI_API_KEY não foi encontrada nas variáveis de ambiente da Vercel. Por favor, adicione a chave e faça um REDEPLOY do projeto.";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Entendido. Sou o Assistente Clovis e estou pronto para ajudar com as matrículas CFDEG." }] },
        ...history
      ],
    });

    const result = await chat.sendMessage(userMessage);
    const text = result.response.text();
    return text || "O assistente não conseguiu gerar uma resposta. Tente reformular a pergunta.";
  } catch (error: any) {
    console.error("Erro no Gemini:", error);
    return `ERRO TÉCNICO: ${error.message || "Erro desconhecido ao acessar o Google AI"}. Verifique se a chave é válida e se há cota disponível no Google AI Studio.`;
  }
};
