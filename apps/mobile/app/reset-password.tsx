import React, { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { authClient } from "../src/client";
import { Button, Copy, Field, Notice, Screen } from "../src/ui";
export default function Reset() {
  const { token, error } = useLocalSearchParams<{
      token?: string;
      error?: string;
    }>(),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState<{
      text: string;
      error: boolean;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  return (
    <Screen title="Kata sandi baru">
      {!token || error ? (
        <Notice error>
          Tautan tidak valid atau kedaluwarsa. Minta tautan baru dari layar
          masuk.
        </Notice>
      ) : (
        <>
          <Copy>
            Gunakan minimal 12 karakter. Sesi sebelumnya akan diakhiri setelah
            kata sandi berubah.
          </Copy>
          <Field
            label="Kata sandi baru"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            editable={!busy && !done}
          />
          {message && (
            <Notice error={message.error} success={!message.error}>
              {message.text}
            </Notice>
          )}
          <Button
            label={busy ? "Menyimpan…" : "Simpan kata sandi baru"}
            disabled={busy || done || password.length < 12}
            onPress={async () => {
              setBusy(true);
              try {
                const r = await authClient.resetPassword({
                  token,
                  newPassword: password,
                });
                if (r.error)
                  setMessage({
                    error: true,
                    text: "Tautan tidak valid atau tidak dapat digunakan lagi. Minta tautan baru.",
                  });
                else {
                  setDone(true);
                  setPassword("");
                  setMessage({
                    error: false,
                    text: "Kata sandi diperbarui. Silakan masuk kembali.",
                  });
                }
              } catch {
                setMessage({
                  error: true,
                  text: "Tidak dapat terhubung. Coba kembali.",
                });
              } finally {
                setBusy(false);
              }
            }}
          />
        </>
      )}
      <Button
        label="Kembali ke aplikasi"
        secondary
        onPress={() => router.replace("/")}
      />
    </Screen>
  );
}
