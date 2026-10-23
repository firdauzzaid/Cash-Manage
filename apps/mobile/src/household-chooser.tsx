import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect, router } from "expo-router";
import { Action } from "./action";
import { useApp } from "./state";
import { useSave } from "./save";
import {
  Choice,
  Copy,
  Field,
  IconTile,
  Notice,
  SaveState,
  Title,
  useColors,
} from "./ui";

export function HouseholdChooser() {
  const { me, household, select, refresh, signout, notice } = useApp();
  const c = useColors();
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const save = useSave();
  if (household) return <Redirect href="/(tabs)/home" />;
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
            paddingTop: 18,
            paddingBottom: 44,
            gap: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.12)",
              }}
            >
              <Ionicons name="wallet-outline" size={22} color={c.onHero} />
            </View>
            <Text style={{ color: c.onHero, fontSize: 15, fontWeight: "700" }}>
              Cash Flow
            </Text>
          </View>
          <View style={{ gap: 6 }}>
            <Text
              accessibilityRole="header"
              style={{
                color: c.onHero,
                fontSize: 29,
                lineHeight: 35,
                fontWeight: "700",
                letterSpacing: -0.45,
              }}
            >
              Halo, {me?.display_name ?? ""}
            </Text>
            <Text
              style={{
                color: c.onHero,
                opacity: 0.72,
                fontSize: 15,
                lineHeight: 22,
              }}
            >
              Pilih ruang yang ingin Anda kelola, atau buat ruang baru untuk
              mulai mencatat bersama.
            </Text>
          </View>
        </View>
        <View
          style={{
            flex: 1,
            marginTop: -26,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: c.elevated,
            paddingHorizontal: 20,
            paddingTop: 28,
            paddingBottom: 38,
            gap: 28,
          }}
        >
          {notice && <Notice>{notice}</Notice>}
          <View style={{ gap: 12 }}>
            <Title>
              {me?.households.length ? "Ruang Anda" : "Mulai bersama"}
            </Title>
            <Copy muted>
              {me?.households.length
                ? "Setiap ruang menyimpan rekening dan catatan yang dibagikan kepada anggotanya."
                : "Buat ruang keuangan pertama untuk mencatat pemasukan, pengeluaran, dan anggaran keluarga."}
            </Copy>
            <View
              style={{
                borderTopWidth: me?.households.length ? 1 : 0,
                borderTopColor: c.border,
              }}
            >
              {me?.households.map((h) => (
                <Pressable
                  key={h.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${h.name} · ${h.role === "owner" ? "Pemilik" : "Anggota"}`}
                  onPress={() => select(h.id)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    minHeight: 74,
                    borderBottomWidth: 1,
                    borderBottomColor: c.border,
                    opacity: pressed ? 0.62 : 1,
                  })}
                >
                  <IconTile name="home-outline" />
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Text
                      numberOfLines={1}
                      style={{ color: c.text, fontSize: 16, fontWeight: "700" }}
                    >
                      {h.name}
                    </Text>
                    <Copy muted size={13}>
                      {h.role === "owner" ? "Pemilik ruang" : "Anggota ruang"}
                    </Copy>
                  </View>
                  <Ionicons name="chevron-forward" size={19} color={c.muted} />
                </Pressable>
              ))}
            </View>
          </View>
          {!!me?.invitations.length && (
            <View style={{ gap: 12 }}>
              <Title>Undangan untuk Anda</Title>
              {me.invitations.map((i) => (
                <View
                  key={i.id}
                  style={{
                    padding: 16,
                    gap: 10,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: c.border,
                    backgroundColor: c.surface,
                  }}
                >
                  <Copy bold>{i.household_name}</Copy>
                  <Copy muted size={14}>
                    Rekening dan catatan keuangan dibagikan kepada semua anggota
                    ruang ini.
                  </Copy>
                  <Action
                    label="Terima undangan"
                    path={`/invitations/${i.id}/accept`}
                    payload={{}}
                    question="Semua anggota dapat melihat dan mengelola catatan bersama. Bergabung dengan keluarga ini?"
                    done={async (result) => {
                      await refresh();
                      select(result.id);
                    }}
                  />
                </View>
              ))}
            </View>
          )}
          <View style={{ gap: 12 }}>
            <Title>Buat ruang baru</Title>
            <View
              style={{
                padding: 16,
                gap: 16,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: c.border,
                backgroundColor: c.surface,
              }}
            >
              <Field
                label="Nama keluarga"
                value={name}
                onChangeText={setName}
                maxLength={80}
                editable={!save.locked}
                placeholder="Contoh: Rumah Ayu & Dimas"
              />
              <Choice
                label="Zona waktu keluarga"
                value={timezone}
                onChange={setTimezone}
                disabled={save.locked}
                options={[
                  { id: "Asia/Jakarta", name: "WIB · Jakarta" },
                  { id: "Asia/Makassar", name: "WITA · Makassar" },
                  { id: "Asia/Jayapura", name: "WIT · Jayapura" },
                ]}
              />
              <Copy muted size={14}>
                Mata uang IDR. Zona waktu menentukan tanggal transaksi dan tidak
                dapat diubah pada versi ini.
              </Copy>
              <SaveState
                state={save}
                label="Buat keluarga"
                onPress={() =>
                  void save.save(
                    "/households",
                    { name, timezone },
                    "POST",
                    async (result) => {
                      await refresh();
                      select(result.id);
                    },
                    "Ruang keluarga berhasil dibuat.",
                  )
                }
              />
            </View>
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: c.border }}>
            {[
              {
                label: "Perbarui undangan",
                icon: "refresh-outline" as const,
                onPress: () => void refresh(),
              },
              {
                label: "Akun saya",
                icon: "person-outline" as const,
                onPress: () => router.push("/profile"),
              },
              {
                label: "Keluar dari akun",
                icon: "log-out-outline" as const,
                onPress: () => void signout(),
              },
            ].map((action) => (
              <Pressable
                key={action.label}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                onPress={action.onPress}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  minHeight: 54,
                  borderBottomWidth: 1,
                  borderBottomColor: c.border,
                  opacity: pressed ? 0.62 : 1,
                })}
              >
                <Ionicons
                  name={action.icon}
                  size={20}
                  color={
                    action.label === "Keluar dari akun" ? c.expense : c.primary
                  }
                />
                <Text
                  style={{
                    color:
                      action.label === "Keluar dari akun" ? c.expense : c.text,
                    flex: 1,
                    fontSize: 15,
                    fontWeight: "700",
                  }}
                >
                  {action.label}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={c.muted} />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
