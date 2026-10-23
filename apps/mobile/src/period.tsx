import React from "react";
import { Text, View, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { today } from "@cashflow/contracts";
import { Copy, useColors } from "./ui";
export function currentMonth(timezone: string) {
  return today(timezone).slice(0, 7) + "-01";
}
export function monthAfter(month: string, delta: number) {
  const d = new Date(month + "T12:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 10);
}
export function monthParams(month: string) {
  return `from=${month}&to=${monthAfter(month, 1)}`;
}
export function Period({
  month,
  onChange,
  inverse = false,
}: {
  month: string;
  onChange: (m: string) => void;
  inverse?: boolean;
}) {
  const c = useColors();
  const foreground = inverse ? c.onHero : c.primary;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: 14,
        backgroundColor: inverse ? "rgba(255,255,255,0.11)" : c.soft,
        borderWidth: inverse ? 1 : 0,
        borderColor: inverse ? "rgba(255,255,255,0.13)" : "transparent",
        paddingHorizontal: 4,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Bulan sebelumnya"
        onPress={() => onChange(monthAfter(month, -1))}
        style={{
          minWidth: 46,
          minHeight: 46,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="chevron-back" size={21} color={foreground} />
      </Pressable>
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Ionicons name="calendar-outline" size={17} color={foreground} />
        <Text style={{ color: foreground, fontSize: 14, fontWeight: "700" }}>
          {new Intl.DateTimeFormat("id-ID", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          }).format(new Date(month))}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Bulan berikutnya"
        onPress={() => onChange(monthAfter(month, 1))}
        style={{
          minWidth: 46,
          minHeight: 46,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="chevron-forward" size={21} color={foreground} />
      </Pressable>
    </View>
  );
}
