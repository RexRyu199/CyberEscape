import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MISSIONS } from '../levels/missions';
import { getLeaderboard } from '../services/progress';
import { createStyles, theme } from '../theme/theme';

export default function LeaderboardScreen() {
  const [missionId, setMissionId] = useState(MISSIONS[0].id);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaderboard(missionId)
      .then(setRows)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [missionId]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>RANKING GLOBAL</Text>

      <View style={styles.tabs}>
        {MISSIONS.map((m, i) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.tab, missionId === m.id && styles.tabActive]}
            onPress={() => setMissionId(m.id)}
          >
            <Text style={styles.tabText}>M{i + 1}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={theme.primary} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.uid}
          ListEmptyComponent={<Text style={styles.empty}>Sin registros todavía.</Text>}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <Text style={styles.rowText}>{index + 1}. {item.codename}</Text>
              <Text style={styles.rowText}>{item.timeSeconds}s</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = createStyles({
  container: { flex: 1, backgroundColor: theme.bg, padding: 16 },
  title: { color: theme.primary, fontFamily: theme.font, fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tab: { borderWidth: 1, borderColor: theme.dim, paddingVertical: 8, paddingHorizontal: 16 },
  tabActive: { borderColor: theme.primary, backgroundColor: theme.tint },
  tabText: { color: theme.primary, fontFamily: theme.font },
  row: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#0a2a14', paddingVertical: 10 },
  rowText: { color: theme.primary, fontFamily: theme.font },
  empty: { color: theme.dim, fontFamily: theme.font },
});