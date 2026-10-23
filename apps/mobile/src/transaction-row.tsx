import React from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { money, type Transaction } from "@cashflow/contracts";
import { Copy, IconTile, styles, useColors } from "./ui";

export function TransactionRow({
  item,
}: {
  item: Transaction & {
    account_name?: string;
    destination_name?: string;
    category_name?: string;
  };
}) {
  const c = useColors();
  const transfer = item.type === "transfer",
    income = item.type === "income";
  const label = transfer
    ? "Transfer rekening"
    : (item.category_name ?? (income ? "Pemasukan" : "Pengeluaran"));
  const icon = transfer
    ? "swap-horizontal-outline"
    : income
      ? "arrow-down-outline"
      : "arrow-up-outline";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${money(item.amount_minor)}, ${item.occurred_on}, dicatat ${item.actor_name}`}
      onPress={() =>
        router.push({ pathname: "/transaction", params: { id: item.id } })
      }
      style={({ pressed }) => [
        { paddingVertical: 14, gap: 5, opacity: pressed ? 0.62 : 1 },
        { borderBottomWidth: 1, borderBottomColor: c.border },
      ]}
    >
      <View style={styles.between}>
        <View style={[styles.row, styles.grow]}>
          <IconTile
            name={icon}
            tone={
              income
                ? "income"
                : item.type === "expense"
                  ? "expense"
                  : "primary"
            }
          />
          <View style={styles.grow}>
            <Text
              numberOfLines={1}
              style={{ color: c.text, fontSize: 16, fontWeight: "700" }}
            >
              {label}
            </Text>
            <Copy muted size={13}>
              {item.account_name ?? "Rekening"}
              {item.destination_name ? " → " + item.destination_name : ""}
            </Copy>
          </View>
        </View>
        <View style={{ alignItems: "flex-end", gap: 2 }}>
          <Text
            style={{
              color: income
                ? c.income
                : item.type === "expense"
                  ? c.expense
                  : c.text,
              fontSize: 16,
              fontWeight: "700",
              fontVariant: ["tabular-nums"],
            }}
          >
            {income ? "+" : item.type === "expense" ? "−" : ""}
            {money(item.amount_minor)}
          </Text>
          <Copy muted size={12}>
            {item.occurred_on.slice(8)}{" "}
            {new Intl.DateTimeFormat("id-ID", {
              month: "short",
              timeZone: "UTC",
            }).format(new Date(item.occurred_on))}
          </Copy>
        </View>
      </View>
      {item.note !== "" && (
        <Text
          numberOfLines={1}
          style={{ color: c.muted, fontSize: 13, lineHeight: 19 }}
        >
          {item.note}
        </Text>
      )}
      <Copy muted size={12}>
        Dicatat oleh {item.actor_name}
      </Copy>
      {item.fee_minor !== "0" && (
        <Copy muted size={12}>
          Termasuk biaya transfer {money(item.fee_minor)}
        </Copy>
      )}
    </Pressable>
  );
}
