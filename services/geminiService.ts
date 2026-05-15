import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const SYSTEM_PROMPT = `
Você é o "Assistente Clovis", o assistente virtual do Portal de Matrículas Formativas da Secretaria da Educação do Paraná.
Seu objetivo é ajudar professores (cursistas) com dúvidas sobre:
1. Estágio Probatório (EP): Somente servidores QPM. Regras de 1º ano vs 2º/3º ano.
2. PEDFOR: Aberto a QPM, PSS, SC02 e S100. Limite de uma vaga por escola.
3. Remanejamento: O cursista solicita pelo portal, o técnico analisa e o sistema atualiza após aprovação.
4. Documentos: Estão na seção "Documentos Oficiais".

Instruções:
- Seja cordial, profissional e institucional.
- Se não souber algo específico, oriente a procurar a CFDEG pelo e-mail institucional.
- Use um tom prestativo.
- Mantenha as respostas curtas e objetivas.
`;

export const getGeminiResponse = async (userMessage: string, history: { role: string, parts: { text: string }[] }[]) => {
  if (!API_KEY) return "O serviço de IA está temporariamente indisponível (chave ausente).";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Entendido. Sou o Assistente Clovis e estou pronto para ajudar com as matrículas." }] },
        ...history
      ],
    });

    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  } catch (error: any) {
    console.error("Erro no Gemini:", error);
    return "Desculpe, tive um problema ao processar sua dúvida. Tente novamente em instantes.";
  }
};
