import * as Haptics from 'expo-haptics';
import { Magnetometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { createStyles } from '../theme/theme';

const TARGETS = 3;          // satélites a localizar
const TOLERANCE_DEG = 14;   // margen de error del ángulo
const HOLD_MS = 1500;       // tiempo que hay que mantener la alineación
const TIME_LIMIT = 75;      // segundos antes de perder el enlace

const toDeg = (r) => (r * 180) / Math.PI;
const angleDiff = (a, b) => {
  let d = a - b;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
};
const randomOffset = () => (60 + Math.random() * 100) * (Math.random() < 0.5 ? -1 : 1);

export default function Level4Signal({ onComplete, onFail }) {
  const [locked, setLocked] = useState(0);
  const [signal, setSignal] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [msg, setMsg] = useState('Mantén el teléfono horizontal y gira lentamente');
  const [kind, setKind] = useState('idle'); // idle | hold | ok

  const smooth = useRef(null);
  const target = useRef(null);
  const holdStart = useRef(null);
  const lockedRef = useRef(0);
  const doneRef = useRef(false);
  const lastBuzz = useRef(0);
  const stickyUntil = useRef(0);
  const timeRef = useRef(TIME_LIMIT);

  const say = (text, k, sticky = 0) => {
    const now = Date.now();
    if (now < stickyUntil.current && !sticky) return;
    if (sticky) stickyUntil.current = now + sticky;
    setMsg(text);
    setKind(k);
  };

  useEffect(() => {
    Magnetometer.setUpdateInterval(100);

    const sub = Magnetometer.addListener(({ x, y }) => {
      if (doneRef.current) return;
      const now = Date.now();

      const s = smooth.current;
      smooth.current = s ? { x: s.x * 0.7 + x * 0.3, y: s.y * 0.7 + y * 0.3 } : { x, y };
      const heading = (toDeg(Math.atan2(smooth.current.y, smooth.current.x)) + 360) % 360;

      // Primer satélite
      if (target.current === null) target.current = (heading + randomOffset() + 360) % 360;

      const d = Math.abs(angleDiff(heading, target.current));
      const sig = Math.max(0, 1 - d / 90);
      setSignal(sig);

      // Vibración más rápida mientras más cerca
      if (sig > 0.3 && now - lastBuzz.current > 750 - 600 * sig) {
        lastBuzz.current = now;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      if (d < TOLERANCE_DEG) {
        if (!holdStart.current) holdStart.current = now;
        say('Señal detectada... ¡no te muevas!', 'hold');

        if (now - holdStart.current >= HOLD_MS) {
          holdStart.current = null;
          lockedRef.current += 1;
          setLocked(lockedRef.current);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          if (lockedRef.current >= TARGETS) {
            doneRef.current = true;
            say('¡ENLACE ESTABLECIDO!', 'ok', 5000);
            setTimeout(onComplete, 900);
          } else {
            target.current = (heading + randomOffset() + 360) % 360;
            say('¡Satélite fijado! Busca el siguiente...', 'ok', 1500);
          }
        }
      } else {
        holdStart.current = null;
        say(sig > 0.6 ? 'Muy cerca... ajusta con calma' : 'Buscando satélite...', 'idle');
      }
    });

    // Límite de tiempo
    const timer = setInterval(() => {
      if (doneRef.current) return;
      timeRef.current -= 1;
      setTimeLeft(timeRef.current);
      if (timeRef.current <= 0) {
        doneRef.current = true;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setTimeout(() => onFail('Se agotó el tiempo. Helix localizó tu señal'), 400);
      }
    }, 1000);

    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, []);

  const label = signal > 0.75 ? 'FUERTE' : signal > 0.4 ? 'MEDIA' : 'DÉBIL';

  return (
    <View style={styles.container}>
      <View style={styles.pins}>
        {Array.from({ length: TARGETS }).map((_, i) => (
          <View key={i} style={[styles.pin, i < locked && styles.pinOn]}>
            <Text style={styles.pinText}>{i < locked ? 'OK' : i + 1}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.label}>Señal del satélite: {label}</Text>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${Math.round(signal * 100)}%` }]} />
      </View>

      <Text style={styles.label}>Enlace activo: {timeLeft}s</Text>
      <View style={[styles.barBg, { borderColor: '#ff3355' }]}>
        <View style={[styles.barFill, { width: `${(timeLeft / TIME_LIMIT) * 100}%`, backgroundColor: '#ff3355' }]} />
      </View>

      <View style={[styles.msgBox, kind === 'hold' && styles.msgHold, kind === 'ok' && styles.msgOk]}>
        <Text style={[styles.msgText, kind === 'ok' && { color: '#000' }]}>{msg}</Text>
      </View>
    </View>
  );
}

const styles = createStyles({
  container: { flex: 1, justifyContent: 'center', padding: 8 },
  pins: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 28 },
  pin: { width: 56, height: 56, borderWidth: 1, borderColor: '#2a6b3a', justifyContent: 'center', alignItems: 'center' },
  pinOn: { borderColor: '#00ff66', backgroundColor: '#052a12' },
  pinText: { color: '#00ff66', fontFamily: 'Courier', fontWeight: 'bold' },
  label: { color: '#2a6b3a', fontFamily: 'Courier', marginBottom: 6 },
  barBg: { height: 20, borderWidth: 1, borderColor: '#00ff66', marginBottom: 20 },
  barFill: { height: '100%', backgroundColor: '#00ff66' },
  msgBox: { height: 72, marginTop: 8, borderWidth: 1, borderColor: '#2a6b3a', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 },
  msgHold: { borderColor: '#00ff66', backgroundColor: '#052a12' },
  msgOk: { borderColor: '#00ff66', backgroundColor: '#00ff66' },
  msgText: { color: '#00ff66', fontFamily: 'Courier', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
});