/**
 * Utilitário para cálculos de data e notificações.
 */

/**
 * Converte string DD/MM/AAAA para Objeto Date e calcula a data do aviso.
 * * @param {string} dataString - A data de validade (Ex: "25/12/2026")
 * @param {number} diasAntes - Quantos dias antes do vencimento avisar (Padrão: 3)
 * @param {number} horaAlerta - Hora do dia para tocar o alarme (0-23). Padrão: 9 (09:00 AM)
 * @returns {Date|null} - Retorna o objeto Date pronto para o agendamento ou null se inválido/passado.
 */
export const calcularDataNotificacao = (dataString, diasAntes = 3, horaAlerta = 9) => {
  try {
    // 1. Validar se o formato tem as barras
    if (!dataString || !dataString.includes('/')) return null;

    const partes = dataString.split('/');
    if (partes.length !== 3) return null;

    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1; // Mês em JS começa em 0 (Janeiro = 0, Dezembro = 11)
    const ano = parseInt(partes[2], 10);

    // Validação básica de números
    if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return null;

    // 2. Criar a data do vencimento (Meio-dia para evitar problemas de fuso horário)
    const dataVencimento = new Date(ano, mes, dia, 12, 0, 0);

    // 3. Clonar a data e subtrair os dias
    const dataAlerta = new Date(dataVencimento);
    dataAlerta.setDate(dataVencimento.getDate() - diasAntes);

    // 4. Definir a hora exata da notificação (Ex: 09:00:00 da manhã)
    dataAlerta.setHours(horaAlerta, 0, 0, 0);

    // 5. Verificação de segurança:
    // Se a data calculada para o aviso já passou (ex: hoje é dia 20, validade é dia 21, aviso seria dia 18),
    // retornamos null para não tentar agendar no passado (o que daria erro ou dispararia imediatamente).
    if (dataAlerta.getTime() < Date.now()) {
      // Opcional: Se quiser que avise "agora mesmo" caso já tenha passado do prazo de aviso mas ainda não venceu,
      // você poderia retornar new Date(Date.now() + 5000) aqui.
      // Por enquanto, vamos apenas ignorar para manter simples.
      console.log("A data calculada para o aviso já ficou no passado.");
      return null; 
    }

    return dataAlerta;

  } catch (error) {
    console.error("Erro ao calcular data:", error);
    return null;
  }
};