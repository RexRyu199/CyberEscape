import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Expo Go en Android no soporta expo-notifications: ni siquiera se puede importar
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const SUPPORTED = !(Platform.OS === 'android' && IS_EXPO_GO);

let Notifications = null;
if (SUPPORTED) {
  try {
    Notifications = require('expo-notifications');
  } catch (e) {
    console.warn('Notificaciones no disponibles en este entorno');
  }
}

if (Notifications) {
  // Muestra las notificaciones aunque la app esté abierta
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Pistas por misión (cortas para que quepan en el banner)
export const HINTS = {
  m1: 'Inclina el teléfono con calma, agente.',
  m2: 'Lo que está boca abajo no se ve. Escóndete.',
  m3: 'Usa tu huella para autorizar, agente.',
  m4: 'Gira despacio. La señal crece al apuntar bien.',
  m5: 'Inclina con suavidad. Mantén el punto al centro.',
  m6: 'Son tres fases, una tras otra. Calma.',
};

// Avisos de historia al completar misión (la historia completa se lee en pantalla)
export const NARRATIVE = {
  m1: 'Estás dentro, agente. Cuidado con los guardias.',
  m2: 'Sospechan de ti. Necesito tu huella.',
  m3: 'Tu nombre está en la lista... ¿quién te vendió?',
  m4: 'Enlace listo. CIFRA quiere hablar contigo.',
  m5: 'Pruebas subidas. Es peor de lo que pensábamos.',
  m6: 'Borrado completado... o eso crees, agente.',
};

export async function requestNotificationPermission() {
  if (!Notifications) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Programa un mensaje del handler que llega dentro de "seconds" segundos
export async function scheduleHandlerMessage({ title = 'HANDLER', body, seconds }) {
  if (!Notifications) return null;
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
    },
  });
}

export async function cancelNotification(id) {
  if (!Notifications || !id) return;
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAllNotifications() {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}