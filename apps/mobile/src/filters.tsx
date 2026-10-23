import React, { useState } from "react";
import { View } from "react-native";
import type { Account, Category, Member } from "@cashflow/contracts";
import { Choice, DateField, Field, Button } from "./ui";
import { useApp, useHouseholdQuery } from "./state";
import { currentMonth, monthAfter } from "./period";
export type Filters = {
  from: string;
  to: string;
  account_id: string;
  category_id: string;
  type: string;
  created_by: string;
  search: string;
};
export function initialFilters(timezone: string): Filters {
  const from = currentMonth(timezone);
  return {
    from,
    to: monthAfter(from, 1),
    account_id: "",
    category_id: "",
    type: "",
    created_by: "",
    search: "",
  };
}
export function filterParams(filters: Filters) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) q.set(k, v);
  return q.toString();
}
export function FilterPanel({
  value,
  onChange,
}: {
  value: Filters;
  onChange: (f: Filters) => void;
}) {
  const [open, setOpen] = useState(false),
    { household } = useApp(),
    a = useHouseholdQuery<Account[]>("accounts"),
    c = useHouseholdQuery<Category[]>("categories"),
    m = useHouseholdQuery<Member[]>("recorders"),
    defaults = initialFilters(household!.timezone),
    activeCount = (Object.keys(value) as (keyof Filters)[]).filter(
      (key) => value[key] !== defaults[key],
    ).length;
  const set = (key: keyof Filters) => (v: string) =>
    onChange({ ...value, [key]: v });
  return (
    <View style={{ gap: 12 }}>
      <Field
        label="Cari catatan atau kategori"
        value={value.search}
        onChangeText={set("search")}
        placeholder="Contoh: belanja mingguan atau Transportasi"
        maxLength={100}
      />
      <Button
        label={
          open
            ? "Tutup filter"
            : activeCount
              ? `${activeCount} filter aktif · Ubah filter`
              : "Atur periode & filter"
        }
        secondary
        onPress={() => setOpen(!open)}
      />
      {open && (
        <>
          <DateField
            label="Tanggal mulai (termasuk)"
            value={value.from}
            onChange={set("from")}
          />
          <DateField
            label="Tanggal akhir (tidak termasuk)"
            value={value.to}
            onChange={set("to")}
          />
          <Choice
            label="Jenis"
            value={value.type}
            onChange={set("type")}
            options={[
              { id: "", name: "Semua jenis" },
              { id: "income", name: "Pemasukan" },
              { id: "expense", name: "Pengeluaran" },
              { id: "transfer", name: "Transfer" },
            ]}
          />
          <Choice
            label="Rekening"
            value={value.account_id}
            onChange={set("account_id")}
            options={[
              { id: "", name: "Semua rekening" },
              ...(a.data ?? []).map((x) => ({
                id: x.id,
                name: x.name + (x.archived_at ? " · Diarsipkan" : ""),
              })),
            ]}
          />
          <Choice
            label="Kategori"
            value={value.category_id}
            onChange={set("category_id")}
            options={[
              { id: "", name: "Semua kategori" },
              ...(c.data ?? []).map((x) => ({
                id: x.id,
                name: x.name + (x.archived_at ? " · Diarsipkan" : ""),
              })),
            ]}
          />
          <Choice
            label="Dicatat oleh"
            value={value.created_by}
            onChange={set("created_by")}
            options={[
              { id: "", name: "Semua pencatat" },
              ...(m.data ?? []).map((x) => ({
                id: x.profile_id,
                name: x.display_name,
              })),
            ]}
          />
          {activeCount > 0 && (
            <Button
              label="Hapus semua filter"
              secondary
              onPress={() => onChange(defaults)}
            />
          )}
        </>
      )}
    </View>
  );
}
