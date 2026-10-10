import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPlayerProfile } from '../services/firebase';
import { buyProduct, CHAPTER2_PRICE, PACKS } from '../services/payments';
import { buyCharge, buyTheme, CHARGE_PRICE, recordPurchase, selectTheme } from '../services/store';
import { useGameStore } from '../store/useGameStore';
import { applyTheme, createStyles, persistTheme, theme, THEMES } from '../theme/theme';

function Item({ title, desc, label, onPress, disabled, active, swatches, badge }) {
  return (
    <View style={[styles.item, active && styles.itemActive]}>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={styles.itemTitle}>{title}</Text>
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        <Text style={styles.itemDesc}>{desc}</Text>
        {swatches ? (
          <View style={styles.swatchRow}>
            {swatches.map((c, i) => (
              <View key={i} style={[styles.swatch, { backgroundColor: c }]} />
            ))}
          </View>
        ) : null}
      </View>
      <TouchableOpacity
        style={[styles.itemBtn, disabled && { opacity: 0.35 }]}
        disabled={disabled}
        onPress={onPress}
      >
        <Text style={styles.itemBtnText}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function StoreScreen( {navigation} ) {
  const { user, profile, setProfile, setThemeId, isAnonymous } = useGameStore();
  const [busy, setBusy] = useState(false);

  const credits = profile?.credits ?? 0;
  const charges = profile?.decryptCharges ?? 0;
  const unlocked = ['matrix', ...(profile?.unlockedThemes ?? [])];
  const hasChapter2 = (profile?.unlockedChapters ?? []).includes('ch2');

  const refresh = async () => setProfile(await getPlayerProfile(user.uid));

  const run = async (action, after) => {
    try {
      setBusy(true);
      await action();
      await refresh();
      if (after) after();
    } catch (e) {
      if (e.message === 'NO_CREDITS') {
        Alert.alert('Créditos insuficientes', 'Completa misiones o adquiere más créditos.');
      } else {
        console.error(e);
        Alert.alert('Error', 'Inténtalo de nuevo.');
      }
    } finally {
      setBusy(false);
    }
  };

  const doPay = async (productId) => {
    try {
      setBusy(true);
      const product = await buyProduct(productId);
      await recordPurchase(user.uid, product.paymentIntentId, product);
      await refresh();
      Alert.alert(
        'Gracias por tu compra',
        product.type === 'chapter'
          ? 'Capítulo 2 desbloqueado. Ya puedes jugarlo desde Misiones.'
          : `Se agregaron ${product.credits} créditos a tu cuenta.`
      );
    } catch (e) {
      if (e.message !== 'CANCELED') {
        console.error(e);
        Alert.alert('No se pudo completar el pago', e.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const pay = (productId) => {
    if (!isAnonymous) {
      doPay(productId);
      return;
    }
    Alert.alert(
      'Protege tu compra',
      'Eres invitado: si cierras sesión perderías lo que compres. Vincula un correo antes de pagar.',
      [
        { text: 'Vincular cuenta', onPress: () => navigation.navigate('Account') },
        { text: 'Comprar de todos modos', style: 'destructive', onPress: () => doPay(productId) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const useTheme = async (id) => {
    applyTheme(id);
    await persistTheme(id);
    setThemeId(id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.wallet}>CRÉDITOS: {credits}   |   CARGAS: {charges}</Text>
        {busy && <ActivityIndicator color={theme.primary} style={{ marginBottom: 12 }} />}

        <Text style={styles.section}>{'> EXPANSIONES'}</Text>
        <Item
          title="Capítulo 2: Protocolo Cero"
          badge="3 EPISODIOS NUEVOS"
          desc="La traición viene de dentro. Triangula señales, estabiliza el enlace y enfrenta el final de la historia."
          label={hasChapter2 ? 'ADQUIRIDO' : CHAPTER2_PRICE}
          disabled={busy || hasChapter2}
          active={hasChapter2}
          onPress={() => pay('ch2')}
        />

        <Text style={styles.section}>{'> CRÉDITOS'}</Text>
        {PACKS.map((p) => (
          <Item
            key={p.id}
            title={p.name}
            desc={`${p.credits} créditos · ${p.note}`}
            label={p.price}
            disabled={busy}
            onPress={() => pay(p.id)}
          />
        ))}

        <Text style={styles.section}>{'> CONSUMIBLES'}</Text>
        <Item
          title="Carga de descifrado"
          desc="Resuelve una misión al instante (sin créditos ni ranking). Se usa desde la misión."
          label={`${CHARGE_PRICE} CR`}
          disabled={busy}
          onPress={() => run(() => buyCharge(user.uid))}
        />

        <Text style={styles.section}>{'> TEMAS DE TERMINAL'}</Text>
        {Object.entries(THEMES).map(([id, t]) => {
          const isActive = theme.id === id;
          const isOwned = unlocked.includes(id);
          return (
            <Item
              key={id}
              title={t.name}
              desc={isOwned ? 'Desbloqueado' : `Cosmético: ${t.price} créditos`}
              swatches={[t.colors.primary, t.colors.dim, t.colors.danger, t.colors.bg]}
              active={isActive}
              label={isActive ? 'EN USO' : isOwned ? 'USAR' : `${t.price} CR`}
              disabled={busy || isActive}
              onPress={() =>
                isOwned
                  ? run(() => selectTheme(user.uid, id), () => useTheme(id))
                  : run(() => buyTheme(user.uid, id, t.price))
              }
            />
          );
        })}

        <Text style={styles.footer}>Pagos procesados de forma segura por Stripe.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = createStyles({
  container: { flex: 1, backgroundColor: '#000000' },
  wallet: { color: '#00ff66', fontFamily: 'Courier', fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  section: { color: '#2a6b3a', fontFamily: 'Courier', marginTop: 16, marginBottom: 8, fontSize: 12 },
  item: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#2a6b3a', padding: 12, marginBottom: 10 },
  itemActive: { borderColor: '#00ff66', backgroundColor: '#052a12' },
  itemTitle: { color: '#00ff66', fontFamily: 'Courier', fontWeight: 'bold' },
  badge: { color: '#ff3355', fontFamily: 'Courier', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  itemDesc: { color: '#2a6b3a', fontFamily: 'Courier', fontSize: 12, marginTop: 4 },
  itemBtn: { borderWidth: 1, borderColor: '#00ff66', paddingVertical: 8, paddingHorizontal: 12 },
  itemBtnText: { color: '#00ff66', fontFamily: 'Courier', fontWeight: 'bold', fontSize: 12 },
  swatchRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  swatch: { width: 22, height: 22, borderWidth: 1, borderColor: '#555555' },
  footer: { color: '#2a6b3a', fontFamily: 'Courier', fontSize: 11, textAlign: 'center', marginTop: 20 },
});