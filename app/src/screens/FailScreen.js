import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createStyles, theme } from '../theme/theme';

export default function FailScreen({ route, navigation }) {
  const { mission, reason } = route.params;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>MISIÓN FALLIDA</Text>
      <Text style={styles.mission}>{mission.title}</Text>

      <Text style={styles.reasonBox}>{reason}</Text>

      <Text style={styles.handler}>{'> Handler: "Te quiero fuera de ahí, agente. Inténtalo otra vez."'}</Text>

      <TouchableOpacity style={styles.buttonRed} onPress={() => navigation.replace('Level', { mission })}>
        <Text style={styles.buttonRedText}>REINTENTAR MISIÓN</Text>
      </TouchableOpacity>
      <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Missions' }] })}
        >
        <Text style={styles.buttonText}>ABORTAR Y VOLVER</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = createStyles({
  container: { flex: 1, backgroundColor: theme.bg, padding: 24, justifyContent: 'center' },
  title: { color: theme.danger, fontFamily: theme.font, fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  mission: { color: theme.dim, fontFamily: theme.font, textAlign: 'center', marginTop: 8 },
  reasonBox: {
    color: '#000',
    backgroundColor: theme.danger,
    fontFamily: theme.font,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 16,
    marginVertical: 28,
  },
  handler: { color: theme.primary, fontFamily: theme.font, fontSize: 13, marginBottom: 28 },
  buttonRed: { borderWidth: 1, borderColor: theme.danger, padding: 14, alignItems: 'center' },
  buttonRedText: { color: theme.danger, fontFamily: theme.font, fontWeight: 'bold' },
  button: { borderWidth: 1, borderColor: theme.primary, padding: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: theme.primary, fontFamily: theme.font, fontWeight: 'bold' },
});