import { doc, getDoc, setDoc } from "firebase/firestore";
import { dbFirestore } from "../config/firebaseConfig";

/**
 * Busca no Firebase se alguém já cadastrou este EAN.
 */
export const buscarProdutoGlobal = async (ean) => {
  if (!ean) return null;

  try {
    const docRef = doc(dbFirestore, "produtos_globais", ean);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("Achamos na nuvem!");
      return docSnap.data(); // Retorna { nome: "Leite X", categoria: "Laticínios" }
    } else {
      console.log("Não existe na nuvem ainda.");
      return null;
    }
  } catch (error) {
    console.error("Erro ao buscar na nuvem:", error);
    return null;
  }
};

/**
 * Salva o nome do produto na nuvem para ajudar outros usuários.
 * Nota: Não salvamos a validade aqui, pois validade é de cada um.
 */
export const salvarProdutoGlobal = async (ean, nome) => {
  if (!ean || !nome) return;

  try {
    // Salva na coleção 'produtos_globais' usando o EAN como ID do documento
    await setDoc(doc(dbFirestore, "produtos_globais", ean), {
      ean: ean,
      nome: nome,
      ultima_atualizacao: new Date().toISOString()
    });
    console.log("Contribuímos com a nuvem!");
  } catch (error) {
    console.error("Erro ao salvar na nuvem:", error);
  }
};