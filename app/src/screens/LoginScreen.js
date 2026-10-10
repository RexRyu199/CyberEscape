import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInAnonymously, createPlayerProfile, getPlayerProfile } from '../services/firebase';
import { registerWithEmail, loginWithEmail, resetPassword, authErrorMessage } from '../services/account';
import { useGameStore } from '../store/useGameStore';
import { theme, createStyles } from '../theme/theme';

const MODES = [
  { id: 'login', label: 'INGRESAR' },
  { id: 'register', label: 'CREAR CUENTA' },
  { id: 'guest', label: 'INVITADO' },
];

export default function LoginScreen() {
  const [mode, setMode] = useState('login');
  const [codename, setCodename] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const { setUser, setProfile } = useGameStore();

  const submit = async () => {
    const name = codename.trim();
    const mail = email.trim();

    if (mode !== 'login' && name.length < 3) {
      Alert.alert('Agente', 'Tu nombre en clave debe tener al menos 3 caracteres.');
      return;
    }
    if (mode !== 'guest' && (!mail || password.length < 6)) {
      Alert.alert('Agente', 'Escribe tu correo y una contraseña de al menos 6 caracteres.');
      return;
    }

    try {
      setBusy(true);
      let user;

      if (mode === 'login') {
        user = await loginWithEmail(mail, password);
        let profile = await getPlayerProfile(user.uid);
        if (!profile) {
          await createPlayerProfile(user.uid, mail.split('@')[0].slice(0, 16));
          profile = await getPlayerProfile(user.uid);
        }
        setProfile(profile);
      } else if (mode === 'register') {
        user = await registerWithEmail(name, mail, password);
        setProfile(await getPlayerProfile(user.uid));
      } else {
        user = await signInAnonymously();
        let profile = await getPlayerProfile(user.uid);
        if (!profile) {
          await createPlayerProfile(user.uid, name);
          profile = await getPlayerProfile(user.uid);
        }
        setProfile(profile);
      }
      setUser(user);
    } catch (e) {
      console.error(e);
      Alert.alert('No se pudo continuar', authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    const mail = email.trim();
    if (!mail) {
      Alert.alert('Agente', 'Escribe tu correo para enviarte el enlace de recuperación.');
      return;
    }
    try {
      await resetPassword(mail);
      Alert.alert('Revisa tu correo', 'Te enviamos un enlace para restablecer tu contraseña.');
    } catch (e) {
      Alert.alert('Error', authErrorMessage(e));
    }
  };

  const placeholderColor = theme.dim;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>CYBERESCAPE</Text>
          <Text style={styles.subtitle}>{'> Identifícate, agente_'}</Text>

          <View style={styles.tabs}>
            {MODES.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.tab, mode === m.id && styles.tabActive]}
                onPress={() => setMode(m.id)}
              >
                <Text style={styles.tabText}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode !== 'login' && (
            <TextInput
              style={styles.input}
              placeholder="Nombre en clave"
              placeholderTextColor={placeholderColor}
              value={codename}
              onChangeText={setCodename}
              autoCapitalize="none"
              maxLength={16}
            />
          )}

          {mode !== 'guest' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor={placeholderColor}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder="Contraseña (mínimo 6 caracteres)"
                placeholderTextColor={placeholderColor}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </>
          )}

          {mode === 'guest' && (
            <Text style={styles.warning}>
              Como invitado, tu progreso y tus compras solo existen en esta sesión: si cierras sesión no podrás
              recuperarlos. Después podrás vincular un correo desde la pantalla de Cuenta.
            </Text>
          )}

          <TouchableOpacity style={styles.button} onPress={submit} disabled={busy}>
            {busy ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <Text style={styles.buttonText}>
                {mode === 'login' ? 'INICIAR SESIÓN' : mode === 'register' ? 'CREAR CUENTA' : 'ENTRAR COMO INVITADO'}
              </Text>
            )}
          </TouchableOpacity>

          {mode === 'login' && (
            <TouchableOpacity onPress={forgot}>
              <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = createStyles({
  safe: { flex: 1, backgroundColor: '#000000' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { color: '#00ff66', fontSize: 32, fontWeight: 'bold', fontFamily: 'Courier', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#00ff66', fontFamily: 'Courier', textAlign: 'center', marginBottom: 24 },
  tabs: { flexDirection: 'row', marginBottom: 20 },
  tab: { flex: 1, borderWidth: 1, borderColor: '#2a6b3a', paddingVertical: 10, alignItems: 'center' },
  tabActive: { borderColor: '#00ff66', backgroundColor: '#052a12' },
  tabText: { color: '#00ff66', fontFamily: 'Courier', fontSize: 10, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#00ff66', color: '#00ff66', fontFamily: 'Courier', padding: 12, marginBottom: 12 },
  warning: { color: '#2a6b3a', fontFamily: 'Courier', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  button: { borderWidth: 1, borderColor: '#00ff66', padding: 14, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#00ff66', fontFamily: 'Courier', fontWeight: 'bold' },
  link: { color: '#2a6b3a', fontFamily: 'Courier', fontSize: 12, textAlign: 'center', marginTop: 16 },
});