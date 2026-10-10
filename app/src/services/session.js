import AsyncStorage from '@react-native-async-storage/async-storage';
import { cancelAllNotifications } from './notifications';
import { signOut } from './firebase';
import { applyTheme } from '../theme/theme';
import { useGameStore } from '../store/useGameStore';

// Deja la app como recién instalada: tema Matrix, sin notificaciones y sin sesión
export async function resetDemo() {
  await cancelAllNotifications().catch(() => {});
  await AsyncStorage.removeItem('cyberescape_theme');
  applyTheme('matrix');
  useGameStore.getState().setThemeId('matrix');
  await signOut();
}