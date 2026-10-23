import { withHousehold } from "../src/household-screen";
import React, { useState } from "react";
import { router } from "expo-router";
import { Platform, View } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { money, type Summary } from "@cashflow/contracts";
import { useApp, useHouseholdQuery } from "../src/state";
import { request } from "../src/client";
import { FilterPanel, filterParams, initialFilters } from "../src/filters";
import {
  Button,
  Card,
  Copy,
  LoadState,
  Notice,
  Screen,
  Title,
  styles,
} from "../src/ui";
function Report() {
  const { household } = useApp(),
    [filters, setFilters] = useState(initialFilters(household!.timezone)),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    q = useHouseholdQuery<Summary>(
      `summary?from=${filters.from}&to=${filters.to}`,
    );
  async function download() {
    setBusy(true);
    setMessage("");
    try {
      const csv = await request<string>(
        `/households/${household!.id}/export?${filterParams(filters)}`,
      );
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(
            new Blob([csv], { type: "text/csv;charset=utf-8" }),
          ),
          a = document.createElement("a");
        a.href = url;
        a.download = "cash-flow.csv";
        a.click();
        URL.revokeObjectURL(url);
      } else {
        if (!(await Sharing.isAvailableAsync()))
          throw new Error("Berbagi file tidak tersedia di perangkat ini.");
        const file = new File(Paths.cache, `cash-flow-${Date.now()}.csv`);
        try {
          file.create();
          file.write(csv);
          await Sharing.shareAsync(file.uri, {
            mimeType: "text/csv",
            UTI: "public.comma-separated-values-text",
          });
        } finally {
          if (file.exists) file.delete();
        }
      }
      setMessage(
        "Ekspor disiapkan. File yang dibagikan berada di luar kendali aplikasi.",
      );
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Ekspor gagal. Coba kembali.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen title="Laporan keluarga">
      <Card style={{ gap: 14 }}>
        <Title>Periode dan filter ekspor</Title>
        <Copy muted>
          Periode membentuk ringkasan di bawah. Filter lain hanya diterapkan
          pada file CSV.
        </Copy>
        <FilterPanel value={filters} onChange={setFilters} />
      </Card>
      <LoadState
        loading={q.isPending}
        error={q.error}
        retry={q.refetch}
        stale={!!q.data}
      />
      {q.data && (
        <>
          <Card>
            <Title>Arus kas periode</Title>
            <Copy muted>
              Ringkasan seluruh keluarga pada periode di atas. Filter rekening,
              kategori, jenis, pencatat, dan catatan diterapkan pada ekspor CSV.
            </Copy>
            <View style={styles.between}>
              <Copy>Pemasukan</Copy>
              <Copy bold>{money(q.data.income_minor)}</Copy>
            </View>
            <View style={styles.between}>
              <Copy>Pengeluaran</Copy>
              <Copy bold>{money(q.data.expense_minor)}</Copy>
            </View>
            <View style={styles.between}>
              <Copy>Selisih arus kas</Copy>
              <Copy bold>
                {money(
                  (
                    BigInt(q.data.income_minor) - BigInt(q.data.expense_minor)
                  ).toString(),
                )}
              </Copy>
            </View>
          </Card>
          <Title>Pengeluaran per kategori</Title>
          {q.data.categories.length === 0 && (
            <Copy muted>Belum ada pengeluaran pada periode ini.</Copy>
          )}
          {q.data.categories.map((c) => (
            <Card key={c.category_id}>
              <View style={styles.between}>
                <Copy bold>{c.name}</Copy>
                <Copy bold>{money(c.amount_minor)}</Copy>
              </View>
              <Button
                secondary
                label={`Telusuri ${c.name}`}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/transactions",
                    params: {
                      category_id: c.category_id,
                      from: filters.from,
                      to: filters.to,
                    },
                  })
                }
              />
            </Card>
          ))}
        </>
      )}
      <Title>Ekspor catatan</Title>
      <Copy muted>
        Satu baris untuk setiap transaksi, dengan nominal pokok, biaya, dan
        dampak arus kas. Maksimal 50.000 transaksi per ekspor.
      </Copy>
      {message !== "" && <Notice>{message}</Notice>}
      <Button
        label={busy ? "Menyiapkan ekspor…" : "Ekspor CSV sesuai filter"}
        disabled={busy}
        onPress={() => void download()}
      />
    </Screen>
  );
}

export default withHousehold(Report);
