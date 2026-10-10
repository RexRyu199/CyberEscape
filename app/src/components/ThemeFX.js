import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import { theme } from '../theme/theme';

const ENABLE_FX = true;      // poner en false para apagar todos los efectos
const RAIN_OPACITY = 0.13;   // visibilidad de la lluvia de Matrix

const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

/* ---------- MATRIX: lluvia de código ---------- */
const CHARS = '01アイウエオカキクケコサシスセソ';
const ROWS = 14;
const LINE_H = 16;

function RainColumn({ x, screenH, duration, delay }) {
  const y = useRef(new Animated.Value(-ROWS * LINE_H)).current;
  const text = useMemo(
    () => Array.from({ length: ROWS }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('\n'),
    []
  );

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(y, { toValue: screenH, duration, easing: Easing.linear, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        width: 24,
        fontSize: 14,
        lineHeight: LINE_H,
        color: theme.primary,
        opacity: RAIN_OPACITY,
        transform: [{ translateY: y }],
      }}
    >
      {text}
    </Animated.Text>
  );
}

function MatrixRain({ width, height }) {
  const cols = Math.floor(width / 26);
  const columns = useMemo(
    () =>
      Array.from({ length: cols }, (_, i) => ({
        x: i * 26 + 2,
        duration: 5000 + Math.random() * 5000,
        delay: Math.random() * 4000,
      })),
    [cols]
  );
  return columns.map((c, i) => <RainColumn key={i} {...c} screenH={height} />);
}

/* ---------- Partícula que sube (corrientes de datos / brasas) ---------- */
function RiseParticle({ x, w, h, round, color, opacity, duration, delay, drift, screenH }) {
  const y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(y, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        width: w,
        height: h,
        borderRadius: round ? w / 2 : 0,
        backgroundColor: color,
        opacity,
        transform: [
          { translateY: y.interpolate({ inputRange: [0, 1], outputRange: [screenH + 40, -80] }) },
          { translateX: y.interpolate({ inputRange: [0, 1], outputRange: [0, drift] }) },
        ],
      }}
    />
  );
}

/* ---------- CYBERPUNK ---------- */
function GlitchBars({ height }) {
  const [bars, setBars] = useState([]);

  useEffect(() => {
    let t;
    const schedule = () => {
      t = setTimeout(() => {
        setBars(
          Array.from({ length: 3 }, () => ({
            top: Math.random() * height,
            h: 6 + Math.random() * 18,
            dx: (Math.random() - 0.5) * 40,
            c: Math.random() < 0.5 ? theme.danger : theme.primary,
          }))
        );
        t = setTimeout(() => {
          setBars([]);
          schedule();
        }, 140);
      }, 4000 + Math.random() * 4000);
    };
    schedule();
    return () => clearTimeout(t);
  }, []);

  return bars.map((b, i) => (
    <View
      key={i}
      style={{ position: 'absolute', left: b.dx, right: -b.dx, top: b.top, height: b.h, backgroundColor: b.c, opacity: 0.35 }}
    />
  ));
}

function CyberpunkFX({ width, height }) {
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sweep, { toValue: height, duration: 5000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const streams = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        x: Math.random() * width,
        w: 2,
        h: 18 + Math.random() * 28,
        color: i % 2 === 0 ? theme.primary : theme.danger,
        opacity: 0.5,
        duration: 3500 + Math.random() * 3500,
        delay: Math.random() * 3000,
        drift: 0,
      })),
    [width]
  );

  return (
    <>
      <LinearGradient
        colors={[rgba(theme.primary, 0.22), rgba(theme.primary, 0)]}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 130 }}
      />
      <LinearGradient
        colors={[rgba(theme.danger, 0), rgba(theme.danger, 0.3)]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 170 }}
      />

      {streams.map((s, i) => (
        <RiseParticle key={i} {...s} round={false} screenH={height} />
      ))}

      <Animated.View
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 60, backgroundColor: theme.primary, opacity: 0.05, transform: [{ translateY: sweep }] }}
      />
      <Animated.View
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 2, backgroundColor: theme.primary, opacity: 0.4, transform: [{ translateY: sweep }] }}
      />

      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 2, backgroundColor: theme.primary, opacity: 0.8 }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, backgroundColor: theme.danger, opacity: 0.8 }} />
      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 2, backgroundColor: theme.danger, opacity: 0.45 }} />
      <View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 2, backgroundColor: theme.primary, opacity: 0.45 }} />

      <GlitchBars height={height} />
    </>
  );
}

/* ---------- ÁMBAR: monitor CRT antiguo ---------- */
function AmberFX({ width, height }) {
  const flicker = useRef(new Animated.Value(0)).current;
  const band = useRef(new Animated.Value(0)).current;
  const lines = useMemo(() => Array.from({ length: Math.ceil(height / 4) }, (_, i) => i), [height]);

  useEffect(() => {
    const flickerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 0.06, duration: 90, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0.01, duration: 140, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0.05, duration: 60, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    const bandLoop = Animated.loop(
      Animated.timing(band, { toValue: height, duration: 7000, easing: Easing.linear, useNativeDriver: true })
    );
    flickerLoop.start();
    bandLoop.start();
    return () => {
      flickerLoop.stop();
      bandLoop.stop();
    };
  }, []);

  const embers = useMemo(
    () =>
      Array.from({ length: 12 }, () => {
        const size = 3 + Math.random() * 3;
        return {
          x: Math.random() * width,
          w: size,
          h: size,
          color: theme.primary,
          opacity: 0.55,
          duration: 6000 + Math.random() * 6000,
          delay: Math.random() * 5000,
          drift: (Math.random() - 0.5) * 60,
        };
      }),
    [width]
  );

  return (
    <>
      {lines.map((i) => (
        <View
          key={i}
          style={{ position: 'absolute', left: 0, right: 0, top: i * 4, height: 1, backgroundColor: '#000', opacity: 0.22 }}
        />
      ))}

      <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: -120, height: 120, transform: [{ translateY: band }] }}>
        <LinearGradient
          colors={[rgba(theme.primary, 0), rgba(theme.primary, 0.1), rgba(theme.primary, 0)]}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {embers.map((e, i) => (
        <RiseParticle key={i} {...e} round screenH={height} />
      ))}

      <LinearGradient
        colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0)']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 110 }}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.75)']}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 110 }}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 60 }}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 60 }}
      />

      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.primary, opacity: flicker }]} />
    </>
  );
}

/* ---------- Capa principal ---------- */
export default function ThemeFX() {
  const { width, height } = useWindowDimensions();
  if (!ENABLE_FX) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {theme.id === 'matrix' && <MatrixRain width={width} height={height} />}
      {theme.id === 'cyberpunk' && <CyberpunkFX width={width} height={height} />}
      {theme.id === 'amber' && <AmberFX width={width} height={height} />}
    </View>
  );
}