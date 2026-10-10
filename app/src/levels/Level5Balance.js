import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { createStyles } from '../theme/theme';

const ARENA_R = 125;     // radio de la arena
const RING_R = 42;       // radio de la zona estable
const DOT_R = 11;        // radio del punto de señal
const GOAL_SECONDS = 12; // segundos acumulados dentro de la zona
const DT = 0.05;         // paso de simulación (s)

const SIGN = Platform.OS === 'ios' ? 1 : -1;

export default function Level5Balance({ onComplete, onFail }) {
  const [pos, setPos] = useState({ x: 45, y: -30 });
  const [progress, setProgress] = useState(0);
  const [stability, setStability] = useState(100);
  const [msg, setMsg] = useState('Inclina el teléfono para centrar la señal');
  const [gust, setGust] = useState(false);

  const tilt = useRef({ x: 0, y: 0 });
  const p = useRef({ x: 45, y: -30 });
  const v = useRef({ x: 0, y: 0 });
  const progRef = useRef(0);
  const stabRef = useRef(100);
  const nextGust = useRef(Date.now() + 2500);
  const doneRef = useRef(false);
  const lastBuzz = useRef(0);

  useEffect(() => {
    Accelerometer.setUpdateInterval(50);
    const sub = Accelerometer.addListener(({ x, y }) => {
      tilt.current = { x: SIGN * x, y: -SIGN * y };
    });

    const id = setInterval(() => {
      if (doneRef.current) return;
      const now = Date.now();

      // Ráfagas de viento
      if (now >= nextGust.current) {
        const ang = Math.random() * Math.PI * 2;
        v.current.x += Math.cos(ang) * 110;
        v.current.y += Math.sin(ang) * 110;
        nextGust.current = now + 2000 + Math.random() * 2000;
        setGust(true);
        setTimeout(() => setGust(false), 600);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Física
      v.current.x = (v.current.x + tilt.current.x * 380 * DT) * 0.94;
      v.current.y = (v.current.y + tilt.current.y * 380 * DT) * 0.94;
      let nx = p.current.x + v.current.x * DT;
      let ny = p.current.y + v.current.y * DT;

      // Rebote en el borde de la arena
      const maxD = ARENA_R - DOT_R;
      const dist = Math.hypot(nx, ny);
      if (dist > maxD) {
        const k = maxD / dist;
        nx *= k;
        ny *= k;
        v.current.x *= -0.3;
        v.current.y *= -0.3;
      }
      p.current = { x: nx, y: ny };

      // Dentro de la zona estable
      const inside = Math.hypot(nx, ny) < RING_R;
      if (inside) {
        progRef.current = Math.min(100, progRef.current + (DT / GOAL_SECONDS) * 100);
        stabRef.current = Math.min(100, stabRef.current + 12 * DT);
        setMsg('Señal estable');
      } else {
        stabRef.current = Math.max(0, stabRef.current - 22 * DT);
        setMsg(stabRef.current < 35 ? '¡ENLACE CRÍTICO!' : 'Señal inestable. Vuelve al centro');
        if (stabRef.current < 35 && now - lastBuzz.current > 500) {
          lastBuzz.current = now;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }

      setPos({ x: nx, y: ny });
      setProgress(progRef.current);
      setStability(stabRef.current);

      if (stabRef.current <= 0) {
        doneRef.current = true;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setTimeout(() => onFail('La antena perdió el enlace. Las pruebas no se subieron'), 400);
        return;
      }
      if (progRef.current >= 100) {
        doneRef.current = true;
        setMsg('¡PRUEBAS SUBIDAS!');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(onComplete, 800);
      }
    }, DT * 1000);

    return () => {
      sub.remove();
      clearInterval(id);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Carga de pruebas {Math.round(progress)}%</Text>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${progress}%` }]} />
      </View>

      <Text style={styles.label}>Estabilidad {Math.round(stability)}%</Text>
      <View style={[styles.barBg, { borderColor: '#ff3355' }]}>
        <View style={[styles.barFill, { width: `${stability}%`, backgroundColor: '#ff3355' }]} />
      </View>

      <View style={styles.arenaWrap}>
        <View style={[styles.arena, gust && styles.arenaGust]}>
          <View style={styles.ring} />
          <View style={[styles.dot, { left: ARENA_R + pos.x - DOT_R, top: ARENA_R + pos.y - DOT_R }]} />
        </View>
      </View>

      <Text style={styles.msg}>{gust ? '¡RÁFAGA!' : msg}</Text>
    </View>
  );
}

const styles = createStyles({
  container: { flex: 1, justifyContent: 'center', padding: 8 },
  label: { color: '#2a6b3a', fontFamily: 'Courier', marginBottom: 6 },
  barBg: { height: 16, borderWidth: 1, borderColor: '#00ff66', marginBottom: 14 },
  barFill: { height: '100%', backgroundColor: '#00ff66' },
  arenaWrap: { alignItems: 'center', marginVertical: 8 },
  arena: { width: ARENA_R * 2, height: ARENA_R * 2, borderRadius: ARENA_R, borderWidth: 1, borderColor: '#2a6b3a' },
  arenaGust: { borderColor: '#ff3355' },
  ring: {
    position: 'absolute',
    left: ARENA_R - RING_R,
    top: ARENA_R - RING_R,
    width: RING_R * 2,
    height: RING_R * 2,
    borderRadius: RING_R,
    borderWidth: 1,
    borderColor: '#00ff66',
    backgroundColor: '#052a12',
  },
  dot: { position: 'absolute', width: DOT_R * 2, height: DOT_R * 2, borderRadius: DOT_R, backgroundColor: '#00ff66' },
  msg: { color: '#00ff66', fontFamily: 'Courier', fontWeight: 'bold', textAlign: 'center', marginTop: 8 },
});