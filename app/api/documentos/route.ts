import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

export async function GET() {
  try {
    const q = query(collection(db, "documentos"), orderBy("createdAt", "desc"), limit(10));
    const snapshot = await getDocs(q);
    const documentos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return Response.json(documentos);
  } catch (error) {
    console.error("Erro ao buscar documentos:", error);
    return Response.json([], { status: 500 });
  }
}
