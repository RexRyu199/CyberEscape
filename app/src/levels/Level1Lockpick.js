import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { createStyles, theme } from '../theme/theme';

const PINS = 3;           // cantidad de pernos
const TOLERANCE = 0.07;   // margen de error del ángulo
const HOLD_MS = 1500;     // tiempo que hay que mantener el ángulo
const MAX_SPEED = 0.1;    // si te mueves más rápido, se rompe el avance
const MAX_STRIKES = 4;    // movimientos bruscos permitidos antes de romper la ganzúa

function randomTarget() {
  const v = 0.2 + Math.random() * 0.4;
  return Math.random() < 0.5 ? -v : v;
}

export default function Level1Lockpick({ onComplete, onFail }) {
  const [openPins, setOpenPins] = useState(0);
  const [msg, setMsg] = useState('Inclina lentamente el teléfono...');
  const [kind, setKind] = useState('idle'); // idle | hold | warn | ok

  const targetRef = useRef(randomTarget());
  const lastX = useRef(null);
  const holdStart = useRef(null);
  const openRef = useRef(0);
  const doneRef = useRef(false);
  const lastHaptic = useRef(0);
  const lastWarn = useRef(0);
  const stickyUntil = useRef(0);
  const strikesRef = useRef(0);

  // Animaciones
  const tilt = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const pinScales = useRef(
    Array.from({ length: PINS }, () => new Animated.Value(1))
  ).current;

  // Mensaje normal
  const showMsg = (text, k) => {
    if (Date.now() < stickyUntil.current) return;
    setMsg(text);
    setKind(k);
  };

  // Mensaje importante
  const showSticky = (text, k, ms) => {
    stickyUntil.current = Date.now() + ms;
    setMsg(text);
    setKind(k);
  };

  const playWarning = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 40, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 40, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8, duration: 40, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
    flash.setValue(1);
    Animated.timing(flash, { toValue: 0, duration: 700, useNativeDriver: true }).start();
  };

  const popPin = (index) => {
    pinScales[index].setValue(1.5);
    Animated.spring(pinScales[index], { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  useEffect(() => {
    Accelerometer.setUpdateInterval(60);

    const sub = Accelerometer.addListener(({ x }) => {
      if (doneRef.current) return;
      const now = Date.now();

      tilt.setValue(x);

      // 1) Movimiento brusco
      const speed = lastX.current === null ? 0 : Math.abs(x - lastX.current);
      lastX.current = x;
      if (speed > MAX_SPEED) {
        holdStart.current = null;
        if (now - lastWarn.current > 600) {
          lastWarn.current = now;
          lastHaptic.current = now;
          strikesRef.current += 1;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          playWarning();
          if (strikesRef.current >= MAX_STRIKES) {
            doneRef.current = true;
            showSticky('¡LA GANZÚA SE ROMPIÓ!', 'warn', 5000);
            setTimeout(() => onFail('La ganzúa se rompió por moverla demasiado rápido'), 700);
            return;
          }
        }
        showSticky(`¡MUY RÁPIDO! Ganzúa dañada (${strikesRef.current}/${MAX_STRIKES})`, 'warn', 1000);
        return;
      }

      // 2) Cercanía al ángulo correcto
      const diff = Math.abs(x - targetRef.current);
      const close = Math.max(0, 1 - diff / 0.6);
      Animated.timing(bar, { toValue: close, duration: 80, useNativeDriver: false }).start();

      // 3) Vibración suave si estás cerca
      if (close > 0.7 && now - lastHaptic.current > 250) {
        lastHaptic.current = now;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // 4) Dentro del margen
      if (diff < TOLERANCE) {
        if (!holdStart.current) holdStart.current = now;
        showMsg('Algo cede... ¡MANTÉN LA POSICIÓN!', 'hold');

        if (now - holdStart.current >= HOLD_MS) {
          holdStart.current = null;
          const index = openRef.current;
          openRef.current += 1;
          setOpenPins(openRef.current);
          popPin(index);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          if (openRef.current >= PINS) {
            doneRef.current = true;
            showSticky('¡CERRADURA ABIERTA!', 'ok', 5000);
            setTimeout(onComplete, 900);
          } else {
            targetRef.current = randomTarget();
            showSticky('¡Perno liberado! Busca el siguiente...', 'ok', 1200);
          }
        }
      } else {
        holdStart.current = null;
        showMsg('Inclina lentamente el teléfono...', 'idle');
      }
    });

    return () => sub.remove();
  }, []);

  const rotate = tilt.interpolate({
    inputRange: [-0.7, 0.7],
    outputRange: ['-60deg', '60deg'],
    extrapolate: 'clamp',
  });
  const barWidth = bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const needleColor = kind === 'warn' ? theme.danger : theme.primary;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: shake }] }]}>
      <View style={styles.pins}>
        {pinScales.map((scale, i) => (
          <Animated.View
            key={i}
            style={[styles.pin, i < openPins && styles.pinOpen, { transform: [{ scale }] }]}
          >
            <Text style={styles.pinText}>{i < openPins ? 'OK' : i + 1}</Text>
          </Animated.View>
        ))}
      </View>

      <View style={styles.dial}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.needleWrap, { transform: [{ rotate }] }]}>
          <View style={[styles.needle, { backgroundColor: needleColor }]} />
        </Animated.View>
        <View style={styles.centerDot} />
      </View>

      <Text style={styles.label}>Señal</Text>
      <View style={styles.barBg}>
        <Animated.View style={[styles.barFill, { width: barWidth }]} />
      </View>

      <View style={[styles.msgBox, styles[`msgBox_${kind}`]]}>
        <Text style={[styles.msgText, (kind === 'warn' || kind === 'ok') && styles.msgTextDark]}>
          {msg}
        </Text>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.danger, opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] }) }]}
      />
    </Animated.View>
  );
}

const styles = createStyles({
  container: { flex: 1, justifyContent: 'center', padding: 8 },
  pins: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 24 },
  pin: { width: 56, height: 56, borderWidth: 1, borderColor: theme.dim, justifyContent: 'center', alignItems: 'center' },
  pinOpen: { borderColor: theme.primary, backgroundColor: theme.tint },
  pinText: { color: theme.primary, fontFamily: theme.font, fontWeight: 'bold' },

  dial: { width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: theme.primary, alignSelf: 'center', marginBottom: 24 },
  needleWrap: { alignItems: 'center' },
  needle: { width: 4, height: 80, marginTop: 6 },
  centerDot: { position: 'absolute', top: 84, left: 84, width: 12, height: 12, borderRadius: 6, backgroundColor: theme.primary },

  label: { color: theme.dim, fontFamily: theme.font, marginBottom: 6 },
  barBg: { height: 20, borderWidth: 1, borderColor: theme.primary },
  barFill: { height: '100%', backgroundColor: theme.primary },

  msgBox: { height: 72, marginTop: 24, borderWidth: 1, borderColor: theme.dim, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 },
  msgBox_idle: { borderColor: theme.dim },
  msgBox_hold: { borderColor: theme.primary, backgroundColor: theme.tint },
  msgBox_warn: { borderColor: theme.danger, backgroundColor: theme.danger },
  msgBox_ok: { borderColor: theme.primary, backgroundColor: theme.primary },
  msgText: { color: theme.primary, fontFamily: theme.font, fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  msgTextDark: { color: '#000' },
});