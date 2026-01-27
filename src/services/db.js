import * as SQLite from 'expo-sqlite';

let db;

const getDB = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('produtos.db');
  }
  return db;
};

export const initDB = async () => {
  const database = await getDB();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ean TEXT,
      nome TEXT NOT NULL,
      descricao TEXT,
      quantidade INTEGER,
      data_validade TEXT NOT NULL,
      foto_uri TEXT,
      notificacao_id TEXT
    );
  `);
};

export const salvarProduto = async (produto) => {
  const database = await getDB();
  const result = await database.runAsync(
    `INSERT INTO produtos (ean, nome, descricao, quantidade, data_validade, foto_uri, notificacao_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [produto.ean, produto.nome, produto.descricao, produto.quantidade, produto.dataValidade, produto.fotoUri, produto.notificacaoId]
  );
  return result;
};

// --- NOVA FUNÇÃO DE EDITAR ---
export const atualizarProduto = async (id, produto) => {
  const database = await getDB();
  const result = await database.runAsync(
    `UPDATE produtos SET ean = ?, nome = ?, data_validade = ?, foto_uri = ?, notificacao_id = ? WHERE id = ?`,
    [produto.ean, produto.nome, produto.dataValidade, produto.fotoUri, produto.notificacaoId, id]
  );
  return result;
};

export const buscarProdutos = async () => {
  const database = await getDB();
  const lista = await database.getAllAsync('SELECT * FROM produtos');
  lista.sort((a, b) => {
    const dataA = converterParaData(a.data_validade);
    const dataB = converterParaData(b.data_validade);
    return dataA - dataB;
  });
  return lista;
};

export const buscarFotoPorEan = async (ean) => {
  if (!ean) return null;
  const database = await getDB();
  const result = await database.getFirstAsync(
    'SELECT foto_uri, nome FROM produtos WHERE ean = ? AND foto_uri IS NOT NULL ORDER BY id DESC LIMIT 1',
    [ean]
  );
  return result;
};

export const excluirProduto = async (id) => {
  const database = await getDB();
  const result = await database.runAsync('DELETE FROM produtos WHERE id = ?', [id]);
  return result;
};

const converterParaData = (dataStr) => {
  if (!dataStr) return new Date(8640000000000000); 
  const [dia, mes, ano] = dataStr.split('/');
  return new Date(ano, mes - 1, dia);
};