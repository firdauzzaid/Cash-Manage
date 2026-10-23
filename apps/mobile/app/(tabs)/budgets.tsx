import { withHousehold } from "../../src/household-screen";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { money, type Budget } from "@cashflow/contracts";
import { useApp, useHouseholdQuery } from "../../src/state";
import { currentMonth, monthAfter, Period } from "../../src/period";
import {
  Button,
  Card,
  Copy,
  LoadState,
  Screen,
  Title,
  styles,
  useColors,
} from "../../src/ui";
function Budgets() {
  const { household } = useApp(),
    c = useColors(),
    [month, setMonth] = useState(currentMonth(household!.timezone)),
    q = useHouseholdQuery<Budget[]>("budgets?month=" + month);
  return (
    <Screen title="Rencana untuk bulan ini">
      <Card style={{ backgroundColor: c.hero }}>
        <Text
          style={{
            color: c.onHero,
            fontSize: 22,
            lineHeight: 28,
            fontWeight: "700",
          }}
        >
          Atur uang sebelum digunakan
        </Text>
        <Text
          style={{
            color: c.onHero,
            opacity: 0.78,
            fontSize: 15,
            lineHeight: 22,
          }}
        >
          Sepakati batas kebutuhan keluarga. Biaya transfer ikut dihitung
          sebagai pengeluaran kategorinya.
        </Text>
        <Period month={month} onChange={setMonth} loading={q.isFetching} />
      </Card>
      <Button
        label="Tambah anggaran"
        icon="add-outline"
        onPress={() =>
          router.push({
            pathname: "/manage",
            params: { type: "budgets", create: "1", month },
          })
        }
      />
      <LoadState
        loading={q.isPending}
        error={q.error}
        retry={q.refetch}
        stale={!!q.data}
      />
      {q.data?.length === 0 && (
        <Card>
          <Title>Rencanakan kebutuhan pertama</Title>
          <Copy muted>
            Mulai dari belanja rumah atau tagihan rutin. Anggaran tidak
            memindahkan uang antar rekening.
          </Copy>
        </Card>
      )}
      {q.data?.map((b) => {
        const spent = BigInt(b.spent_minor),
          limit = BigInt(b.limit_minor),
          left = limit - spent,
          percent = Number((spent * 100n) / limit);
        return (
          <Card key={b.id}>
            <View style={styles.between}>
              <View style={{ gap: 3, flex: 1 }}>
                <Copy muted size={12}>
                  ANGGARAN
                </Copy>
                <Title>{b.category_name}</Title>
              </View>
              <Button
                secondary
                label="Ubah"
                onPress={() =>
                  router.push({
                    pathname: "/manage",
                    params: { type: "budgets", id: b.id, month },
                  })
                }
              />
            </View>
            <Copy>
              Terpakai {money(b.spent_minor)} dari {money(b.limit_minor)}
            </Copy>
            <View
              accessibilityRole="progressbar"
              accessibilityValue={{
                min: 0,
                max: 100,
                now: Math.min(100, percent),
                text: `${percent}% terpakai`,
              }}
              style={{
                height: 8,
                borderRadius: 4,
                backgroundColor: c.border,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: 8,
                  width: `${Math.min(100, percent)}%`,
                  backgroundColor:
                    left < 0n
                      ? c.expense
                      : percent >= 80
                        ? c.warning
                        : c.primary,
                }}
              />
            </View>
            <Copy bold>
              {left < 0n
                ? "Anggaran terlampaui " + money((-left).toString())
                : "Sisa " + money(left.toString())}
            </Copy>
            <Button
              secondary
              label="Lihat transaksi kategori"
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/transactions",
                  params: {
                    category_id: b.category_id,
                    from: month,
                    to: monthAfter(month, 1),
                  },
                })
              }
            />
          </Card>
        );
      })}
    </Screen>
  );
}

export default withHousehold(Budgets);
