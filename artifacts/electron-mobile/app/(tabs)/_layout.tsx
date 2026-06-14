import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { SignInModal } from "@/components/SignInModal";
import { useSession } from "@/context/SessionContext";

function HeaderRight() {
  return <SignInModal />;
}

function HeaderTitle({ title }: { title: string }) {
  const colors = useColors();
  return (
    <View style={headerStyles.row}>
      <Text style={[headerStyles.appName, { color: colors.primary }]}>
        ⚡{" "}
      </Text>
      <Text style={[headerStyles.title, { color: colors.textPrimary }]}>
        {title}
      </Text>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  appName: { fontSize: 20, fontWeight: "800" },
  title: { fontSize: 18, fontWeight: "700" },
});

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "film", selected: "film.fill" }} />
        <Label>Movies</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="places">
        <Icon sf={{ default: "map", selected: "map.fill" }} />
        <Label>Places</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="spin">
        <Icon sf={{ default: "dice", selected: "dice.fill" }} />
        <Label>Spin</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  const commonHeaderOptions = {
    headerStyle: {
      backgroundColor: colors.background,
    },
    headerTintColor: colors.textPrimary,
    headerShadowVisible: false,
    headerRight: () => <HeaderRight />,
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: true,
        tabBarStyle: {
          position: "absolute" as const,
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.background },
              ]}
            />
          ) : null,
        ...commonHeaderOptions,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: () => <HeaderTitle title="Movies" />,
          tabBarLabel: "Movies",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="film" tintColor={color} size={24} />
            ) : (
              <Ionicons name="film-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="places"
        options={{
          headerTitle: () => <HeaderTitle title="Places" />,
          tabBarLabel: "Places",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="map" tintColor={color} size={24} />
            ) : (
              <Feather name="map-pin" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="spin"
        options={{
          headerTitle: () => <HeaderTitle title="Spin" />,
          tabBarLabel: "Spin",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="dice" tintColor={color} size={24} />
            ) : (
              <Ionicons name="shuffle-outline" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
