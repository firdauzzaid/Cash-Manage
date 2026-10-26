import { withHousehold } from "../../src/household-screen";
import React, { useState } from "react";
import { Pressable, Share, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Linking from "expo-linking";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import type { Invitation, Member } from "@cashflow/contracts";
import { useApp, useHouseholdQuery } from "../../src/state";
import { useSave } from "../../src/save";
import { Action } from "../../src/action";
import {
  Button,
  Card,
  Copy,
  Field,
  LoadState,
  Notice,
  SaveState,
  Screen,
  Title,
  styles,
  useColors,
} from "../../src/ui";

function ManagementLink({
  label,
  description,
  icon,
  onPress,
  last = false,
}: {
  label: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  last?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${description}`}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 68,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        opacity: pressed ? 0.7 : 1,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: c.border,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: c.soft,
        }}
      >
        <Ionicons name={icon} size={20} color={c.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: "700" }}>
          {label}
        </Text>
        <Text style={{ color: c.muted, fontSize: 13, lineHeight: 18 }}>
          {description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={19} color={c.muted} />
    </Pressable>
  );
}

function Family() {
  const { household, me, select, refresh } = useApp(),
    h = household!,
    members = useHouseholdQuery<Member[]>("members"),
    invitations = useHouseholdQuery<Invitation[]>(
      h.role === "owner" ? "invitations" : "members",
    ),
    [email, setEmail] = useState(""),
    [name, setName] = useState(h.name),
    [confirmName, setConfirmName] = useState(""),
    [link, setLink] = useState(""),
    [sharing, setSharing] = useState(false),
    [shareMessage, setShareMessage] = useState<{
      text: string;
      error: boolean;
    } | null>(null),
    s = useSave(),
    c = useColors();
  async function shareInvitation(message: string) {
    if (sharing) return;
    setSharing(true);
    setShareMessage(null);
    try {
      await Share.share({ message });
    } catch {
      setShareMessage({
        error: true,
        text: "Undangan belum dapat dibagikan. Coba kembali.",
      });
    } finally {
      setSharing(false);
    }
  }
  async function copyInvitation(value: string) {
    setShareMessage(null);
    try {
      await Clipboard.setStringAsync(value);
      setShareMessage({ error: false, text: "Tautan undangan disalin." });
    } catch {
      setShareMessage({
        error: true,
        text: "Tautan belum dapat disalin. Coba kembali.",
      });
    }
  }
  return (
    <Screen title={h.name}>
      <Card style={{ backgroundColor: c.hero }}>
        <Text
          accessibilityRole="header"
          style={{
            color: c.onHero,
            fontSize: 22,
            lineHeight: 28,
            fontWeight: "700",
          }}
        >
          Ruang keuangan bersama
        </Text>
        <Text
          style={{
            color: c.onHero,
            opacity: 0.78,
            fontSize: 15,
            lineHeight: 22,
          }}
        >
          Semua anggota dapat melihat, mencatat, mengoreksi, dan mengekspor
          keuangan keluarga ini.
        </Text>
      </Card>
      <View style={styles.row}>
        <Button
          label="Ganti / tambah keluarga"
          secondary
          onPress={() => select(null)}
        />
        <Button
          label="Akun saya"
          secondary
          onPress={() => router.push("/profile")}
        />
      </View>
      <View style={{ gap: 3 }}>
        <Copy muted size={12}>
          ORANG DI DALAM RUANG INI
        </Copy>
        <Title>Anggota keluarga</Title>
      </View>
      <LoadState
        loading={members.isPending}
        error={members.error}
        retry={members.refetch}
        stale={!!members.data}
      />
      {members.data?.map((m) => (
        <Card key={m.id}>
          <Copy bold>
            {m.display_name}
            {m.profile_id === me!.id ? " · Anda" : ""}
          </Copy>
          <Copy muted>
            {m.role === "owner" ? "Pemilik keluarga" : "Anggota"}
          </Copy>
          {h.role === "owner" && m.role !== "owner" && (
            <>
              <Action
                label="Alihkan kepemilikan"
                path={`/households/${h.id}/transfer-owner`}
                payload={{ member_id: m.id, expected_version: m.version }}
                question={`Jadikan ${m.display_name} pemilik? Anda akan menjadi anggota dan tidak lagi mengelola anggota atau undangan.`}
                destructive
              />
              <Action
                label="Cabut akses anggota"
                path={`/households/${h.id}/revoke-member`}
                payload={{ member_id: m.id, expected_version: m.version }}
                question={`Cabut akses ${m.display_name}? Histori tetap disimpan. Data yang telah diekspor tidak dapat ditarik kembali.`}
                destructive
              />
            </>
          )}
        </Card>
      ))}
      {h.role === "owner" && (
        <>
          <View style={styles.section}>
            <Title>Undang anggota</Title>
            <Copy muted>
              Undangan berlaku 7 hari dan hanya dapat diterima oleh akun dengan
              email terverifikasi yang sesuai.
            </Copy>
            <Field
              label="Email anggota"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!s.locked}
            />
            <SaveState
              state={s}
              label="Buat tautan undangan"
              onPress={() =>
                void s.save(
                  `/households/${h.id}/invitations`,
                  { email },
                  "POST",
                  (r) => {
                    setLink(Linking.createURL("invite/" + r.id));
                    setEmail("");
                    setShareMessage(null);
                  },
                )
              }
            />
            {shareMessage && (
              <Notice error={shareMessage.error} success={!shareMessage.error}>
                {shareMessage.text}
              </Notice>
            )}
            {link !== "" && (
              <>
                <Notice>
                  Tautan undangan dibuat. Bagikan kepada pemilik email tujuan.
                </Notice>
                <Copy size={14}>{link}</Copy>
                <Button
                  label={sharing ? "Membuka pilihan…" : "Bagikan undangan"}
                  disabled={sharing}
                  onPress={() =>
                    void shareInvitation(
                      `Bergabung dengan ${h.name} di Cash Flow. Semua catatan keuangan terlihat oleh anggota keluarga. ${link}`,
                    )
                  }
                />
                <Button
                  label="Salin tautan"
                  secondary
                  onPress={() => void copyInvitation(link)}
                />
              </>
            )}
            <LoadState
              loading={invitations.isPending}
              error={invitations.error}
              retry={invitations.refetch}
              stale={!!invitations.data}
            />
            {(invitations.data ?? [])
              .filter((i) => i.status === "pending")
              .map((i) => (
                <Card key={i.id}>
                  <Copy>{i.email_normalized}</Copy>
                  <Copy muted size={14}>
                    Berlaku sampai{" "}
                    {new Date(i.expires_at).toLocaleDateString("id-ID")}
                  </Copy>
                  <Button
                    secondary
                    label={sharing ? "Membuka pilihan…" : "Bagikan tautan"}
                    disabled={sharing}
                    onPress={() =>
                      void shareInvitation(Linking.createURL("invite/" + i.id))
                    }
                  />
                  <Button
                    secondary
                    label="Salin tautan"
                    onPress={() =>
                      void copyInvitation(Linking.createURL("invite/" + i.id))
                    }
                  />
                  <Action
                    label="Cabut undangan"
                    path={`/households/${h.id}/revoke-invitation`}
                    payload={{
                      invitation_id: i.id,
                      expected_version: i.version,
                    }}
                    question="Tautan ini tidak lagi dapat diterima setelah dicabut."
                    destructive
                  />
                </Card>
              ))}
          </View>
          <View style={styles.section}>
            <Title>Pengaturan keluarga</Title>
            <Field
              label="Nama keluarga"
              value={name}
              onChangeText={setName}
              maxLength={80}
            />
            <Action
              label="Simpan nama keluarga"
              path={`/households/${h.id}/rename`}
              payload={{ name, expected_version: h.version }}
            />
            <Copy muted>
              Zona waktu {h.timezone} · Mata uang {h.currency}
            </Copy>
          </View>
        </>
      )}
      <View style={styles.section}>
        <Title>Kelola keuangan</Title>
        <Copy muted>
          Atur data yang dipakai bersama sebelum dan saat mencatat transaksi.
        </Copy>
        <View
          style={{
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: c.surface,
          }}
        >
          <ManagementLink
            label="Rekening keluarga"
            description="Atur bank, tunai, dan dompet digital."
            icon="wallet-outline"
            onPress={() =>
              router.push({
                pathname: "/manage",
                params: { type: "accounts" },
              })
            }
          />
          <ManagementLink
            label="Kategori transaksi"
            description="Atur label pemasukan dan pengeluaran."
            icon="pricetags-outline"
            onPress={() =>
              router.push({
                pathname: "/manage",
                params: { type: "categories" },
              })
            }
          />
          <ManagementLink
            label="Laporan & ekspor CSV"
            description="Tinjau ringkasan dan bagikan data terfilter."
            icon="bar-chart-outline"
            onPress={() => router.push("/report")}
          />
          <ManagementLink
            label="Riwayat perubahan"
            description="Lihat perubahan yang telah tercatat."
            icon="time-outline"
            onPress={() => router.push("/audit")}
            last
          />
        </View>
      </View>
      <View style={styles.section}>
        {h.role === "member" ? (
          <Action
            label="Keluar dari keluarga"
            path={`/households/${h.id}/leave`}
            payload={{}}
            question="Akses Anda berakhir. Catatan yang sudah dibagikan tetap tersimpan."
            destructive
            done={() => select(null)}
          />
        ) : (
          <>
            <Title>Hapus ruang keluarga</Title>
            <Copy muted>
              Seluruh anggota kehilangan akses. Catatan akan dinonaktifkan dan
              tidak dapat dipulihkan melalui aplikasi. Ini berbeda dari
              menghapus akun Anda.
            </Copy>
            <Field
              label={`Ketik nama keluarga: ${h.name}`}
              value={confirmName}
              onChangeText={setConfirmName}
            />
            {confirmName === h.name && (
              <Action
                label="Hapus keluarga ini"
                path={`/households/${h.id}/delete`}
                payload={{
                  confirm_name: confirmName,
                  expected_version: h.version,
                }}
                question="Nonaktifkan keluarga ini untuk seluruh anggota?"
                destructive
                done={async () => {
                  select(null);
                  await refresh();
                }}
              />
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

export default withHousehold(Family);
