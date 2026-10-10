import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../services/firebase';
import { linkAnonymousAccount, authErrorMessage } from '../services/account';
import { resetDemo } from '../services/session';
import { useGameStore } from '../store/useGameStore';
import { theme, createStyles } from '../theme/theme';

export default function AccountScreen() {
  const { isAnonymous, setIsAnonymous, profile } = useGameStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const link = async () => {
    if (!email.trim()) {
      Alert.alert('Agente', 'Escribe tu correo.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Agente', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Agente', 'Las contraseñas no coinciden.');
      return;
    }
    try {
      setBusy(true);
      await linkAnonymousAccount(email.trim(), password);
      setIsAnonymous(false);
      Alert.alert(
        'Cuenta vinculada',
        'Tu progreso y tus compras ahora están protegidos. Podrás volver a entrar con tu correo.'
      );
    } catch (e) {
      console.error(e);
      Alert.alert('No se pudo vincular', authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const logout = () =>
    Alert.alert(
      'Cerrar sesión',
      isAnonymous
        ? 'Eres invitado: si sales, perderás este progreso y tus compras para siempre. Vincula un correo primero.'
        : 'Podrás volver a entrar con tu correo y tu contraseña.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: () => resetDemo() },
      ]
    );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{`> Agente ${profile?.codename ?? ''}`}</Text>

        {isAnonymous ? (
          <View>
            <View style={styles.alertBox}>
              <Text style={styles.alertTitle}>PROGRESO SIN PROTEGER</Text>
              <Text style={styles.alertText}>
                Eres invitado. Vincula un correo y tu progreso, créditos y compras quedarán a salvo para volver a
                entrar cuando quieras.
              </Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor={theme.dim}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor={theme.dim}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Repite la contraseña"
              placeholderTextColor={theme.dim}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.button} onPress={link} disabled={busy}>
              {busy ? <ActivityIndicator color={theme.primary} /> : <Text style={styles.buttonText}>VINCULAR CUENTA</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.okBox}>
            <Text style={styles.okTitle}>CUENTA PROTEGIDA</Text>
            <Text style={styles.okText}>{auth.currentUser?.email}</Text>
            <Text style={styles.alertText}>Tu progreso, créditos y compras se guardan en tu cuenta.</Text>
          </View>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>CERRAR SESIÓN</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = createStyles({
  container: { flex: 1, backgroundColor: '#000000' },
  title: { color: '#00ff66', fontFamily: 'Courier', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  alertBox: { borderWidth: 1, borderColor: '#ff3355', padding: 14, marginBottom: 16 },
  alertTitle: { color: '#ff3355', fontFamily: 'Courier', fontWeight: 'bold', marginBottom: 6 },
  alertText: { color: '#2a6b3a', fontFamily: 'Courier', fontSize: 12, lineHeight: 18 },
  okBox: { borderWidth: 1, borderColor: '#00ff66', backgroundColor: '#052a12', padding: 14, marginBottom: 16 },
  okTitle: { color: '#00ff66', fontFamily: 'Courier', fontWeight: 'bold', marginBottom: 6 },
  okText: { color: '#00ff66', fontFamily: 'Courier', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#00ff66', color: '#00ff66', fontFamily: 'Courier', padding: 12, marginBottom: 12 },
  button: { borderWidth: 1, borderColor: '#00ff66', padding: 14, alignItems: 'center' },
  buttonText: { color: '#00ff66', fontFamily: 'Courier', fontWeight: 'bold' },
  logoutBtn: { borderWidth: 1, borderColor: '#2a6b3a', padding: 12, alignItems: 'center', marginTop: 28 },
  logoutText: { color: '#2a6b3a', fontFamily: 'Courier', fontWeight: 'bold', fontSize: 12 },
});