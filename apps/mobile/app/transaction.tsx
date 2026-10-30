import { withHousehold } from "../src/household-screen";
import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import {
  today,
  money,
  type Account,
  type Category,
  type Transaction,
  type TransactionInput,
} from "@cashflow/contracts";
import { ApiError, request } from "../src/client";
import { useApp, useHouseholdQuery } from "../src/state";
import { useSave } from "../src/save";
import { useDraftGuard } from "../src/draft";
import { notificationDraft } from "../src/transaction-import";
import {
  AmountField,
  Button,
  Choice,
  Copy,
  DateField,
  Field,
  LoadState,
  Notice,
  SaveState,
  Screen,
  Title,
  confirm,
} from "../src/ui";
const fields = (t: Transaction): TransactionInput => ({
  type: t.type,
  account_id: t.account_id,
  destination_account_id: t.destination_account_id,
  category_id: t.category_id,
  amount_minor: t.amount_minor,
  fee_minor: t.fee_minor,
  fee_category_id: t.fee_category_id,
  occurred_on: t.occurred_on,
  note: t.note,
});
function TransactionForm() {
  const {
      id,
      candidate_id: candidateId,
      candidate_amount_minor: candidateAmount,
      candidate_occurred_on: candidateOccurredOn,
      candidate_note: candidateNote,
    } = useLocalSearchParams<{
      id?: string;
      candidate_id?: string;
      candidate_amount_minor?: string;
      candidate_occurred_on?: string;
      candidate_note?: string;
    }>(),
    { household, me } = useApp(),
    a = useHouseholdQuery<Account[]>("accounts"),
    c = useHouseholdQuery<Category[]>("categories"),
    s = useSave(),
    [version, setVersion] = useState(1),
    [saved, setSaved] = useState(false),
    [importOpen, setImportOpen] = useState(false),
    [notification, setNotification] = useState(""),
    [importMessage, setImportMessage] = useState<{
      text: string;
      error: boolean;
    } | null>(null),
    [candidateDateConfirmed, setCandidateDateConfirmed] = useState(
      !candidateId || !!candidateOccurredOn,
    ),
    initial = useRef("");
  const [form, setForm] = useState<TransactionInput>({
    type: "expense",
    account_id: "",
    destination_account_id: null,
    category_id: null,
    amount_minor: candidateAmount ?? "",
    fee_minor: "0",
    fee_category_id: null,
    occurred_on: candidateOccurredOn ?? today(household!.timezone),
    note: candidateNote ?? "",
  });
  const detail = useQuery({
    queryKey: ["household", me!.id, household!.id, "transaction", id],
    queryFn: () =>
      request<Transaction>(`/households/${household!.id}/transactions/${id}`),
    enabled: !!id,
    refetchInterval: false,
  });
  useEffect(() => {
    if (id && detail.data && !initial.current) {
      const f = fields(detail.data);
      setForm(f);
      setVersion(detail.data.version);
      initial.current = JSON.stringify(f);
    } else if (!id && !initial.current) {
      initial.current = JSON.stringify(form);
    }
  }, [detail.data]);
  const dirty =
    !saved && (s.uncertain || JSON.stringify(form) !== initial.current);
  useDraftGuard(dirty, s.uncertain);
  useEffect(() => {
    if (saved) router.back();
  }, [saved]);
  const set = <K extends keyof TransactionInput>(
    key: K,
    value: TransactionInput[K],
  ) => setForm((f) => ({ ...f, [key]: value }));
  const pasteNotification = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (!text.trim()) {
        setImportMessage({
          text: "Papan klip belum berisi notifikasi.",
          error: true,
        });
        return;
      }
      setNotification(text.slice(0, 5000));
      setImportMessage(null);
    } catch {
      setImportMessage({
        text: "Notifikasi tidak dapat ditempel dari papan klip. Tempelkan secara manual.",
        error: true,
      });
    }
  };
  const applyNotification = () => {
    const draft = notificationDraft(notification);
    if (draft.blocked) {
      setImportMessage({
        text: "Notifikasi ini tidak menunjukkan pembayaran berhasil atau berisi pengembalian dana. Periksa detailnya dan isi transaksi secara manual bila sesuai.",
        error: true,
      });
      return;
    }
    const hasNote = !!draft.note && !form.note.trim();
    if (!draft.amount_minor && !draft.occurred_on && !hasNote) {
      setImportMessage({
        text: "Nominal, tanggal, atau nama toko belum dapat dikenali. Isi formulir secara manual.",
        error: true,
      });
      return;
    }
    setForm((f) => ({
      ...f,
      ...(draft.amount_minor ? { amount_minor: draft.amount_minor } : {}),
      ...(draft.occurred_on ? { occurred_on: draft.occurred_on } : {}),
      ...(hasNote ? { note: draft.note! } : {}),
    }));
    setNotification("");
    setImportOpen(false);
    setImportMessage({
      text: "Periksa kembali hasilnya, lalu pilih jenis, rekening, dan kategori sebelum menyimpan.",
      error: false,
    });
  };
  const activeAccounts = (a.data ?? [])
    .filter(
      (x) =>
        !x.archived_at ||
        x.id === detail.data?.account_id ||
        x.id === detail.data?.destination_account_id,
    )
    .map((x) => ({
      id: x.id,
      name: x.name + (x.archived_at ? " · Diarsipkan" : ""),
    }));
  const categories = (kind: "income" | "expense", old?: string | null) =>
    (c.data ?? [])
      .filter((x) => x.kind === kind && (!x.archived_at || x.id === old))
      .map((x) => ({
        id: x.id,
        name: x.name + (x.archived_at ? " · Diarsipkan" : ""),
      }));
  const addCategory = (kind: "income" | "expense") =>
    router.push({
      pathname: "/manage",
      params: { type: "categories", create: "1", kind },
    });
  if (a.isPending || c.isPending || (id && detail.isPending))
    return (
      <Screen>
        <LoadState loading error={null} retry={() => {}} />
      </Screen>
    );
  if (a.error || c.error || detail.error)
    return (
      <Screen>
        <LoadState
          loading={false}
          error={a.error ?? c.error ?? detail.error}
          retry={() => {
            void a.refetch();
            void c.refetch();
            if (id) void detail.refetch();
          }}
        />
      </Screen>
    );
  const conflict =
    s.error instanceof ApiError && s.error.code === "VERSION_CONFLICT"
      ? (s.error.details?.current as Transaction)
      : null;
  return (
    <Screen title={id ? "Rincian & koreksi transaksi" : "Catat untuk keluarga"}>
      <Copy muted>{household!.name} · IDR</Copy>
      {!id && (
        <View style={{ gap: 12 }}>
          <Button
            secondary
            icon="document-text-outline"
            label="Isi dari notifikasi"
            disabled={s.locked}
            onPress={() => {
              setImportOpen((open) => !open);
              setImportMessage(null);
            }}
          />
          {importOpen && (
            <>
              <Notice>
                Tempel notifikasi pembayaran untuk mengisi nominal, tanggal,
                atau nama toko. Teks tidak dikirim atau disimpan.
              </Notice>
              <Field
                label="Notifikasi transaksi"
                value={notification}
                onChangeText={setNotification}
                placeholder="Tempel isi notifikasi di sini"
                multiline
                maxLength={5000}
                editable={!s.locked}
                style={{ minHeight: 120, textAlignVertical: "top" }}
              />
              <Button
                secondary
                icon="clipboard-outline"
                label="Tempel dari papan klip"
                disabled={s.locked}
                onPress={() => void pasteNotification()}
              />
              <Button
                icon="arrow-down-outline"
                label="Gunakan data yang terbaca"
                disabled={s.locked || !notification.trim()}
                onPress={applyNotification}
              />
            </>
          )}
          {importMessage && (
            <Notice error={importMessage.error}>{importMessage.text}</Notice>
          )}
        </View>
      )}
      {activeAccounts.length === 0 ? (
        <>
          <Notice>
            Tambahkan rekening terlebih dahulu untuk mencatat transaksi.
          </Notice>
          <Button
            label="Tambah rekening"
            onPress={() =>
              router.replace({
                pathname: "/manage",
                params: { type: "accounts", create: "1" },
              })
            }
          />
        </>
      ) : (
        <>
          <Choice
            label="Jenis transaksi"
            value={form.type}
            disabled={s.locked}
            options={[
              { id: "expense", name: "Pengeluaran" },
              { id: "income", name: "Pemasukan" },
              { id: "transfer", name: "Transfer rekening" },
            ]}
            onChange={(type) =>
              setForm((f) => ({
                ...f,
                type: type as TransactionInput["type"],
                category_id: null,
                destination_account_id: null,
                fee_minor: "0",
                fee_category_id: null,
              }))
            }
          />
          <AmountField
            label={form.type === "transfer" ? "Nominal transfer" : "Nominal"}
            value={form.amount_minor}
            onChange={(n) => set("amount_minor", n)}
            disabled={s.locked}
          />
          <Choice
            label={form.type === "transfer" ? "Dari rekening" : "Rekening"}
            value={form.account_id}
            options={activeAccounts}
            onChange={(n) => set("account_id", n)}
            disabled={s.locked}
          />
          {form.type === "transfer" ? (
            <>
              <Choice
                label="Ke rekening"
                value={form.destination_account_id ?? ""}
                options={activeAccounts.filter((x) => x.id !== form.account_id)}
                onChange={(n) => set("destination_account_id", n)}
                disabled={s.locked}
              />
              <AmountField
                label="Biaya transfer"
                value={form.fee_minor}
                onChange={(n) => {
                  set("fee_minor", n);
                  if (n === "0") set("fee_category_id", null);
                }}
                disabled={s.locked}
              />
              {form.fee_minor !== "" && form.fee_minor !== "0" && (
                <>
                  <Choice
                    label="Kategori biaya"
                    value={form.fee_category_id ?? ""}
                    options={categories(
                      "expense",
                      detail.data?.fee_category_id,
                    )}
                    onChange={(n) => set("fee_category_id", n)}
                    addLabel="Tambah kategori pengeluaran"
                    onAdd={() => addCategory("expense")}
                    disabled={s.locked}
                  />
                  {categories("expense", detail.data?.fee_category_id)
                    .length === 0 && (
                    <>
                      <Notice>
                        Buat kategori pengeluaran untuk mencatat biaya transfer.
                      </Notice>
                      <Button
                        label="Tambah kategori pengeluaran"
                        secondary
                        icon="add-outline"
                        onPress={() => addCategory("expense")}
                      />
                    </>
                  )}
                </>
              )}
              <Copy muted>
                Pokok transfer tidak dihitung sebagai pemasukan atau
                pengeluaran. Biaya mengurangi rekening asal.
              </Copy>
              {/^\d+$/.test(form.amount_minor) &&
                /^\d+$/.test(form.fee_minor) && (
                  <Notice>
                    Rekening asal berkurang{" "}
                    {money(
                      (
                        BigInt(form.amount_minor) + BigInt(form.fee_minor)
                      ).toString(),
                    )}
                    . Rekening tujuan bertambah {money(form.amount_minor)}.
                  </Notice>
                )}
            </>
          ) : (
            <>
              <Choice
                label="Kategori"
                value={form.category_id ?? ""}
                options={categories(form.type, detail.data?.category_id)}
                onChange={(n) => set("category_id", n)}
                addLabel={`Tambah kategori ${form.type === "income" ? "pemasukan" : "pengeluaran"}`}
                onAdd={() =>
                  addCategory(form.type === "income" ? "income" : "expense")
                }
                disabled={s.locked}
              />
              {categories(form.type, detail.data?.category_id).length === 0 && (
                <>
                  <Notice>
                    Belum ada kategori{" "}
                    {form.type === "income" ? "pemasukan" : "pengeluaran"}. Form
                    transaksi ini tetap tersedia saat Anda kembali.
                  </Notice>
                  <Button
                    label={`Tambah kategori ${form.type === "income" ? "pemasukan" : "pengeluaran"}`}
                    secondary
                    icon="add-outline"
                    onPress={() =>
                      addCategory(form.type === "income" ? "income" : "expense")
                    }
                  />
                </>
              )}
            </>
          )}
          <DateField
            label="Tanggal transaksi"
            value={form.occurred_on}
            onChange={(n) => {
              set("occurred_on", n);
              setCandidateDateConfirmed(true);
            }}
            disabled={s.locked}
          />
          {candidateId && !candidateDateConfirmed && (
            <Notice error>
              Tanggal tidak terbaca dari notifikasi. Pilih dan konfirmasi
              tanggal transaksi sebelum menyimpan.
            </Notice>
          )}
          <Field
            label="Catatan (opsional)"
            value={form.note}
            onChangeText={(n) => set("note", n)}
            maxLength={500}
            multiline
            editable={!s.locked}
          />
          <Copy muted size={14}>
            Dicatat oleh {detail.data?.actor_name ?? me!.display_name}
            {detail.data
              ? " · Dibuat " +
                new Date(detail.data.created_at).toLocaleString("id-ID")
              : ""}
          </Copy>
          <SaveState
            state={s}
            label={
              id
                ? "Simpan koreksi"
                : `Simpan ${form.type === "transfer" ? "transfer" : form.type === "income" ? "pemasukan" : "pengeluaran"}`
            }
            onPress={() => {
              if (candidateId && !candidateDateConfirmed) {
                setImportMessage({
                  text: "Pilih tanggal transaksi terlebih dahulu.",
                  error: true,
                });
                return;
              }
              void s.save(
                candidateId
                  ? `/households/${household!.id}/gmail-candidates/${candidateId}/transaction`
                  : `/households/${household!.id}/transactions${id ? "/" + id : ""}`,
                { ...form, ...(id ? { expected_version: version } : {}) },
                id ? "PUT" : "POST",
                () => setSaved(true),
                `${id ? "Koreksi transaksi" : form.type === "transfer" ? "Transfer" : form.type === "income" ? "Pemasukan" : "Pengeluaran"} berhasil disimpan.`,
              );
            }}
          />
          {conflict && (
            <View style={{ gap: 12 }}>
              <Title>Bandingkan perubahan</Title>
              <Copy>
                Server: {money(conflict.amount_minor)} · {conflict.occurred_on}{" "}
                · {conflict.note || "Tanpa catatan"}
              </Copy>
              <Copy>
                Isian Anda:{" "}
                {/^[0-9]+$/.test(form.amount_minor)
                  ? money(form.amount_minor)
                  : form.amount_minor}{" "}
                · {form.occurred_on} · {form.note || "Tanpa catatan"}
              </Copy>
              <Button
                secondary
                label="Muat versi server"
                onPress={() => {
                  setForm(fields(conflict));
                  setVersion(conflict.version);
                  initial.current = JSON.stringify(fields(conflict));
                  s.reset();
                }}
              />
              <Copy muted size={14}>
                Rekening, kategori, jenis, dan biaya juga mungkin telah berubah.
                Muat versi server, lalu lakukan koreksi kembali agar perubahan
                anggota lain tidak tertimpa.
              </Copy>
            </View>
          )}
          {id && (
            <Button
              danger
              label="Hapus transaksi"
              disabled={s.locked}
              onPress={async () => {
                if (
                  await confirm(
                    "Hapus transaksi " + money(detail.data!.amount_minor) + "?",
                    "Saldo dan anggaran akan diperbarui. Riwayat perubahan tetap disimpan.",
                    "Hapus transaksi",
                    true,
                  )
                )
                  void s.save(
                    `/households/${household!.id}/transactions/${id}`,
                    { expected_version: version },
                    "DELETE",
                    () => setSaved(true),
                    "Transaksi berhasil dihapus.",
                  );
              }}
            />
          )}
        </>
      )}
    </Screen>
  );
}

export default withHousehold(TransactionForm);
