import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useRef, useState } from 'react';
import { Animated, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createStyles, theme } from '../theme/theme';

const LOG_LINES = [
  '> Conectando con servidor enemigo...',
  '> Credenciales verificadas',
  '> Descifrando bloque 1/3...',
  '> Descifrando bloque 2/3...',
  '> Descifrando bloque 3/3...',
  '> Archivo desencriptado',
];
const DECRYPT_MS = 3000;
const MAX_ATTEMPTS = 1;

export default function Level3Biometric({ onComplete, onFail  }) {
  const [available, setAvailable] = useState(null);
  const [status, setStatus] = useState('ready');    // ready | decrypting | failed | done
  const [logs, setLogs] = useState([]);
  const [codeInput, setCodeInput] = useState('');

  const progress = useRef(new Animated.Value(0)).current;
  const timers = useRef([]);
  const attemptsRef = useRef(0);
  const emergencyCode = useRef(String(Math.floor(1000 + Math.random() * 9000))).current;

  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setAvailable(hasHardware && enrolled);
    })();
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const startDecrypt = () => {
    setStatus('decrypting');
    setLogs([]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.timing(progress, { toValue: 1, duration: DECRYPT_MS, useNativeDriver: false }).start();

    LOG_LINES.forEach((line, i) => {
      const t = setTimeout(() => {
        setLogs((prev) => [...prev, line]);
      }, (DECRYPT_MS / LOG_LINES.length) * i);
      timers.current.push(t);
    });

    const end = setTimeout(() => {
      setStatus('done');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(onComplete, 700);
    }, DECRYPT_MS + 300);
    timers.current.push(end);
  };

  const registerFail = () => {
    attemptsRef.current += 1;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setStatus('failed');
    if (attemptsRef.current >= MAX_ATTEMPTS) {
      setTimeout(() => onFail('Demasiados intentos fallidos. El sistema se bloqueó'), 700);
    }
  };

  const handleScan = async () => {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Autoriza la desencriptación',
      cancelLabel: 'Cancelar',
    });
    if (res.success) {
      startDecrypt();
    } else if (res.error === 'user_cancel' || res.error === 'app_cancel') {
      return;
    } else {
      registerFail();
    }
  };

  const handleCode = () => {
    if (codeInput === emergencyCode) {
      startDecrypt();
    } else {
      setCodeInput('');
      registerFail();
    }
  };

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const working = status === 'decrypting' || status === 'done';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ARCHIVO CLASIFICADO</Text>
      <Text style={styles.sub}>Se requiere autorización biométrica del agente</Text>

      {available === null && <Text style={styles.sub}>Comprobando sensores...</Text>}

      {available === true && !working && (
        <TouchableOpacity style={styles.button} onPress={handleScan}>
          <Text style={styles.buttonText}>ESCANEAR HUELLA / ROSTRO</Text>
        </TouchableOpacity>
      )}

      {available === false && !working && (
        <View>
          <Text style={styles.sub}>Biometría no disponible. Código de emergencia:</Text>
          <Text style={styles.code}>{emergencyCode}</Text>
          <TextInput
            style={styles.input}
            value={codeInput}
            onChangeText={setCodeInput}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="Escribe el código"
            placeholderTextColor={theme.dim}
          />
          <TouchableOpacity style={styles.button} onPress={handleCode}>
            <Text style={styles.buttonText}>AUTORIZAR</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'failed' && (
        <View style={styles.denied}>
          <Text style={styles.deniedText}>ACCESO DENEGADO - Inténtalo de nuevo</Text>
        </View>
      )}

      {working && (
        <View>
          <View style={styles.barBg}>
            <Animated.View style={[styles.barFill, { width: barWidth }]} />
          </View>
          <View style={styles.logBox}>
            {logs.map((l, i) => (
              <Text key={i} style={styles.logText}>{l}</Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = createStyles({
  container: { flex: 1, justifyContent: 'center', padding: 8 },
  title: { color: theme.primary, fontFamily: theme.font, fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  sub: { color: theme.dim, fontFamily: theme.font, textAlign: 'center', marginVertical: 12 },
  button: { borderWidth: 1, borderColor: theme.primary, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { color: theme.primary, fontFamily: theme.font, fontWeight: 'bold' },
  code: { color: theme.primary, fontFamily: theme.font, fontSize: 36, textAlign: 'center', letterSpacing: 8, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: theme.primary, color: theme.primary, fontFamily: theme.font, padding: 12, textAlign: 'center' },
  denied: { backgroundColor: theme.danger, padding: 12, marginTop: 16 },
  deniedText: { color: '#000', fontFamily: theme.font, fontWeight: 'bold', textAlign: 'center' },
  barBg: { height: 20, borderWidth: 1, borderColor: theme.primary, marginTop: 16 },
  barFill: { height: '100%', backgroundColor: theme.primary },
  logBox: { marginTop: 16, minHeight: 140 },
  logText: { color: theme.primary, fontFamily: theme.font, fontSize: 13, marginBottom: 4 },
});