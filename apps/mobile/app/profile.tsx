import React, { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useApp } from "../src/state";
import { Action } from "../src/action";
import {
  Button,
  Card,
  Copy,
  Field,
  IconTile,
  Notice,
  Screen,
  SectionTitle,
  Loading,
  styles,
  useColors,
} from "../src/ui";

export default function Profile() {
  const { me, household, select, signout } = useApp(),
    [password, setPassword] = useState(""),
    [requested, setRequested] = useState(false),
    c = useColors();
  if (!me)
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  return (
    <Screen title="Akun saya">
      <Card style={{ backgroundColor: c.hero }}>
        <View style={styles.row}>
          <IconTile name="person-outline" />
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.onHero, fontSize: 20, fontWeight: "700" }}>
              {me.display_name}
            </Text>
            <Text
              style={{
                color: c.onHero,
                opacity: 0.72,
                fontSize: 14,
                marginTop: 3,
              }}
            >
              {me.email}
            </Text>
          </View>
        </View>
        <Text style={{ color: c.onHero, opacity: 0.72, fontSize: 14 }}>
          Keluarga aktif: {household?.name ?? "Belum dipilih"}
        </Text>
      </Card>
      <Button
        label="Pilih atau buat keluarga lain"
        secondary
        icon="people-outline"
        onPress={() => {
          select(null);
          router.replace("/");
        }}
      />
      <Button
        label="Keluar dari akun"
        secondary
        icon="log-out-outline"
        onPress={() => void signout()}
      />
      <View style={styles.section}>
        <SectionTitle title="Penghapusan akun" />
      </View>
      <Card>
        <Copy>
          Catatan yang sudah dibagikan tetap disimpan untuk keluarga. Nama
          pencatat menjadi “Pengguna dihapus”. Akun login dan sesi Anda akan
          dihapus.
        </Copy>
        <Copy muted size={14}>
          Sebelum melanjutkan, alihkan kepemilikan atau hapus keluarga yang Anda
          miliki. Catatan bersama tetap menjadi data keluarga.
        </Copy>
        {requested ? (
          <Notice>
            Permintaan diterima. Akses akun dihentikan dan penghapusan diproses
            otomatis. Silakan keluar.
          </Notice>
        ) : (
          <>
            <Field
              label="Konfirmasi kata sandi saat ini"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
            />
            <Action
              label="Ajukan penghapusan akun"
              path="/me/deletion"
              payload={{ password }}
              question="Hapus identitas login Anda secara permanen dan pertahankan catatan bersama dengan nama Pengguna dihapus?"
              destructive
              done={() => {
                setRequested(true);
                setPassword("");
              }}
            />
          </>
        )}
      </Card>
    </Screen>
  );
}
