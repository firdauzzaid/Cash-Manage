import { withHousehold } from "../src/household-screen";
import React from "react";
import { FlatList } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { money, type Audit } from "@cashflow/contracts";
import { useApp } from "../src/state";
import { request } from "../src/client";
import { Button, Card, Copy, LoadState, Screen } from "../src/ui";
const names: Record<string, string> = {
  created: "ditambahkan",
  updated: "diperbarui",
  deleted: "dihapus",
  archived: "diarsipkan",
  renamed: "diubah namanya",
  accepted: "diterima",
  revoked: "dicabut",
  left: "keluar",
  account_deleted: "akun dihapus",
  "transfer-owner": "kepemilikan dialihkan",
  "revoke-member": "akses dicabut",
};
const entities: Record<string, string> = {
  account: "Rekening",
  transaction: "Transaksi",
  category: "Kategori",
  budget: "Anggaran",
  household: "Keluarga",
  member: "Anggota",
  invitation: "Undangan",
};
const kinds: Record<string, string> = {
  income: "Pemasukan",
  expense: "Pengeluaran",
  transfer: "Transfer",
};
type AuditField = {
  label: string;
  before: string | null;
  after: string | null;
  format?: "kind" | "money";
};
function fields(changes: Record<string, unknown>): AuditField[] {
  if (!Array.isArray(changes.fields)) return [];
  return changes.fields.filter(
    (field): field is AuditField =>
      !!field &&
      typeof field === "object" &&
      "label" in field &&
      typeof field.label === "string" &&
      "before" in field &&
      "after" in field,
  );
}
function value(field: AuditField, item: "before" | "after") {
  const content = field[item];
  if (content === null) return "Tidak ada";
  if (field.format === "money") return money(content);
  if (field.format === "kind") return kinds[content] ?? content;
  return content;
}
function AuditScreen() {
  const { household, me } = useApp(),
    q = useInfiniteQuery({
      queryKey: ["household", me!.id, household!.id, "audit"],
      initialPageParam: null as string | null,
      queryFn: ({ pageParam }) =>
        request<{ items: Audit[]; next_cursor: string | null }>(
          `/households/${household!.id}/audit${pageParam ? "?cursor=" + encodeURIComponent(pageParam) : ""}`,
        ),
      getNextPageParam: (last) => last.next_cursor ?? undefined,
    });
  return (
    <Screen title="Riwayat perubahan">
      <Copy muted>
        {household!.role === "owner"
          ? "Aktivitas keuangan dan administrasi keluarga."
          : "Aktivitas perubahan keuangan bersama."}
      </Copy>
      <LoadState
        loading={q.isPending}
        error={q.error}
        retry={q.refetch}
        stale={!!q.data}
      />
      {q.data?.pages
        .flatMap((p) => p.items)
        .map((e) => {
          const details = fields(e.changes);
          return (
            <Card key={e.id}>
              <Copy bold>
                {entities[e.entity_type] ?? e.entity_type}{" "}
                {names[e.action] ?? e.action}
              </Copy>
              <Copy>{e.actor_name}</Copy>
              <Copy muted size={14}>
                {new Date(e.created_at).toLocaleString("id-ID")}
              </Copy>
              {details.length === 0 && e.changes.amount_minor !== undefined && (
                <Copy size={14}>
                  Nominal Rp{String(e.changes.amount_minor)}
                </Copy>
              )}
              {details.length === 0 && e.changes.name !== undefined && (
                <Copy size={14}>{String(e.changes.name)}</Copy>
              )}
              {e.changes.note_changed === true && (
                <Copy muted size={14}>
                  Catatan diperbarui
                </Copy>
              )}
              {details.map((field) => (
                <Copy key={field.label} size={14} muted>
                  {field.label}:{" "}
                  {field.before === null
                    ? value(field, "after")
                    : `${value(field, "before")} → ${value(field, "after")}`}
                </Copy>
              ))}
            </Card>
          );
        })}
      {q.hasNextPage && (
        <Button
          secondary
          label="Muat riwayat berikutnya"
          disabled={q.isFetchingNextPage}
          onPress={() => void q.fetchNextPage()}
        />
      )}
    </Screen>
  );
}

export default withHousehold(AuditScreen);
