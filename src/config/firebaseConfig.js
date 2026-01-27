import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// SUBSTITUA PELAS SUAS CHAVES DO CONSOLE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyAeWSOo7HLRrM9FN0G6kzcfk4wT-rfA_6I",
  authDomain: "deolhonavalidad.firebaseapp.com",
  projectId: "deolhonavalidad",
  storageBucket: "deolhonavalidad.firebasestorage.app",
  messagingSenderId: "328498415489",
  appId: "1:328498415489:web:c3fab4b13f22b03cbd4a80"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta o Banco de Dados para usarmos no app
export const dbFirestore = getFirestore(app);