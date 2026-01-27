import * as Notifications from 'expo-notifications';
import { calcularDataNotificacao } from '../utils/dateHelper';

// Configuração Global
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function agendarNotificacao(nomeProduto, dataValidadeString) {
  const { status } = await Notifications.requestPermissionsAsync();
  
  if (status !== 'granted') {
    return null;
  }

  // Calcula a data (3 dias antes, às 09:00)
  const gatilhoData = calcularDataNotificacao(dataValidadeString, 3, 9);

  if (!gatilhoData) {
    return null;
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏳ Atenção à Validade!",
        body: `O produto '${nomeProduto}' vence em 3 dias (${dataValidadeString}).`,
        sound: true,
      },
      // --- CORREÇÃO AQUI ---
      // Na versão nova, passamos a DATA DIRETA, sem chaves {} ao redor
      trigger: gatilhoData, 
    });

    console.log(`Notificação agendada para: ${gatilhoData}`);
    return id;

  } catch (error) {
    console.error("Erro ao agendar notificação:", error);
    return null;
  }
}

export async function cancelarNotificacao(notificationId) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.log("Erro ao cancelar", error);
  }
}