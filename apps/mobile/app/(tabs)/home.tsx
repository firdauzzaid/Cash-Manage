import { withHousehold } from "../../src/household-screen";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  money,
  type Budget,
  type Summary,
  type Transaction,
} from "@cashflow/contracts";
import { useApp, useHouseholdQuery } from "../../src/state";
import { currentMonth, monthParams, Period } from "../../src/period";
import {
  Button,
  Card,
  Copy,
  IconTile,
  LoadState,
  Notice,
  SectionTitle,
  useColors,
} from "../../src/ui";
import { TransactionRow } from "../../src/transaction-row";

type CategoryTotal = Summary["categories"][number];

function visibleCategories(categories: CategoryTotal[], limit: number) {
  if (categories.length <= limit) return categories;
  const leading = categories.slice(0, limit - 1);
  const remainder = categories
    .slice(limit - 1)
    .reduce((total, category) => total + BigInt(category.amount_minor), 0n);
  return [
    ...leading,
    {
      category_id: "lainnya",
      name: "Lainnya",
      amount_minor: remainder.toString(),
    },
  ];
}

function CashFlowColumn({
  label,
  total,
  categories,
  icon,
  tone,
}: {
  label: string;
  total: string;
  categories: CategoryTotal[];
  icon: React.ComponentProps<typeof Ionicons>["name"];
  tone: "income" | "expense";
}) {
  const c = useColors();
  const amountColor = tone === "income" ? c.income : c.expense;
  return (
    <View style={{ flex: 1, gap: 10, minWidth: 0 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: tone === "income" ? c.successBg : c.dangerBg,
          }}
        >
          <Ionicons name={icon} size={17} color={amountColor} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            style={{
              color: c.muted,
              fontSize: 10,
              fontWeight: "700",
              letterSpacing: 0.55,
            }}
          >
            {label}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              color: c.text,
              fontSize: 15,
              lineHeight: 20,
              fontWeight: "700",
              fontVariant: ["tabular-nums"],
            }}
          >
            {money(total)}
          </Text>
        </View>
      </View>
      <View style={{ gap: 6 }}>
        {categories.length === 0 ? (
          <Copy muted size={12}>
            Belum ada catatan
          </Copy>
        ) : (
          categories.map((category) => (
            <View
              key={category.category_id}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 6,
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  color: c.muted,
                  flex: 1,
                  fontSize: 12,
                  lineHeight: 17,
                }}
              >
                {category.name}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  color: c.muted,
                  fontSize: 12,
                  lineHeight: 17,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {money(category.amount_minor)}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

function Home() {
  const { household, online, select } = useApp();
  const c = useColors();
  const [month, setMonth] = useState(currentMonth(household!.timezone));
  const summary = useHouseholdQuery<Summary>("summary?" + monthParams(month));
  const transactions = useHouseholdQuery<{ items: Transaction[] }>(
    "transactions?" + monthParams(month),
  );
  const budgets = useHouseholdQuery<Budget[]>("budgets?month=" + month);
  const budgetUsed = (budgets.data ?? []).reduce(
    (total, item) => total + BigInt(item.spent_minor),
    0n,
  );
  const budgetLimit = (budgets.data ?? []).reduce(
    (total, item) => total + BigInt(item.limit_minor),
    0n,
  );
  const budgetPercent =
    budgetLimit > 0n
      ? Math.min(100, Number((budgetUsed * 100n) / budgetLimit))
      : 0;
  const incomeCategories = visibleCategories(
    summary.data?.income_categories ?? [],
    3,
  );
  const expenseCategories = visibleCategories(
    summary.data?.categories ?? [],
    5,
  );
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: c.hero }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            width: "100%",
            maxWidth: 720,
            alignSelf: "center",
            backgroundColor: c.hero,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 46,
            gap: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pilih household"
              onPress={() => select(null)}
              style={({ pressed }) => ({
                flex: 1,
                minWidth: 0,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                accessibilityRole="header"
                numberOfLines={1}
                style={{
                  color: c.onHero,
                  fontSize: 25,
                  lineHeight: 30,
                  fontWeight: "700",
                  letterSpacing: -0.4,
                }}
              >
                {household!.name}
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
              >
                <Text
                  style={{
                    color: c.onHero,
                    opacity: 0.68,
                    fontSize: 10,
                    fontWeight: "700",
                    letterSpacing: 1,
                  }}
                >
                  RUMAH TANGGA
                </Text>
                <Ionicons name="chevron-down" size={14} color={c.onHero} />
              </View>
            </Pressable>
            <View style={{ flexDirection: "row", gap: 4 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Anggota household"
                onPress={() => router.push("/(tabs)/family")}
                style={({ pressed }) => ({
                  width: 42,
                  height: 42,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.65 : 1,
                })}
              >
                <Ionicons name="people-outline" size={22} color={c.onHero} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Profil saya"
                onPress={() => router.push("/profile")}
                style={({ pressed }) => ({
                  width: 42,
                  height: 42,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.65 : 1,
                })}
              >
                <Ionicons name="settings-outline" size={21} color={c.onHero} />
              </Pressable>
            </View>
          </View>
          <Period
            month={month}
            onChange={setMonth}
            inverse
            loading={summary.isFetching}
          />
          <View
            style={{ height: 1, backgroundColor: c.accent, opacity: 0.8 }}
          />
          {summary.isPending ? (
            <Text style={{ color: c.onHero, fontSize: 15, opacity: 0.75 }}>
              Memuat ringkasanâ€¦
            </Text>
          ) : summary.error && !summary.data ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Coba muat ringkasan lagi"
              onPress={() => void summary.refetch()}
            >
              <Text
                style={{ color: c.onHero, fontSize: 15, fontWeight: "700" }}
              >
                Ringkasan belum dapat dimuat. Ketuk untuk mencoba lagi.
              </Text>
            </Pressable>
          ) : summary.data ? (
            <View style={{ gap: 4 }}>
              <Text
                style={{
                  color: c.onHero,
                  opacity: 0.72,
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: 1,
                }}
              >
                SALDO SAAT INI
              </Text>
              <Text
                selectable
                style={{
                  color: c.onHero,
                  fontSize: 35,
                  lineHeight: 43,
                  fontWeight: "700",
                  letterSpacing: -0.9,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {money(summary.data.balance_minor)}
              </Text>
              <Text style={{ color: c.onHero, opacity: 0.66, fontSize: 13 }}>
                Total seluruh rekening household
              </Text>
            </View>
          ) : null}
        </View>
        <View
          style={{
            flex: 1,
            marginTop: -26,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: c.elevated,
            paddingHorizontal: 20,
            paddingTop: 27,
            paddingBottom: 38,
            gap: 28,
          }}
        >
          {!online && (
            <Notice>
              Anda sedang offline. Angka ini adalah pembacaan terakhir yang
              tersedia.
            </Notice>
          )}
          {online && summary.error && summary.data && (
            <Notice>
              Ringkasan belum diperbarui. Angka yang tampil adalah pembacaan
              terakhir.
            </Notice>
          )}
          {summary.data && (
            <View style={{ flexDirection: "row", gap: 16 }}>
              <CashFlowColumn
                label="PEMASUKAN"
                total={summary.data.income_minor}
                categories={incomeCategories}
                icon="arrow-up-outline"
                tone="income"
              />
              <View style={{ width: 1, backgroundColor: c.border }} />
              <CashFlowColumn
                label="PENGELUARAN"
                total={summary.data.expense_minor}
                categories={expenseCategories}
                icon="arrow-down-outline"
                tone="expense"
              />
            </View>
          )}
          <View style={{ gap: 12 }}>
            <SectionTitle
              title="Anggaran bulan ini"
              action={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Lihat semua anggaran"
                  onPress={() => router.push("/(tabs)/budgets")}
                >
                  <Copy bold size={13}>
                    Lihat semua
                  </Copy>
                </Pressable>
              }
            />
            <LoadState
              loading={budgets.isPending}
              error={budgets.error}
              retry={budgets.refetch}
              stale={!!budgets.data}
            />
            {budgets.data &&
              (budgets.data.length ? (
                <View
                  style={{
                    padding: 16,
                    gap: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: c.border,
                    backgroundColor: c.surface,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <Copy muted size={13}>
                      {budgets.data.length} kategori direncanakan
                    </Copy>
                    <Text
                      style={{
                        color: c.text,
                        flex: 1,
                        textAlign: "right",
                        fontSize: 14,
                        lineHeight: 20,
                        fontWeight: "700",
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      {money(budgetUsed.toString())} /{" "}
                      {money(budgetLimit.toString())}
                    </Text>
                  </View>
                  <View
                    accessibilityRole="progressbar"
                    accessibilityValue={{
                      min: 0,
                      max: 100,
                      now: budgetPercent,
                      text: `${budgetPercent}% terpakai`,
                    }}
                    style={{
                      height: 8,
                      borderRadius: 4,
                      overflow: "hidden",
                      backgroundColor: c.soft,
                    }}
                  >
                    <View
                      style={{
                        height: 8,
                        width: `${budgetPercent}%`,
                        backgroundColor: c.primary,
                      }}
                    />
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Copy muted size={12}>
                      {budgetPercent}% terpakai
                    </Copy>
                    <Copy muted size={12}>
                      Sisa {money((budgetLimit - budgetUsed).toString())}
                    </Copy>
                  </View>
                </View>
              ) : (
                <Card
                  style={{
                    shadowOpacity: 0,
                    borderWidth: 1,
                    borderColor: c.border,
                  }}
                >
                  <Copy muted>Belum ada anggaran untuk periode ini.</Copy>
                  <Button
                    label="Buat anggaran"
                    secondary
                    icon="add-outline"
                    onPress={() =>
                      router.push({
                        pathname: "/manage",
                        params: { type: "budgets", create: "1", month },
                      })
                    }
                  />
                </Card>
              ))}
          </View>
          <View style={{ gap: 12 }}>
            <SectionTitle
              title="Transaksi terbaru"
              action={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Lihat semua transaksi"
                  onPress={() => router.push("/(tabs)/transactions")}
                >
                  <Copy bold size={13}>
                    Lihat semua
                  </Copy>
                </Pressable>
              }
            />
            <LoadState
              loading={transactions.isPending}
              error={transactions.error}
              retry={transactions.refetch}
              stale={!!transactions.data}
            />
            {transactions.data?.items.length === 0 ? (
              <Card
                style={{
                  shadowOpacity: 0,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                <Copy muted>Belum ada transaksi pada periode ini.</Copy>
              </Card>
            ) : (
              <View style={{ borderTopWidth: 1, borderTopColor: c.border }}>
                {transactions.data?.items.slice(0, 4).map((item) => (
                  <TransactionRow key={item.id} item={item} />
                ))}
              </View>
            )}
          </View>
          <View style={{ gap: 12 }}>
            <SectionTitle
              title="Rekening"
              action={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Kelola rekening"
                  onPress={() =>
                    router.push({
                      pathname: "/manage",
                      params: { type: "accounts" },
                    })
                  }
                >
                  <Copy bold size={13}>
                    Kelola
                  </Copy>
                </Pressable>
              }
            />
            {summary.data?.accounts.length === 0 ? (
              <Card
                style={{
                  shadowOpacity: 0,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                <Copy>
                  Mulai dengan rekening pertama untuk melihat saldo yang
                  tercatat.
                </Copy>
                <Button
                  label="Tambah rekening"
                  icon="add-outline"
                  onPress={() =>
                    router.push({
                      pathname: "/manage",
                      params: { type: "accounts", create: "1" },
                    })
                  }
                />
              </Card>
            ) : (
              <View
                style={{
                  paddingHorizontal: 16,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: c.border,
                  backgroundColor: c.surface,
                }}
              >
                {summary.data?.accounts.map((account, index) => (
                  <View
                    key={account.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      paddingVertical: 13,
                      borderTopWidth: index ? 1 : 0,
                      borderTopColor: c.border,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <IconTile
                        name={
                          account.kind === "cash"
                            ? "cash-outline"
                            : account.kind === "ewallet"
                              ? "phone-portrait-outline"
                              : "business-outline"
                        }
                      />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          numberOfLines={1}
                          style={{
                            color: c.text,
                            fontSize: 15,
                            fontWeight: "700",
                          }}
                        >
                          {account.name}
                        </Text>
                        <Copy muted size={12}>
                          {account.archived_at
                            ? "Diarsipkan"
                            : account.kind === "cash"
                              ? "Tunai"
                              : account.kind === "ewallet"
                                ? "Dompet digital"
                                : "Bank"}
                        </Copy>
                      </View>
                    </View>
                    <Text
                      style={{
                        color: c.text,
                        fontSize: 14,
                        fontWeight: "700",
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      {money(account.balance_minor)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <Button
            label="Lihat laporan & ekspor"
            secondary
            icon="analytics-outline"
            onPress={() => router.push("/report")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default withHousehold(Home);
