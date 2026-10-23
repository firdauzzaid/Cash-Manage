import React, { useRef } from "react";
import "./global.css";
import { Stack, usePathname } from "expo-router";
import { View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { authClient } from "../src/client";
import { Providers, useApp } from "../src/state";
import {
  Button,
  FeedbackBanner,
  LoadState,
  Screen,
  useColors,
} from "../src/ui";
function Root() {
  const initialized = useRef(false),
    c = useColors(),
    session = authClient.useSession(),
    state = useApp(),
    path = usePathname();
  if (!session.isPending) initialized.current = true;
  const user = !!session.data?.user,
    blocked =
      path !== "/reset-password" &&
      ((!initialized.current && session.isPending) || (user && !state.ready));
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View
        style={{ flex: 1, opacity: blocked ? 0 : 1 }}
        pointerEvents={blocked ? "none" : "auto"}
        accessibilityElementsHidden={blocked}
        importantForAccessibility={blocked ? "no-hide-descendants" : "auto"}
      >
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: c.bg },
            headerTintColor: c.text,
            contentStyle: { backgroundColor: c.bg },
            headerShadowVisible: false,
            headerBackTitle: "Kembali",
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Protected guard={!user}>
            <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={user}>
            <Stack.Screen
              name="choose-household"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="profile" options={{ title: "Akun saya" }} />
            <Stack.Screen
              name="invite/[id]"
              options={{ title: "Undangan keluarga" }}
            />
            <Stack.Protected guard={!!state.household}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="transaction"
                options={{
                  title: "Catat transaksi",
                  presentation: "modal",
                  headerBackButtonMenuEnabled: false,
                }}
              />
              <Stack.Screen
                name="manage"
                options={{
                  title: "Kelola keuangan",
                  headerBackButtonMenuEnabled: false,
                }}
              />
              <Stack.Screen
                name="report"
                options={{ title: "Laporan & ekspor" }}
              />
              <Stack.Screen
                name="audit"
                options={{ title: "Riwayat perubahan" }}
              />
            </Stack.Protected>
          </Stack.Protected>
          <Stack.Screen
            name="reset-password"
            options={{ title: "Atur ulang kata sandi" }}
          />
        </Stack>
      </View>
      {blocked && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: c.bg }]}>
          <Screen>
            <LoadState
              loading={!state.error}
              error={state.error}
              retry={state.refresh}
            />
            <Button
              label="Keluar"
              secondary
              onPress={() => void state.signout()}
            />
          </Screen>
        </View>
      )}
      {state.feedback && !blocked && (
        <View
          pointerEvents="box-none"
          style={[
            StyleSheet.absoluteFill,
            { justifyContent: "flex-end", paddingBottom: 82 },
          ]}
        >
          <SafeAreaView edges={["bottom"]} pointerEvents="box-none">
            <FeedbackBanner
              message={state.feedback.message}
              tone={state.feedback.tone}
              onDismiss={state.dismissFeedback}
            />
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}
export default function Layout() {
  return (
    <SafeAreaProvider>
      <Providers>
        <Root />
      </Providers>
    </SafeAreaProvider>
  );
}
