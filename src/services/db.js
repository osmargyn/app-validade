import * as SQLite from 'expo-sqlite';

let db;

export const initDB = async () => {
  try {
    db = await SQLite.openDatabaseAsync('validade.db');
    
    // --- RESET DE SEGURANÇA (Apaga tudo para garantir que o app abra) ---
    await db.execAsync('DROP TABLE IF EXISTS produtos');
    // -------------------------------------------------------------------

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        data_validade TEXT
      );
    `);
    console.log("Banco de dados reiniciado com sucesso!");
  } catch (e) {
    console.log("Erro DB:", e);
  }
};

export const salvarProduto = async (nome, validade) => {
  try {
    await db.runAsync('INSERT INTO produtos (nome, data_validade) VALUES (?, ?)', [nome, validade]);
  } catch (e) { console.error(e); }
};

export const buscarProdutos = async () => {
  try {
    return await db.getAllAsync('SELECT * FROM produtos ORDER BY id DESC');
  } catch (e) { return []; }
};

export const excluirProduto = async (id) => {
  try {
    await db.runAsync('DELETE FROM produtos WHERE id = ?', [id]);
  } catch (e) { console.error(e); }
};
