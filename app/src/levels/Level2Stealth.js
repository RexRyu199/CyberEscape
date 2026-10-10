import * as Haptics from 'expo-haptics';
import { Accelerometer, LightSensor } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { Platform, Text, View, Vibration } from 'react-native';
import { createStyles, theme } from '../theme/theme';

const WARNING_MS = 1500;       // aviso antes de que el guardia mire
const HACK_RATE = 4;           // % de progreso por segundo mientras hackeas
const ALERT_RATE = 35;         // % de alerta por segundo si te ven
const ALERT_DECAY = 15;        // % que baja la alerta por segundo estando a salvo
const DARK_LUX = 5;            // Android: menos de esto = oscuro = escondido

const isFaceDown = (z) => (Platform.OS === 'ios' ? z > 0.75 : z < -0.75);

const rand = (min, max) => min + Math.random() * (max - min);

function allClearBuzz() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (e) {
  }

  Vibration.vibrate([0, 150, 100, 200]);
}

export default function Level2Stealth({ onComplete, onFail }) {
  const [phase, setPhase] = useState('safe'); // safe | warning | danger
  const [progress, setProgress] = useState(0);
  const [alertLevel, setAlertLevel] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [zDebug, setZDebug] = useState(0);
  const [msg, setMsg] = useState('Hackeando... mantén el teléfono boca arriba');

  const zRef = useRef(0);
  const darkRef = useRef(false);
  const phaseRef = useRef('safe');
  const phaseUntil = useRef(Date.now() + rand(4000, 6000));
  const progressRef = useRef(0);
  const alertRef = useRef(0);
  const doneRef = useRef(false);
  const lastBuzz = useRef(0);

  // Sensores
  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    const accSub = Accelerometer.addListener(({ z }) => {
      zRef.current = z;
    });

    let lightSub = null;
    if (Platform.OS === 'android') {
      lightSub = LightSensor.addListener(({ illuminance }) => {
        darkRef.current = illuminance < DARK_LUX;
      });
    }

    return () => {
      accSub.remove();
      if (lightSub) lightSub.remove();
    };
  }, []);

  // Bucle del juego
  useEffect(() => {
    const TICK = 100;

    const id = setInterval(() => {
      if (doneRef.current) return;
      const now = Date.now();
      const dt = TICK / 1000;

      const isHidden = isFaceDown(zRef.current) || darkRef.current;
      setHidden(isHidden);
      setZDebug(zRef.current);

      // Cambio de fase
      if (now >= phaseUntil.current) {
        if (phaseRef.current === 'safe') {
          phaseRef.current = 'warning';
          phaseUntil.current = now + WARNING_MS;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else if (phaseRef.current === 'warning') {
          phaseRef.current = 'danger';
          phaseUntil.current = now + rand(3000, 4500);
        } else {
          phaseRef.current = 'safe';
          phaseUntil.current = now + rand(4000, 6500);
          if (isHidden) allClearBuzz(); 
        }
        setPhase(phaseRef.current);
      }

      const current = phaseRef.current;

      if (current === 'safe') {
        if (!isHidden) {
          progressRef.current = Math.min(100, progressRef.current + HACK_RATE * dt);
          setMsg('Hackeando... mantén el teléfono boca arriba');
        } else {
          setMsg('Guardia lejos. Voltea el teléfono para seguir hackeando');
        }
        alertRef.current = Math.max(0, alertRef.current - ALERT_DECAY * dt);
      }

      if (current === 'warning') {
        setMsg('¡GUARDIA GIRANDO! ¡ESCÓNDETE!');
        if (!isHidden) progressRef.current = Math.min(100, progressRef.current + HACK_RATE * dt);
      }

      if (current === 'danger') {
        if (isHidden) {
          setMsg('Estás oculto... el guardia pasa de largo');
          alertRef.current = Math.max(0, alertRef.current - ALERT_DECAY * dt);
        } else {
          setMsg('¡TE ESTÁ VIENDO! ¡VOLTEA EL TELÉFONO!');
          alertRef.current = Math.min(100, alertRef.current + ALERT_RATE * dt);
          if (now - lastBuzz.current > 400) {
            lastBuzz.current = now;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          }
        }
      }

      setProgress(progressRef.current);
      setAlertLevel(alertRef.current);

      // Detectado: misión fallida
      if (alertRef.current >= 100) {
        doneRef.current = true;
        setMsg('¡DETECTADO!');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setTimeout(() => onFail('Los guardias te detectaron. Misión comprometida'), 700);
        return;
      }

      // Victoria
      if (progressRef.current >= 100) {
        doneRef.current = true;
        setMsg('¡ACCESO CONSEGUIDO!');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(onComplete, 800);
      }
    }, TICK);

    return () => clearInterval(id);
  }, []);

  const boxStyle =
    phase === 'danger' ? styles.boxDanger : phase === 'warning' ? styles.boxWarning : styles.boxSafe;
  const darkText = phase !== 'safe';

  return (
    <View style={styles.container}>
      <View style={[styles.statusBox, boxStyle]}>
        <Text style={[styles.statusTitle, darkText && styles.dark]}>
          {phase === 'safe' ? 'GUARDIA LEJOS' : phase === 'warning' ? 'ALERTA' : 'GUARDIA PATRULLANDO'}
        </Text>
        <Text style={[styles.statusMsg, darkText && styles.dark]}>{msg}</Text>
      </View>

      <Text style={styles.label}>Hackeo {Math.round(progress)}%</Text>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${progress}%` }]} />
      </View>

      <Text style={styles.label}>Alerta {Math.round(alertLevel)}%</Text>
      <View style={[styles.barBg, { borderColor: theme.danger }]}>
        <View style={[styles.barFill, { width: `${alertLevel}%`, backgroundColor: theme.danger }]} />
      </View>

      <Text style={styles.debug}>{hidden ? 'OCULTO' : 'VISIBLE'}</Text>
    </View>
  );
}

const styles = createStyles({
  container: { flex: 1, justifyContent: 'center', padding: 8 },
  statusBox: { height: 110, borderWidth: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, marginBottom: 24 },
  boxSafe: { borderColor: theme.primary, backgroundColor: theme.tint },
  boxWarning: { borderColor: '#ffcc00', backgroundColor: '#ffcc00' },
  boxDanger: { borderColor: theme.danger, backgroundColor: theme.danger },
  statusTitle: { color: theme.primary, fontFamily: theme.font, fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  statusMsg: { color: theme.primary, fontFamily: theme.font, fontSize: 14, textAlign: 'center' },
  dark: { color: '#000' },
  label: { color: theme.dim, fontFamily: theme.font, marginBottom: 6 },
  barBg: { height: 20, borderWidth: 1, borderColor: theme.primary, marginBottom: 20 },
  barFill: { height: '100%', backgroundColor: theme.primary },
  debug: { color: theme.dim, fontFamily: theme.font, fontSize: 11, textAlign: 'center' },
});