import React, { useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import * as Crypto from "expo-crypto";
import { money } from "@cashflow/contracts";
import { useApp } from "../src/state";
import { request } from "../src/client";
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
  confirm,
  styles,
  useColors,
} from "../src/ui";

type GmailStatus = {
  available: boolean;
  connected: boolean;
  gmail_address?: string;
  label_name?: string;
  status?: "active" | "revoked" | "error";
  last_synced_at?: string | null;
  last_error_code?: string | null;
  candidates: number;
};
type GmailCandidate = {
  id: string;
  amount_minor: string;
  occurred_on: string | null;
  note: string;
};

export default function Profile() {
  const { me, household, select, signout } = useApp(),
    [password, setPassword] = useState(""),
    [requested, setRequested] = useState(false),
    [gmailMessage, setGmailMessage] = useState<string | null>(null),
    [gmailBusy, setGmailBusy] = useState(false),
    { gmail } = useLocalSearchParams<{ gmail?: string }>(),
    c = useColors();
  const gmailStatus = useQuery({
    queryKey: ["gmail-status", me?.id],
    queryFn: () => request<GmailStatus>("/me/gmail"),
    enabled: !!me,
  });
  const gmailCandidates = useQuery({
    queryKey: ["gmail-candidates", me?.id],
    queryFn: () => request<GmailCandidate[]>("/me/gmail/candidates"),
    enabled: !!me && !!gmailStatus.data?.connected,
  });
  const connectGmail = async () => {
    setGmailBusy(true);
    try {
      const { authorization_url } = await request<{
        authorization_url: string;
      }>("/me/gmail/authorization", { method: "POST" });
      const result = await WebBrowser.openAuthSessionAsync(
        authorization_url,
        "cashflow://profile",
      );
      await gmailStatus.refetch();
      await gmailCandidates.refetch();
      setGmailMessage(
        result.type === "success" || gmail === "connected"
          ? "Gmail terhubung. Buat label Cash Flow di Gmail, lalu sinkronkan untuk mencari notifikasi yang diberi label tersebut."
          : "Koneksi Gmail belum selesai. Anda dapat mencoba lagi.",
      );
    } catch (error) {
      setGmailMessage(
        error instanceof Error
          ? error.message
          : "Gmail belum dapat dihubungkan.",
      );
    } finally {
      setGmailBusy(false);
    }
  };
  const syncGmail = async () => {
    setGmailBusy(true);
    try {
      const result = await request<{
        created: number;
        reason?: "LABEL_NOT_FOUND" | "SYNC_FAILED";
      }>("/me/gmail/sync", { method: "POST" });
      await Promise.all([gmailStatus.refetch(), gmailCandidates.refetch()]);
      setGmailMessage(
        result.created
          ? `${result.created} kandidat transaksi baru ditemukan. Periksa sebelum disimpan.`
          : result.reason === "LABEL_NOT_FOUND"
            ? "Label Cash Flow belum ditemukan. Buat label tersebut di Gmail, lalu coba lagi."
            : result.reason === "SYNC_FAILED"
              ? "Gmail belum dapat disinkronkan. Coba lagi atau hubungkan ulang Gmail."
              : "Belum ada notifikasi baru yang dapat dibaca.",
      );
    } catch (error) {
      setGmailMessage(
        error instanceof Error
          ? error.message
          : "Sinkronisasi Gmail belum berhasil.",
      );
    } finally {
      setGmailBusy(false);
    }
  };
  const rejectCandidate = async (id: string) => {
    if (
      !(await confirm(
        "Abaikan kandidat ini?",
        "Kandidat tidak akan dicatat sebagai transaksi dan tidak dapat dikembalikan.",
        "Abaikan kandidat",
        true,
      ))
    )
      return;
    setGmailBusy(true);
    try {
      await request(`/me/gmail/candidates/${id}/reject`, {
        method: "POST",
        headers: { "Idempotency-Key": Crypto.randomUUID() },
      });
      await gmailCandidates.refetch();
      setGmailMessage("Kandidat diabaikan.");
    } catch (error) {
      setGmailMessage(
        error instanceof Error
          ? error.message
          : "Kandidat belum dapat diabaikan.",
      );
    } finally {
      setGmailBusy(false);
    }
  };
  const disconnectGmail = async () => {
    if (
      !(await confirm(
        "Putuskan Gmail?",
        "Akses token dan seluruh kandidat Gmail yang belum ditinjau akan dihapus.",
        "Putuskan Gmail",
        true,
      ))
    )
      return;
    setGmailBusy(true);
    try {
      await request("/me/gmail", {
        method: "DELETE",
        headers: { "Idempotency-Key": Crypto.randomUUID() },
      });
      await Promise.all([gmailStatus.refetch(), gmailCandidates.refetch()]);
      setGmailMessage(
        "Gmail diputuskan dan kandidat yang belum ditinjau dihapus.",
      );
    } catch (error) {
      setGmailMessage(
        error instanceof Error
          ? error.message
          : "Gmail belum dapat diputuskan.",
      );
    } finally {
      setGmailBusy(false);
    }
  };
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
        <SectionTitle title="Notifikasi Gmail" />
      </View>
      <Card>
        <Copy>
          Gmail hanya membaca email yang Anda beri label {'"'}Cash Flow{'"'}.
          Notifikasi tidak pernah langsung menjadi transaksi.
        </Copy>
        {gmailMessage && <Notice>{gmailMessage}</Notice>}
        {gmailStatus.isError && (
          <Notice error>Koneksi Gmail belum tersedia. Coba lagi nanti.</Notice>
        )}
        {gmailStatus.data?.available === false ? (
          <Notice>
            Koneksi Gmail belum tersedia pada environment aplikasi ini.
          </Notice>
        ) : !gmailStatus.data?.connected ? (
          <Button
            label="Hubungkan Gmail"
            icon="mail-outline"
            disabled={gmailStatus.isPending || gmailBusy}
            onPress={() => void connectGmail()}
          />
        ) : (
          <>
            <Copy muted size={14}>
              Terhubung ke {gmailStatus.data.gmail_address} · Label:{" "}
              {gmailStatus.data.label_name}
            </Copy>
            {gmailStatus.data.status === "error" && (
              <>
                <Notice error>
                  {gmailStatus.data.last_error_code === "LABEL_NOT_FOUND"
                    ? "Label Cash Flow belum ditemukan di Gmail. Buat label tersebut, lalu coba sinkronkan lagi."
                    : "Sinkronisasi Gmail gagal. Coba sinkronkan lagi atau hubungkan ulang Gmail."}
                </Notice>
                <Button
                  secondary
                  label="Hubungkan ulang Gmail"
                  disabled={gmailBusy}
                  onPress={() => void connectGmail()}
                />
              </>
            )}
            <Button
              secondary
              label="Cari notifikasi baru"
              icon="sync-outline"
              disabled={gmailStatus.isFetching || gmailBusy}
              onPress={() => void syncGmail()}
            />
            <Button
              secondary
              danger
              label="Putuskan Gmail"
              icon="unlink-outline"
              disabled={gmailBusy}
              onPress={() => void disconnectGmail()}
            />
            {!!gmailCandidates.data?.length && (
              <View style={{ gap: 10 }}>
                <SectionTitle title="Perlu ditinjau" />
                {gmailCandidates.data.map((candidate) => (
                  <View key={candidate.id} style={{ gap: 6 }}>
                    <Copy>
                      {money(candidate.amount_minor)} ·{" "}
                      {candidate.occurred_on ?? "Tanggal belum terbaca"}
                    </Copy>
                    <Copy muted size={14}>
                      {candidate.note || "Nama transaksi belum terbaca"}
                    </Copy>
                    <Button
                      secondary
                      label="Tinjau & catat"
                      disabled={gmailBusy}
                      onPress={() =>
                        router.push({
                          pathname: "/transaction",
                          params: {
                            candidate_id: candidate.id,
                            candidate_amount_minor: candidate.amount_minor,
                            ...(candidate.occurred_on
                              ? { candidate_occurred_on: candidate.occurred_on }
                              : {}),
                            ...(candidate.note
                              ? { candidate_note: candidate.note }
                              : {}),
                          },
                        })
                      }
                    />
                    <Button
                      secondary
                      danger
                      label="Abaikan kandidat"
                      disabled={gmailBusy}
                      onPress={() => void rejectCandidate(candidate.id)}
                    />
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </Card>
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
