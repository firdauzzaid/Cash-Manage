import { withHousehold } from "../../src/household-screen";
import React, { useState } from "react";
import { Share, Text, View } from "react-native";
import * as Linking from "expo-linking";
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
    s = useSave(),
    c = useColors();
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
                  },
                )
              }
            />
            {link !== "" && (
              <>
                <Notice>
                  Tautan undangan dibuat. Bagikan kepada pemilik email tujuan.
                </Notice>
                <Copy size={14}>{link}</Copy>
                <Button
                  label="Bagikan undangan"
                  onPress={() =>
                    void Share.share({
                      message: `Bergabung dengan ${h.name} di Cash Flow. Semua catatan keuangan terlihat oleh anggota keluarga. ${link}`,
                    })
                  }
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
                    label="Bagikan tautan"
                    onPress={() =>
                      void Share.share({
                        message: Linking.createURL("invite/" + i.id),
                      })
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
        <Title>Kelola bersama</Title>
        <Button
          label="Rekening keluarga"
          secondary
          onPress={() =>
            router.push({ pathname: "/manage", params: { type: "accounts" } })
          }
        />
        <Button
          label="Kategori transaksi"
          secondary
          onPress={() =>
            router.push({ pathname: "/manage", params: { type: "categories" } })
          }
        />
        <Button
          label="Laporan & ekspor CSV"
          secondary
          onPress={() => router.push("/report")}
        />
        <Button
          label="Riwayat perubahan"
          secondary
          onPress={() => router.push("/audit")}
        />
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
