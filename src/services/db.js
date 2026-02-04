import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system'; // Importação normal para mover arquivos

let db;

export const initDB = async () => {
  try {
    db = await SQLite.openDatabaseAsync('validade.db');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        data_validade TEXT,
        ean TEXT,
        foto_uri TEXT,
        quantidade INTEGER,
        arquivado INTEGER DEFAULT 0
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dias_aviso INTEGER,
        hora_aviso TEXT DEFAULT '08:00'
      );
    `);

    // Migrações
    try { await db.execAsync('ALTER TABLE produtos ADD COLUMN ean TEXT'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE produtos ADD COLUMN foto_uri TEXT'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE produtos ADD COLUMN quantidade INTEGER DEFAULT 1'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE produtos ADD COLUMN arquivado INTEGER DEFAULT 0'); } catch (e) {}
    try { await db.execAsync("ALTER TABLE configuracoes ADD COLUMN hora_aviso TEXT DEFAULT '08:00'"); } catch (e) {}

    const config = await db.getAllAsync('SELECT * FROM configuracoes');
    if (config.length === 0) {
      await db.runAsync("INSERT INTO configuracoes (dias_aviso, hora_aviso) VALUES (5, '08:00')");
    }
    console.log("DB Pronto");
  } catch (e) { console.log("Erro DB:", e); }
};

// --- FUNÇÃO PARA SALVAR FOTO PERMANENTE ---
export const moverFotoParaPastaDefinitiva = async (uriTemporaria) => {
  if (!uriTemporaria) return null;
  try {
    const nomeArquivo = uriTemporaria.split('/').pop();
    const novoCaminho = FileSystem.documentDirectory + nomeArquivo;
    await FileSystem.moveAsync({
      from: uriTemporaria,
      to: novoCaminho
    });
    return novoCaminho;
  } catch (e) {
    console.log("Erro ao mover foto:", e);
    return uriTemporaria; // Retorna a original se der erro
  }
};

// --- CRUD PRODUTOS ---
export const salvarProduto = async (produto) => {
  try {
    const { nome, data_validade, ean, foto_uri, quantidade } = produto;
    
    // Move a foto para pasta segura antes de salvar no banco
    const fotoSegura = await moverFotoParaPastaDefinitiva(foto_uri);

    const result = await db.runAsync(
      'INSERT INTO produtos (nome, data_validade, ean, foto_uri, quantidade, arquivado) VALUES (?, ?, ?, ?, ?, 0)', 
      [nome, data_validade, ean, fotoSegura, quantidade]
    );
    return result.lastInsertRowId;
  } catch (e) { console.error(e); return null; }
};

export const atualizarProduto = async (produto) => {
  try {
    const { id, nome, data_validade, ean, foto_uri, quantidade } = produto;
    
    // Se a foto mudou (ainda está no cache), move ela. Se já é file://...document, ignora
    let fotoFinal = foto_uri;
    if (foto_uri && foto_uri.includes('Cache')) {
        fotoFinal = await moverFotoParaPastaDefinitiva(foto_uri);
    }

    await db.runAsync(
      'UPDATE produtos SET nome = ?, data_validade = ?, ean = ?, foto_uri = ?, quantidade = ? WHERE id = ?', 
      [nome, data_validade, ean, fotoFinal, quantidade, id]
    );
  } catch (e) { console.error(e); }
};

export const buscarProdutos = async () => {
  try {
    return await db.getAllAsync('SELECT * FROM produtos WHERE arquivado = 0 ORDER BY id DESC');
  } catch (e) { return []; }
};

// Nova função para ver o "Lixo" (Arquivados)
export const buscarProdutosArquivados = async () => {
  try {
    return await db.getAllAsync('SELECT * FROM produtos WHERE arquivado = 1 ORDER BY id DESC');
  } catch (e) { return []; }
};

export const buscarProdutoPorEAN = async (ean) => {
  try {
    const resultado = await db.getAllAsync('SELECT * FROM produtos WHERE ean = ? ORDER BY id DESC LIMIT 1', [ean]);
    return resultado.length > 0 ? resultado[0] : null;
  } catch (e) { return null; }
};

export const excluirProduto = async (id) => {
  try {
    await db.runAsync('DELETE FROM produtos WHERE id = ?', [id]);
  } catch (e) { console.error(e); }
};

// Restaura um produto arquivado para a lista principal
export const restaurarProdutoArquivado = async (id) => {
  try {
    await db.runAsync('UPDATE produtos SET arquivado = 0 WHERE id = ?', [id]);
  } catch (e) { console.error(e); }
};

export const arquivarProdutos = async (ids) => {
  try {
    const idsString = ids.join(',');
    await db.runAsync(`UPDATE produtos SET arquivado = 1 WHERE id IN (${idsString})`);
  } catch (e) { console.error("Erro ao arquivar:", e); }
};

export const limparVencidosAntigos = async () => {
  try {
    const produtos = await db.getAllAsync('SELECT id, data_validade FROM produtos');
    const hoje = new Date();
    hoje.setHours(0,0,0,0); 

    for (let p of produtos) {
      if (!p.data_validade) continue;
      const [dia, mes, ano] = p.data_validade.split('/').map(Number);
      const dataValidade = new Date(ano, mes - 1, dia);
      const diffTime = hoje - dataValidade;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 5) {
        await db.runAsync('DELETE FROM produtos WHERE id = ?', [p.id]);
      }
    }
  } catch (e) { console.error("Erro na faxina:", e); }
};

// --- CONFIGURAÇÕES ---
export const salvarConfiguracao = async (dias, hora) => {
  try {
    // Atualiza dias e hora
    await db.runAsync('UPDATE configuracoes SET dias_aviso = ?, hora_aviso = ? WHERE id = 1', [dias, hora]);
    const check = await db.getAllAsync('SELECT * FROM configuracoes');
    if (check.length === 0) {
      await db.runAsync('INSERT INTO configuracoes (dias_aviso, hora_aviso) VALUES (?, ?)', [dias, hora]);
    }
  } catch (e) { console.error(e); }
};

export const buscarConfiguracao = async () => {
  try {
    const result = await db.getAllAsync('SELECT dias_aviso, hora_aviso FROM configuracoes LIMIT 1');
    if (result.length > 0) {
        return { dias: result[0].dias_aviso.toString(), hora: result[0].hora_aviso || '08:00' };
    }
    return { dias: '5', hora: '08:00' };
  } catch (e) { return { dias: '5', hora: '08:00' }; }
};

// --- BACKUP ---
export const pegarDadosCompletos = async () => {
  try {
    const produtos = await db.getAllAsync('SELECT * FROM produtos');
    const config = await db.getAllAsync('SELECT * FROM configuracoes');
    return { produtos, configuracoes: config };
  } catch (e) { return null; }
};

export const importarDadosJSON = async (jsonDados) => {
  try {
    await db.execAsync('DELETE FROM produtos');
    await db.execAsync('DELETE FROM configuracoes');
    
    if (jsonDados.configuracoes && jsonDados.configuracoes.length > 0) {
      const conf = jsonDados.configuracoes[0];
      await db.runAsync('INSERT INTO configuracoes (dias_aviso, hora_aviso) VALUES (?, ?)', [conf.dias_aviso, conf.hora_aviso || '08:00']);
    } else {
      await db.runAsync("INSERT INTO configuracoes (dias_aviso, hora_aviso) VALUES (5, '08:00')");
    }

    if (jsonDados.produtos && jsonDados.produtos.length > 0) {
      for (let p of jsonDados.produtos) {
        await db.runAsync(
          'INSERT INTO produtos (nome, data_validade, ean, foto_uri, quantidade, arquivado) VALUES (?, ?, ?, ?, ?, ?)',
          [p.nome, p.data_validade, p.ean, p.foto_uri, p.quantidade, p.arquivado || 0]
        );
      }
    }
    return true;
  } catch (e) { return false; }
};