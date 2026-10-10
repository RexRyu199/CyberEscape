import { useState } from 'react';
import { Text, View } from 'react-native';
import { createStyles } from '../theme/theme';
import Level2Stealth from './Level2Stealth';
import Level3Biometric from './Level3Biometric';
import Level5Balance from './Level5Balance';

const PHASES = [
  { title: 'FASE 1/3 · INFILTRACIÓN', Component: Level2Stealth },
  { title: 'FASE 2/3 · ESTABILIZA EL ENLACE', Component: Level5Balance },
  { title: 'FASE 3/3 · AUTORIZACIÓN FINAL', Component: Level3Biometric },
];

export default function Level6Finale({ onComplete, onFail }) {
  const [phase, setPhase] = useState(0);
  const { title, Component } = PHASES[phase];

  const next = () => {
    if (phase >= PHASES.length - 1) onComplete();
    else setPhase(phase + 1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.banner}>{title}</Text>
      <Component key={phase} onComplete={next} onFail={onFail} />
    </View>
  );
}

const styles = createStyles({
  container: { flex: 1 },
  banner: {
    color: '#00ff66',
    fontFamily: 'Courier',
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#2a6b3a',
    paddingVertical: 8,
    marginBottom: 8,
  },
});