import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StripeProvider } from '@stripe/stripe-react-native';
import { onAuthStateChanged } from 'firebase/auth';

import LoginScreen from './src/screens/LoginScreen';
import MissionsScreen from './src/screens/MissionsScreen';
import LevelScreen from './src/screens/LevelScreen';
import ResultScreen from './src/screens/ResultScreen';
import FailScreen from './src/screens/FailScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import StoreScreen from './src/screens/StoreScreen';
import AccountScreen from './src/screens/AccountScreen';
import ThemeFX from './src/components/ThemeFX';

import { auth, getPlayerProfile } from './src/services/firebase';
import { useGameStore } from './src/store/useGameStore';
import { theme, THEMES, loadTheme, applyTheme, persistTheme } from './src/theme/theme';
import { STRIPE_PUBLISHABLE_KEY } from './src/config';

const Stack = createNativeStackNavigator();

export default function App() {
  const { user, loading, themeId, setUser, setProfile, setLoading, setThemeId, setIsAnonymous } = useGameStore();
  const [themeReady, setThemeReady] = useState(false);

  // Carga el tema guardado en el dispositivo
  useEffect(() => {
    loadTheme().then(() => {
      setThemeId(theme.id);
      setThemeReady(true);
    });
  }, []);

  // Si la cuenta tiene un tema elegido, lo restaura
  const restoreTheme = async (id) => {
    if (id && id !== theme.id && THEMES[id]) {
      applyTheme(id);
      await persistTheme(id);
      setThemeId(id);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAnonymous(firebaseUser ? firebaseUser.isAnonymous : true);

      if (firebaseUser) {
        const profile = await getPlayerProfile(firebaseUser.uid);
        // Si el perfil aún no existe, no se pisa con null
        if (profile) {
          setProfile(profile);
          restoreTheme(profile.selectedTheme);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading || !themeReady) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  const screenOptions = {
    headerStyle: { backgroundColor: theme.bg },
    headerTintColor: theme.primary,
    headerTitleStyle: { fontFamily: theme.font },
    contentStyle: { backgroundColor: theme.bg },
  };

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <NavigationContainer key={themeId}>
          <Stack.Navigator screenOptions={screenOptions}>
            {user ? (
              <>
                <Stack.Screen name="Missions" component={MissionsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Level" component={LevelScreen} options={{ title: 'Misión', gestureEnabled: false }} />
                <Stack.Screen name="Result" component={ResultScreen} options={{ headerShown: false, gestureEnabled: false }} />
                <Stack.Screen name="Fail" component={FailScreen} options={{ headerShown: false, gestureEnabled: false }} />
                <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Ranking' }} />
                <Stack.Screen name="Store" component={StoreScreen} options={{ title: 'Mercado Negro' }} />
                <Stack.Screen name="Account" component={AccountScreen} options={{ title: 'Cuenta' }} />
              </>
            ) : (
              <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            )}
          </Stack.Navigator>
        </NavigationContainer>

        <ThemeFX key={`fx-${themeId}`} />
      </View>
    </StripeProvider>
  );
}