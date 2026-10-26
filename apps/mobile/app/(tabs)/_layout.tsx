import React from "react";
import { Tabs, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";
import { useColors } from "../../src/ui";

const tabItems = {
  home: { label: "Beranda", icon: "home-outline" },
  transactions: { label: "Transaksi", icon: "list-outline" },
  budgets: { label: "Anggaran", icon: "pie-chart-outline" },
  family: { label: "Anggota", icon: "people-outline" },
} as const;

type HouseholdTabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>
>[0];

function HouseholdTabBar({
  state,
  navigateToTab,
  insets,
}: HouseholdTabBarProps) {
  const c = useColors();
  const tab = (route: (typeof state.routes)[number]) => {
    const item = tabItems[route.name as keyof typeof tabItems];
    const focused = state.routes[state.index].key === route.key;
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: focused }}
        onPress={() => !focused && navigateToTab(route.key)}
        style={({ pressed }) => ({
          flex: 1,
          minHeight: 56,
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          opacity: pressed ? 0.64 : 1,
        })}
      >
        <Ionicons
          name={item.icon}
          size={22}
          color={focused ? c.primary : c.muted}
        />
        <Text
          style={{
            color: focused ? c.primary : c.muted,
            fontSize: 10,
            fontWeight: focused ? "700" : "600",
          }}
        >
          {item.label}
        </Text>
      </Pressable>
    );
  };
  const [home, transactions, budgets, family] = state.routes;
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        minHeight: 70 + insets.bottom,
        paddingBottom: Math.max(8, insets.bottom),
        backgroundColor: c.surface,
        borderTopWidth: 1,
        borderTopColor: c.border,
        paddingHorizontal: 4,
      }}
    >
      {tab(home)}
      {tab(transactions)}
      <View
        style={{
          flex: 1,
          minHeight: 56,
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tambah transaksi"
          onPress={() => router.push("/transaction")}
          style={({ pressed }) => ({
            width: 52,
            height: 52,
            borderRadius: 26,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: c.primary,
            shadowColor: "#05251E",
            shadowOpacity: 0.22,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 5 },
            elevation: 5,
            opacity: pressed ? 0.78 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          <Ionicons name="add" size={29} color={c.onPrimary} />
        </Pressable>
        <Text
          style={{
            color: c.primary,
            fontSize: 10,
            lineHeight: 12,
            fontWeight: "700",
          }}
        >
          Catat
        </Text>
      </View>
      {tab(budgets)}
      {tab(family)}
    </View>
  );
}

export default function TabsLayout() {
  const c = useColors();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: c.bg },
        headerTintColor: c.text,
        headerShadowVisible: false,
      }}
      tabBar={(props) => <HouseholdTabBar {...props} />}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Beranda",
          headerShown: false,
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="home-outline"
              color={focused ? c.primary : c.muted}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transaksi",
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="list-outline"
              color={focused ? c.primary : c.muted}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: "Anggaran",
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="pie-chart-outline"
              color={focused ? c.primary : c.muted}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: "Anggota",
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="people-outline"
              color={focused ? c.primary : c.muted}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
