import { withHousehold } from "../src/household-screen";
import React, { useEffect, useRef, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { currentMonth } from "../src/period";
import {
  today,
  type Account,
  type Budget,
  type Category,
} from "@cashflow/contracts";
import { useApp, useHouseholdQuery } from "../src/state";
import { useSave } from "../src/save";
import { useDraftGuard } from "../src/draft";
import {
  AmountField,
  Button,
  Choice,
  Copy,
  DateField,
  Field,
  LoadState,
  SaveState,
  Screen,
  Title,
  confirm,
  styles,
  useColors,
} from "../src/ui";

function CategoryList({
  title,
  items,
  month,
}: {
  title: string;
  items: Category[];
  month: string;
}) {
  const c = useColors();
  if (!items.length) return null;
  return (
    <View style={{ gap: 8 }}>
      <Text style={[styles.label, { color: c.muted }]}>{title}</Text>
      <View
        style={{
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: c.surface,
        }}
      >
        {items.map((category, index) => {
          const archived = !!category.archived_at;
          return (
            <Pressable
              key={category.id}
              accessibilityRole="button"
              accessibilityLabel={`${category.name}, ${category.kind === "expense" ? "pengeluaran" : "pemasukan"}, ${archived ? "diarsipkan" : "aktif"}`}
              onPress={() =>
                router.push({
                  pathname: "/manage",
                  params: { type: "categories", id: category.id, month },
                })
              }
              style={({ pressed }) => ({
                minHeight: 68,
                paddingHorizontal: 16,
                paddingVertical: 12,
                opacity: pressed ? 0.7 : 1,
                borderTopWidth: index ? 1 : 0,
                borderTopColor: c.border,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              })}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor:
                    category.kind === "expense" ? c.dangerBg : c.successBg,
                }}
              >
                <Ionicons
                  name={
                    category.kind === "expense"
                      ? "arrow-down-outline"
                      : "arrow-up-outline"
                  }
                  color={category.kind === "expense" ? c.expense : c.income}
                  size={20}
                />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text
                  numberOfLines={1}
                  style={{ color: c.text, fontSize: 16, fontWeight: "700" }}
                >
                  {category.name}
                </Text>
                <Text style={{ color: c.muted, fontSize: 13, lineHeight: 18 }}>
                  {category.kind === "expense" ? "Pengeluaran" : "Pemasukan"}
                  {archived
                    ? " · Tidak dipilih untuk transaksi baru"
                    : " · Dapat dipilih untuk transaksi baru"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={19} color={c.muted} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Manage() {
  const params = useLocalSearchParams<{
      type?: string;
      id?: string;
      create?: string;
      kind?: string;
      month?: string;
    }>(),
    type = ["accounts", "categories", "budgets"].includes(params.type ?? "")
      ? params.type!
      : "accounts",
    editing = !!params.id || params.create === "1",
    { household } = useApp(),
    month = params.month ?? currentMonth(household!.timezone),
    q = useHouseholdQuery<(Account | Category | Budget)[]>(
      type === "budgets" ? "budgets?month=" + month : type,
    ),
    categories = useHouseholdQuery<Category[]>("categories"),
    save = useSave(),
    [form, setForm] = useState<Record<string, any>>({
      name: "",
      kind:
        type === "accounts"
          ? "bank"
          : params.kind === "income"
            ? "income"
            : "expense",
      opening_balance_minor: "0",
      opening_date: today(household!.timezone),
      category_id: "",
      month_start: month,
      limit_minor: "",
    }),
    [version, setVersion] = useState(1),
    [done, setDone] = useState(false),
    initial = useRef("");
  const row = q.data?.find((x) => x.id === params.id);
  function load(r: any) {
    const f =
      type === "accounts"
        ? {
            name: r.name,
            kind: r.kind,
            opening_balance_minor: r.opening_balance_minor,
            opening_date: r.opening_date,
          }
        : type === "categories"
          ? { name: r.name, kind: r.kind }
          : {
              category_id: r.category_id,
              month_start: r.month_start,
              limit_minor: r.limit_minor,
            };
    setForm(f);
    setVersion(r.version);
    initial.current = JSON.stringify(f);
  }
  useEffect(() => {
    if (!initial.current) {
      if (row) load(row);
      else if (!params.id) initial.current = JSON.stringify(form);
    }
  }, [row]);
  useDraftGuard(
    editing &&
      !done &&
      (save.uncertain || JSON.stringify(form) !== initial.current),
    save.uncertain,
  );
  useEffect(() => {
    if (done) router.back();
  }, [done]);
  const set = (k: string) => (value: string) =>
    setForm((f) => ({ ...f, [k]: value }));
  const label =
    type === "accounts"
      ? "rekening"
      : type === "categories"
        ? "kategori"
        : "anggaran";
  const archived =
    type !== "budgets" &&
    !!(row as Account | Category | undefined)?.archived_at;
  const categoryItems = (q.data ?? []) as Category[];
  if (q.isPending || categories.isPending || q.error || categories.error)
    return (
      <Screen>
        <LoadState
          loading={q.isPending || categories.isPending}
          error={q.error ?? categories.error}
          retry={() => {
            void q.refetch();
            void categories.refetch();
          }}
        />
      </Screen>
    );
  if (params.id && !row)
    return (
      <Screen>
        <Copy>Data tidak lagi tersedia. Kembali dan muat ulang daftar.</Copy>
      </Screen>
    );
  if (!editing)
    return (
      <Screen title={`Kelola ${label}`}>
        <Copy muted>
          {type === "categories"
            ? "Kategori aktif dapat dipilih saat mencatat transaksi. Arsipkan bila tidak lagi digunakan tanpa menghapus histori."
            : "Tambah, tinjau, atau arsipkan data yang dipakai bersama keluarga."}
        </Copy>
        <Button
          label={`Tambah ${label}`}
          icon="add-outline"
          onPress={() =>
            router.push({
              pathname: "/manage",
              params: { type, create: "1", month },
            })
          }
        />
        {q.data?.length === 0 && <Copy muted>Belum ada {label}.</Copy>}
        {type === "categories" ? (
          <>
            <CategoryList
              title={`AKTIF (${categoryItems.filter((item) => !item.archived_at).length})`}
              items={categoryItems.filter((item) => !item.archived_at)}
              month={month}
            />
            <CategoryList
              title={`DIARSIPKAN (${categoryItems.filter((item) => item.archived_at).length})`}
              items={categoryItems.filter((item) => item.archived_at)}
              month={month}
            />
          </>
        ) : (
          q.data?.map((r: any) => (
            <Button
              key={r.id}
              secondary
              label={`${r.name ?? r.category_name}${r.archived_at ? " · Diarsipkan" : ""}`}
              onPress={() =>
                router.push({
                  pathname: "/manage",
                  params: { type, id: r.id, month },
                })
              }
            />
          ))
        )}
      </Screen>
    );
  return (
    <Screen title={`${params.id ? "Ubah" : "Tambah"} ${label}`}>
      <Copy muted>
        {type === "categories" && archived
          ? "Kategori ini tidak dapat dipilih untuk transaksi baru. Histori transaksi tetap menggunakan kategori ini."
          : type === "categories"
            ? "Kategori aktif dapat dipilih saat mencatat transaksi. Jenis kategori tidak dapat diubah setelah dibuat."
            : "Perubahan langsung terlihat bagi anggota keluarga yang memiliki akses."}
      </Copy>
      {type !== "budgets" && (
        <Field
          label={`Nama ${label}`}
          value={form.name}
          onChangeText={set("name")}
          maxLength={80}
          editable={!save.locked}
          placeholder={
            type === "accounts"
              ? "Contoh: Rekening Mandiri"
              : "Contoh: Belanja rumah"
          }
        />
      )}{" "}
      {type === "accounts" ? (
        <>
          <Choice
            label="Jenis rekening"
            value={form.kind}
            onChange={set("kind")}
            options={[
              {
                id: "bank",
                name: "Bank",
                description: "Rekening pada bank",
                icon: "business-outline",
              },
              {
                id: "cash",
                name: "Tunai",
                description: "Uang fisik yang dicatat manual",
                icon: "cash-outline",
              },
              {
                id: "ewallet",
                name: "Dompet digital",
                description: "Saldo pada aplikasi pembayaran",
                icon: "phone-portrait-outline",
              },
            ]}
            disabled={save.locked}
          />
          <AmountField
            label="Saldo awal"
            value={form.opening_balance_minor}
            onChange={set("opening_balance_minor")}
            signed
            disabled={save.locked}
          />
          <DateField
            label="Tanggal saldo awal"
            value={form.opening_date}
            onChange={set("opening_date")}
            disabled={save.locked}
          />
          <Copy muted>
            Saldo awal bukan pemasukan. Mengubahnya akan mengoreksi saldo
            tercatat saat ini.
          </Copy>
        </>
      ) : type === "categories" ? (
        <Choice
          label="Jenis kategori"
          value={form.kind}
          onChange={set("kind")}
          disabled={!!params.id || save.locked}
          options={[
            { id: "expense", name: "Pengeluaran" },
            { id: "income", name: "Pemasukan" },
          ]}
        />
      ) : (
        <>
          <Choice
            label="Kategori pengeluaran"
            value={form.category_id}
            onChange={set("category_id")}
            disabled={save.locked}
            options={(categories.data ?? [])
              .filter(
                (c) =>
                  c.kind === "expense" &&
                  (!c.archived_at || c.id === (row as Budget)?.category_id),
              )
              .map((c) => ({ id: c.id, name: c.name }))}
          />
          <DateField
            label="Periode (tanggal pertama bulan)"
            value={form.month_start}
            onChange={(s) => set("month_start")(s.slice(0, 7) + "-01")}
            disabled={save.locked}
          />
          <AmountField
            label="Batas anggaran bulanan"
            value={form.limit_minor}
            onChange={set("limit_minor")}
            disabled={save.locked}
          />
          <Copy muted>
            Anggaran tidak bergulir otomatis ke bulan berikutnya.
          </Copy>
        </>
      )}
      <SaveState
        state={save}
        label={`Simpan ${label}`}
        onPress={() =>
          void save.save(
            `/households/${household!.id}/${type}${params.id ? "/" + params.id : ""}`,
            { ...form, ...(params.id ? { expected_version: version } : {}) },
            params.id ? "PUT" : "POST",
            () => setDone(true),
            `${label} berhasil disimpan.`,
          )
        }
      />
      {save.error && params.id && (
        <Button
          label="Buang isian & muat versi terbaru"
          secondary
          onPress={async () => {
            if (
              await confirm(
                "Muat ulang data?",
                "Isian Anda akan diganti dengan versi terbaru.",
                "Muat versi terbaru",
              )
            ) {
              const r = await q.refetch();
              const latest = r.data?.find((x) => x.id === params.id);
              if (latest) {
                load(latest);
                save.reset();
              }
            }
          }}
        />
      )}
      {params.id && type === "categories" && archived && (
        <Button
          label="Aktifkan kembali kategori"
          secondary
          disabled={save.locked}
          onPress={() =>
            void save.save(
              `/households/${household!.id}/categories/${params.id}`,
              { ...form, expected_version: version, restore: true },
              "PUT",
              () => setDone(true),
              "Kategori kembali aktif dan dapat dipilih untuk transaksi baru.",
            )
          }
        />
      )}
      {params.id && !archived && (
        <Button
          danger
          label={
            type === "budgets"
              ? "Hapus anggaran"
              : type === "categories"
                ? "Nonaktifkan kategori"
                : `Arsipkan ${label}`
          }
          disabled={save.locked}
          onPress={async () => {
            if (
              await confirm(
                `${type === "budgets" ? "Hapus" : type === "categories" ? "Nonaktifkan" : "Arsipkan"} ${label}?`,
                type === "budgets"
                  ? "Batas anggaran ini dihapus. Transaksi dan riwayat tetap disimpan."
                  : type === "categories"
                    ? "Kategori tidak lagi dapat dipilih untuk transaksi baru. Transaksi dan anggaran yang sudah ada tetap tersimpan."
                    : "Histori dan saldo dipertahankan. Item ini tidak dapat dipilih untuk transaksi baru.",
                type === "budgets"
                  ? "Hapus anggaran"
                  : type === "categories"
                    ? "Nonaktifkan kategori"
                    : `Arsipkan ${label}`,
                true,
              )
            )
              void save.save(
                `/households/${household!.id}/${type}/${params.id}`,
                { expected_version: version },
                "DELETE",
                () => setDone(true),
                `${type === "budgets" ? "Anggaran" : label} berhasil ${type === "budgets" ? "dihapus" : type === "categories" ? "dinonaktifkan" : "diarsipkan"}.`,
              );
          }}
        />
      )}
    </Screen>
  );
}

export default withHousehold(Manage);
