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
  status?: "active" | "revoked" | "error";
  last_synced_at?: string | null;
  last_error_code?: string | null;
  history_complete?: boolean;
  history_checked_count?: number;
  history_total_estimate?: number | null;
  candidates: number;
};
type GmailCandidate = {
  id: string;
  amount_minor: string;
  occurred_on: string | null;
  note: string;
};
type GmailMessage = {
  text: string;
  tone: "error" | "info" | "success";
};

export default function Profile() {
  const { me, household, select, signout } = useApp(),
    [password, setPassword] = useState(""),
    [requested, setRequested] = useState(false),
    [gmailMessage, setGmailMessage] = useState<GmailMessage | null>(null),
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
  const pendingCandidates =
    gmailCandidates.data?.length ?? gmailStatus.data?.candidates ?? 0;
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
          ? {
              text: "Gmail terhubung. Cash Flow mulai memeriksa email yang tampak seperti notifikasi transaksi.",
              tone: "success",
            }
          : {
              text: "Koneksi Gmail belum selesai. Anda dapat mencoba lagi.",
              tone: "info",
            },
      );
    } catch (error) {
      setGmailMessage({
        text:
          error instanceof Error
            ? error.message
            : "Gmail belum dapat dihubungkan.",
        tone: "error",
      });
    } finally {
      setGmailBusy(false);
    }
  };
  const syncGmail = async () => {
    setGmailBusy(true);
    try {
      const result = await request<{
        created: number;
        scanned: number;
        history_complete: boolean;
        reason?:
          | "TOKEN_REVOKED"
          | "RATE_LIMITED"
          | "GOOGLE_UNAVAILABLE"
          | "HISTORY_EXPIRED"
          | "SYNC_FAILED";
      }>("/me/gmail/sync", { method: "POST" });
      await Promise.all([gmailStatus.refetch(), gmailCandidates.refetch()]);
      setGmailMessage(
        result.created
          ? {
              text: `${result.created} kandidat transaksi ditemukan dari ${result.scanned} email. Periksa sebelum disimpan.`,
              tone: "success",
            }
          : result.reason === "TOKEN_REVOKED"
            ? {
                text: "Izin Gmail sudah tidak berlaku. Hubungkan ulang Gmail untuk melanjutkan pencarian.",
                tone: "error",
              }
            : result.reason === "RATE_LIMITED"
              ? {
                  text: "Gmail membatasi pencarian sementara. Tunggu beberapa menit, lalu coba lagi.",
                  tone: "info",
                }
              : result.reason === "GOOGLE_UNAVAILABLE"
                ? {
                    text: "Layanan Gmail sedang tidak tersedia. Coba sinkronkan lagi nanti.",
                    tone: "info",
                  }
                : result.reason === "HISTORY_EXPIRED"
                  ? {
                      text: "Riwayat Gmail sudah terlalu lama. Cash Flow akan memulai pencarian histori lagi.",
                      tone: "info",
                    }
                  : result.reason === "SYNC_FAILED"
                    ? {
                        text: "Gmail belum dapat disinkronkan. Coba lagi atau hubungkan ulang Gmail.",
                        tone: "error",
                      }
                    : {
                        text: result.history_complete
                          ? "Belum ada email transaksi baru yang dapat dibaca."
                          : `${result.scanned} email diperiksa. Sinkronkan lagi untuk melanjutkan histori.`,
                        tone: "info",
                      },
      );
    } catch (error) {
      setGmailMessage({
        text:
          error instanceof Error
            ? error.message
            : "Sinkronisasi Gmail belum berhasil.",
        tone: "error",
      });
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
      setGmailMessage({ text: "Kandidat diabaikan.", tone: "success" });
    } catch (error) {
      setGmailMessage({
        text:
          error instanceof Error
            ? error.message
            : "Kandidat belum dapat diabaikan.",
        tone: "error",
      });
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
      setGmailMessage({
        text: "Gmail diputuskan dan kandidat yang belum ditinjau dihapus.",
        tone: "success",
      });
    } catch (error) {
      setGmailMessage({
        text:
          error instanceof Error
            ? error.message
            : "Gmail belum dapat diputuskan.",
        tone: "error",
      });
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
      <View style={styles.section}>
        <SectionTitle title="Akun" />
      </View>
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
        label="Ganti keluarga"
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
          Gmail memproses sementara teks email yang tampak seperti notifikasi
          transaksi. Isi lengkap email tidak disimpan dan hasilnya tidak pernah
          langsung menjadi transaksi.
        </Copy>
        {gmailMessage && (
          <Notice
            error={gmailMessage.tone === "error"}
            success={gmailMessage.tone === "success"}
          >
            {gmailMessage.text}
          </Notice>
        )}
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
              Terhubung ke {gmailStatus.data.gmail_address} · Deteksi transaksi
              otomatis
            </Copy>
            {gmailStatus.data.history_complete === false && (
              <Notice>
                Memindai histori Gmail:{" "}
                {gmailStatus.data.history_checked_count ?? 0}
                {gmailStatus.data.history_total_estimate
                  ? ` dari sekitar ${gmailStatus.data.history_total_estimate}`
                  : ""}{" "}
                email yang sesuai pola transaksi telah diperiksa.
              </Notice>
            )}
            {gmailStatus.data.history_complete &&
              (gmailStatus.data.history_checked_count ?? 0) > 0 && (
                <Notice>
                  Histori Gmail selesai:{" "}
                  {gmailStatus.data.history_checked_count} email sesuai
                  pencarian diperiksa. Hanya email dengan format nominal
                  pembayaran yang dikenali menjadi kandidat; {pendingCandidates}{" "}
                  masih perlu ditinjau.
                </Notice>
              )}
            {gmailStatus.data.status === "error" && (
              <>
                <Notice error>
                  Sinkronisasi Gmail gagal. Coba sinkronkan lagi atau hubungkan
                  ulang Gmail.
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
              label={
                gmailStatus.data.history_complete
                  ? "Cari email transaksi baru"
                  : "Lanjutkan pencarian histori"
              }
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
                <SectionTitle
                  title={`${pendingCandidates} kandidat perlu ditinjau`}
                />
                {gmailCandidates.data.map((candidate, index) => (
                  <View
                    key={candidate.id}
                    style={{
                      gap: 10,
                      paddingTop: index ? 14 : 2,
                      borderTopWidth: index ? 1 : 0,
                      borderTopColor: c.border,
                    }}
                  >
                    <View style={styles.between}>
                      <Copy bold>{money(candidate.amount_minor)}</Copy>
                      <Copy muted size={14}>
                        {candidate.occurred_on ?? "Tanggal belum terbaca"}
                      </Copy>
                    </View>
                    <Copy muted size={14}>
                      {candidate.note ||
                        "Detail belum terbaca — lengkapi saat mencatat."}
                    </Copy>
                    <View style={styles.row}>
                      <Button
                        compact
                        label="Tinjau & catat"
                        style={{ flex: 1 }}
                        disabled={gmailBusy}
                        onPress={() =>
                          router.push({
                            pathname: "/transaction",
                            params: {
                              candidate_id: candidate.id,
                              candidate_amount_minor: candidate.amount_minor,
                              ...(candidate.occurred_on
                                ? {
                                    candidate_occurred_on:
                                      candidate.occurred_on,
                                  }
                                : {}),
                              ...(candidate.note
                                ? { candidate_note: candidate.note }
                                : {}),
                            },
                          })
                        }
                      />
                      <Button
                        compact
                        secondary
                        danger
                        label="Abaikan"
                        style={{ flex: 1 }}
                        disabled={gmailBusy}
                        onPress={() => void rejectCandidate(candidate.id)}
                      />
                    </View>
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
