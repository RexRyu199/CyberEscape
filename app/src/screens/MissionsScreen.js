import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MISSIONS, CHAPTERS } from '../levels/missions';
import { useGameStore } from '../store/useGameStore';
import { createStyles } from '../theme/theme';

export default function MissionsScreen({ navigation }) {
  const profile = useGameStore((s) => s.profile);
  const isAnonymous = useGameStore((s) => s.isAnonymous);
  const completed = profile?.progress?.completedMissions ?? [];
  const owned = ['ch1', ...(profile?.unlockedChapters ?? [])];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.header}>{`> Agente ${profile?.codename ?? ''}`}</Text>
          <Text style={styles.sub}>Expedientes de La Central</Text>
        </View>
        <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.navigate('Account')}>
          <Text style={styles.exitText}>CUENTA</Text>
        </TouchableOpacity>
      </View>

      {isAnonymous && (
        <TouchableOpacity style={styles.banner} onPress={() => navigation.navigate('Account')}>
          <Text style={styles.bannerText}>Tu progreso no está protegido. Toca para vincular una cuenta.</Text>
        </TouchableOpacity>
      )}

      <ScrollView style={{ flex: 1 }}>
        {CHAPTERS.map((ch) => {
          const hasChapter = owned.includes(ch.id);
          return (
            <View key={ch.id} style={{ marginBottom: 8 }}>
              <Text style={styles.chapterTitle}>{ch.title}</Text>
              <Text style={styles.chapterSyn}>{ch.synopsis}</Text>

              {!hasChapter && (
                <TouchableOpacity style={styles.lockBox} onPress={() => navigation.navigate('Store')}>
                  <Text style={styles.lockTitle}>EXPEDIENTE CLASIFICADO</Text>
                  <Text style={styles.lockText}>Disponible en el Mercado Negro por {ch.price}</Text>
                </TouchableOpacity>
              )}

              {hasChapter &&
                MISSIONS.map((m, i) => {
                  if (m.chapter !== ch.id) return null;
                  const done = completed.includes(m.id);
                  const unlocked = i === 0 || completed.includes(MISSIONS[i - 1].id);
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.card, !unlocked && styles.locked]}
                      disabled={!unlocked}
                      onPress={() => navigation.navigate('Level', { mission: m })}
                    >
                      <Text style={styles.cardTitle}>
                        {m.title} {done ? '[COMPLETADA]' : !unlocked ? '[BLOQUEADA]' : ''}
                      </Text>
                      <Text style={styles.cardText}>{m.briefing}</Text>
                      <Text style={styles.cardSensor}>Herramienta: {m.sensor}</Text>
                    </TouchableOpacity>
                  );
                })}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footBtn} onPress={() => navigation.navigate('Leaderboard')}>
          <Text style={styles.footText}>RANKING</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footBtn} onPress={() => navigation.navigate('Store')}>
          <Text style={styles.footText}>MERCADO NEGRO</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = createStyles({
  container: { flex: 1, backgroundColor: '#000000', padding: 16 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  header: { color: '#00ff66', fontFamily: 'Courier', fontSize: 20, fontWeight: 'bold' },
  sub: { color: '#2a6b3a', fontFamily: 'Courier' },
  exitBtn: { borderWidth: 1, borderColor: '#2a6b3a', paddingVertical: 6, paddingHorizontal: 10 },
  exitText: { color: '#2a6b3a', fontFamily: 'Courier', fontSize: 11, fontWeight: 'bold' },
  banner: { borderWidth: 1, borderColor: '#ff3355', padding: 10, marginBottom: 12 },
  bannerText: { color: '#ff3355', fontFamily: 'Courier', fontSize: 12, textAlign: 'center' },
  chapterTitle: { color: '#00ff66', fontFamily: 'Courier', fontWeight: 'bold', fontSize: 14, marginTop: 8 },
  chapterSyn: { color: '#2a6b3a', fontFamily: 'Courier', fontSize: 12, marginVertical: 6 },
  lockBox: { borderWidth: 1, borderColor: '#ff3355', padding: 14, marginBottom: 12, alignItems: 'center' },
  lockTitle: { color: '#ff3355', fontFamily: 'Courier', fontWeight: 'bold' },
  lockText: { color: '#2a6b3a', fontFamily: 'Courier', fontSize: 12, marginTop: 4, textAlign: 'center' },
  card: { borderWidth: 1, borderColor: '#00ff66', padding: 14, marginBottom: 12 },
  locked: { opacity: 0.35 },
  cardTitle: { color: '#00ff66', fontFamily: 'Courier', fontWeight: 'bold', marginBottom: 6 },
  cardText: { color: '#00ff66', fontFamily: 'Courier', fontSize: 12 },
  cardSensor: { color: '#2a6b3a', fontFamily: 'Courier', fontSize: 12, marginTop: 6 },
  footer: { flexDirection: 'row', gap: 12, marginTop: 8 },
  footBtn: { flex: 1, borderWidth: 1, borderColor: '#00ff66', padding: 12, alignItems: 'center' },
  footText: { color: '#00ff66', fontFamily: 'Courier', fontWeight: 'bold', fontSize: 12 },
});