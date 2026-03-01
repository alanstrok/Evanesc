import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TRPCProvider } from "../src/providers/TRPCProvider";

export default function RootLayout() {
  return (
    <TRPCProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#ffffff" },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="offers/[id]"
          options={{ headerShown: true, headerTitle: "", headerBackTitle: "Retour" }}
        />
        <Stack.Screen
          name="booking/confirm"
          options={{
            headerShown: true,
            headerTitle: "Confirmer",
            headerBackTitle: "Retour",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="auth/login"
          options={{ presentation: "modal" }}
        />
      </Stack>
    </TRPCProvider>
  );
}
