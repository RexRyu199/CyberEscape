import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MISSIONS } from '../levels/missions';
import { getPlayerProfile } from '../services/firebase';
import { saveCompletion } from '../services/progress';
import { useGameStore } from '../store/useGameStore';
import { createStyles, theme } from '../theme/theme';

export default function ResultScreen({ route, navigation }) {
  const { mission, timeSeconds, usedCharge = false } = route.params;
  const { user, profile, setProfile } = useGameStore();
  const [saving, setSaving] = useState(true);
  const [error, setError] = useState(null);
  const [reward, setReward] = useState(0);

  const index = MISSIONS.findIndex((m) => m.id === mission.id);
  const owned = ['ch1', ...(profile?.unlockedChapters ?? [])];
  const next = MISSIONS[index + 1];
  const canContinue = next && owned.includes(next.chapter);

  useEffect(() => {
    (async () => {
      try {
        const res = await saveCompletion(user.uid, profile.codename, mission.id, timeSeconds, usedCharge);
        setReward(res.reward);
        setProfile(await getPlayerProfile(user.uid));
      } catch (e) {
        console.error(e);
        setError(e.code || e.message || 'desconocido');
      } finally {
        setSaving(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>MISIÓN COMPLETADA</Text>
        <Text style={styles.text}>{mission.title}</Text>
        <Text style={styles.time}>{usedCharge ? '---' : `${timeSeconds}s`}</Text>

        {saving && <ActivityIndicator color={theme.primary} />}
        {error && <Text style={styles.error}>No se pudo guardar el progreso ({error})</Text>}
        {!saving && !error && reward > 0 && <Text style={styles.reward}>+{reward} créditos obtenidos</Text>}
        {!saving && !error && usedCharge && (
          <Text style={styles.note}>Resuelta con carga: no da créditos ni entra al ranking.</Text>
        )}

        <View style={styles.storyBox}>
          <Text style={styles.storyHeader}>{'> MENSAJE DEL HANDLER'}</Text>
          <Text style={styles.storyText}>{mission.story}</Text>
        </View>

        {canContinue ? (
          <TouchableOpacity
            style={styles.buttonMain}
            disabled={saving}
            onPress={() => navigation.replace('Level', { mission: next })}
          >
            <Text style={styles.buttonMainText}>SIGUIENTE MISIÓN: {next.title.toUpperCase()}</Text>
          </TouchableOpacity>
        ) : next ? (
          <TouchableOpacity
            style={styles.buttonMain}
            disabled={saving}
            onPress={() => navigation.replace('Store')}
          >
            <Text style={styles.buttonMainText}>CAPÍTULO 2 DISPONIBLE EN EL MERCADO NEGRO</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.end}>FIN DEL CAPÍTULO 2</Text>
        )}

        <TouchableOpacity
          style={styles.button}
          disabled={saving}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Missions' }] })}
        >
          <Text style={styles.buttonText}>VOLVER A MISIONES</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} disabled={saving} onPress={() => navigation.navigate('Leaderboard')}>
          <Text style={styles.buttonText}>VER RANKING</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = createStyles({
  container: { flex: 1, backgroundColor: '#000000' },
  scroll: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  title: { color: '#00ff66', fontFamily: 'Courier', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  text: { color: '#2a6b3a', fontFamily: 'Courier', textAlign: 'center', marginTop: 8 },
  time: { color: '#00ff66', fontFamily: 'Courier', fontSize: 48, textAlign: 'center', marginVertical: 16 },
  error: { color: '#ff3355', fontFamily: 'Courier', textAlign: 'center' },
  reward: { color: '#00ff66', fontFamily: 'Courier', textAlign: 'center', fontWeight: 'bold' },
  note: { color: '#2a6b3a', fontFamily: 'Courier', textAlign: 'center', fontSize: 12 },
  storyBox: { borderWidth: 1, borderColor: '#2a6b3a', padding: 14, marginVertical: 20 },
  storyHeader: { color: '#2a6b3a', fontFamily: 'Courier', fontSize: 12, marginBottom: 8 },
  storyText: { color: '#00ff66', fontFamily: 'Courier', fontSize: 14, lineHeight: 20 },
  buttonMain: { backgroundColor: '#00ff66', padding: 14, alignItems: 'center' },
  buttonMainText: { color: '#000', fontFamily: 'Courier', fontWeight: 'bold', textAlign: 'center' },
  end: { color: '#00ff66', fontFamily: 'Courier', fontWeight: 'bold', textAlign: 'center' },
  button: { borderWidth: 1, borderColor: '#00ff66', padding: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#00ff66', fontFamily: 'Courier', fontWeight: 'bold' },
});