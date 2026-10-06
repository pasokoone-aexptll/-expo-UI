import { LogoutProgress } from '@/components/logout-progress';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionProvider } from '@/mocks/session-provider';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SessionProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="map" options={{ animation: 'fade', gestureEnabled: false }} />
          </Stack>
          <LogoutProgress />
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
