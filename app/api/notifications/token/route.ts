import { db } from "@/lib/firebase";
import { doc, setDoc, arrayUnion } from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const { userId, token } = await request.json();

    if (!userId || !token) {
      return new Response(
        JSON.stringify({ error: "userId e token são obrigatórios" }),
        { status: 400 }
      );
    }

    // Salvar token no Firestore
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      {
        notification_tokens: arrayUnion(token),
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return new Response(
      JSON.stringify({ message: "Token salvo com sucesso" }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro ao salvar token:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao salvar token" }),
      { status: 500 }
    );
  }
}
