import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Level1Lockpick from '../levels/Level1Lockpick';
import Level2Stealth from '../levels/Level2Stealth';
import Level3Biometric from '../levels/Level3Biometric';
import Level4Signal from '../levels/Level4Signal';
import Level5Balance from '../levels/Level5Balance';
import Level6Finale from '../levels/Level6Finale';
import { getPlayerProfile } from '../services/firebase';
import {
  cancelNotification,
  HINTS,
  NARRATIVE,
  requestNotificationPermission,
  scheduleHandlerMessage,
} from '../services/notifications';
import { consumeCharge } from '../services/store';
import { useGameStore } from '../store/useGameStore';
import { createStyles } from '../theme/theme';

const HINT_SECONDS = 60;       // pista por inactividad
const BACKGROUND_SECONDS = 15; // pista si minimizas la app durante el nivel
const NARRATIVE_SECONDS = 1;   // aviso de historia tras completar

export default function LevelScreen({ route, navigation }) {
  const { mission } = route.params;
  const { user, profile, setProfile } = useGameStore();
  const startRef = useRef(Date.now());
  const [seconds, setSeconds] = useState(0);
  const hintId = useRef(null);
  const bgId = useRef(null);

  const charges = profile?.decryptCharges ?? 0;

  // Cronómetro
  useEffect(() => {
    const id = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startRef.current) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, []);

  // Pista por inactividad
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await requestNotificationPermission();
      if (!ok || cancelled) return;
      const id = await scheduleHandlerMessage({ body: HINTS[mission.id], seconds: HINT_SECONDS });
      if (cancelled) cancelNotification(id);
      else hintId.current = id;
    })();
    return () => {
      cancelled = true;
      cancelNotification(hintId.current);
    };
  }, []);

  // Pista si minimiza la app durante el nivel
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state) => {
      if (state === 'background') {
        bgId.current = await scheduleHandlerMessage({
          body: `¿Abandonando, agente? ${HINTS[mission.id]}`,
          seconds: BACKGROUND_SECONDS,
        });
      } else if (state === 'active') {
        await cancelNotification(bgId.current);
        bgId.current = null;
      }
    });
    return () => {
      sub.remove();
      cancelNotification(bgId.current);
    };
  }, []);

  const finish = (usedCharge = false) => {
    const time = Math.floor((Date.now() - startRef.current) / 1000);
    scheduleHandlerMessage({ body: NARRATIVE[mission.id], seconds: NARRATIVE_SECONDS }).catch(() => {});
    navigation.replace('Result', { mission, timeSeconds: time, usedCharge });
  };

  const fail = (reason) => {
    navigation.replace('Fail', { mission, reason });
  };

  const spendCharge = () =>
    Alert.alert(
      'Carga de descifrado',
      'Se consumirá 1 carga y la misión se resolverá al instante (sin créditos ni ranking).',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Usar',
          onPress: async () => {
            try {
              await consumeCharge(user.uid);
              setProfile(await getPlayerProfile(user.uid));
              finish(true);
            } catch (e) {
              Alert.alert('Error', 'No se pudo usar la carga.');
            }
          },
        },
      ]
    );

  const renderGame = () => {
  switch (mission.id) {
    case 'm1':
      return <Level1Lockpick onComplete={() => finish(false)} onFail={fail} />;
    case 'm2':
      return <Level2Stealth onComplete={() => finish(false)} onFail={fail} />;
    case 'm3':
      return <Level3Biometric onComplete={() => finish(false)} onFail={fail} />;
    case 'm4':
      return <Level4Signal onComplete={() => finish(false)} onFail={fail} />;
    case 'm5':
      return <Level5Balance onComplete={() => finish(false)} onFail={fail} />;
    case 'm6':
      return <Level6Finale onComplete={() => finish(false)} onFail={fail} />;
    default:
      return null;
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{mission.title}</Text>
      <Text style={styles.timer}>{seconds}s</Text>
      {renderGame()}

      {charges > 0 && (
        <TouchableOpacity style={styles.chargeBtn} onPress={spendCharge}>
          <Text style={styles.chargeText}>USAR CARGA DE DESCIFRADO ({charges})</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = createStyles({
  container: { flex: 1, backgroundColor: '#000000', padding: 16 },
  title: { color: '#00ff66', fontFamily: 'Courier', fontSize: 20, fontWeight: 'bold' },
  timer: { color: '#ff3355', fontFamily: 'Courier', fontSize: 40, textAlign: 'center', marginVertical: 24 },
  chargeBtn: { borderWidth: 1, borderColor: '#2a6b3a', padding: 12, alignItems: 'center', marginTop: 8 },
  chargeText: { color: '#2a6b3a', fontFamily: 'Courier', fontSize: 12, fontWeight: 'bold' },
});