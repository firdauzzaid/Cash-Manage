import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Linking from "expo-linking";
import { SafeAreaView } from "react-native-safe-area-context";
import { authClient } from "./client";
import { useApp } from "./state";
import { Button, Copy, Field, Notice, Title, useColors } from "./ui";

export function AuthScreen() {
  const { notice } = useApp();
  const c = useColors(),
    [mode, setMode] = useState<"signin" | "signup" | "reset">("signin"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [showPassword, setShowPassword] = useState(false),
    [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function submit() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const result =
        mode === "signin"
          ? await authClient.signIn.email({ email: email.trim(), password })
          : mode === "signup"
            ? await authClient.signUp.email({
                email: email.trim(),
                password,
                name: name.trim(),
                callbackURL: Linking.createURL("/"),
              })
            : await authClient.requestPasswordReset({
                email: email.trim(),
                redirectTo: Linking.createURL("reset-password"),
              });
      if (result.error)
        setMessage(
          result.error.code === "EMAIL_NOT_VERIFIED"
            ? "Email belum terverifikasi. Periksa inbox atau kirim ulang tautan."
            : result.error.code === "INVALID_EMAIL_OR_PASSWORD"
              ? "Email atau kata sandi tidak sesuai."
              : (result.error.message ?? "Permintaan gagal. Coba kembali."),
        );
      else if (mode === "signup") {
        setMessage("Akun dibuat. Buka tautan verifikasi di email, lalu masuk.");
        setMode("signin");
        setPassword("");
      } else if (mode === "reset") {
        setMessage(
          "Jika alamat terdaftar, tautan atur ulang dikirim ke email Anda.",
        );
      }
    } catch {
      setMessage("Tidak dapat terhubung. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }
  const formTitle =
    mode === "signup"
      ? "Buat akun Anda"
      : mode === "reset"
        ? "Atur ulang kata sandi"
        : "Selamat datang kembali";
  const messageIsError =
    message.includes("tidak sesuai") ||
    message.includes("Tidak dapat") ||
    message.includes("gagal");
  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={{ flex: 1, backgroundColor: c.hero }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            flex: 1,
            width: "100%",
            maxWidth: 520,
            alignSelf: "center",
            backgroundColor: c.hero,
          }}
        >
          <View
            style={{
              flex: 1,
              minHeight: 220,
              paddingHorizontal: 24,
              paddingVertical: 20,
              justifyContent: "center",
              gap: 12,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 9 }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 11,
                  backgroundColor: c.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="wallet-outline" size={18} color={c.onPrimary} />
              </View>
              <Text
                style={{
                  fontSize: 14,
                  color: c.accent,
                  fontWeight: "700",
                  letterSpacing: 0.8,
                }}
              >
                CASH FLOW
              </Text>
            </View>
            <Text
              accessibilityRole="header"
              style={{
                fontSize: 30,
                lineHeight: 36,
                fontWeight: "700",
                letterSpacing: -0.3,
                color: c.onHero,
              }}
            >
              Keuangan bersama, tanpa merasa sendirian.
            </Text>
            <Text
              style={{
                color: c.onHero,
                opacity: 0.74,
                fontSize: 15,
                lineHeight: 22,
              }}
            >
              Catat, pahami, dan putuskan bersama pada satu ruang keuangan.
            </Text>
          </View>
          <View
            style={{
              backgroundColor: c.bg,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 20,
              paddingTop: 22,
              paddingBottom: 16,
              gap: 14,
            }}
          >
            {notice && <Notice>{notice}</Notice>}
            <View
              style={{
                gap: 12,
              }}
            >
              <Title>{formTitle}</Title>
              {mode === "signup" && (
                <Field
                  label="Nama Anda"
                  value={name}
                  onChangeText={setName}
                  maxLength={80}
                  autoComplete="name"
                />
              )}
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
              {mode !== "reset" && (
                <Field
                  label="Kata sandi"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  helper={
                    mode === "signup"
                      ? "Minimal 12 karakter. Setiap anggota memakai akun sendiri."
                      : undefined
                  }
                  accessory={
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        showPassword
                          ? "Sembunyikan kata sandi"
                          : "Tampilkan kata sandi"
                      }
                      onPress={() => setShowPassword((shown) => !shown)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        color={c.primary}
                        size={21}
                      />
                    </Pressable>
                  }
                />
              )}
              {message !== "" && (
                <Notice error={messageIsError}>{message}</Notice>
              )}
              <Button
                label={
                  busy
                    ? "Memproses…"
                    : mode === "signup"
                      ? "Buat akun"
                      : mode === "reset"
                        ? "Kirim tautan atur ulang"
                        : "Masuk"
                }
                disabled={
                  busy ||
                  !email ||
                  (mode !== "reset" && !password) ||
                  (mode === "signup" && !name)
                }
                onPress={() => void submit()}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Copy muted size={14}>
                  {mode === "signup"
                    ? "Sudah punya akun?"
                    : "Belum punya akun?"}
                </Copy>
                <AuthLink
                  label={mode === "signup" ? "Masuk" : "Daftar"}
                  disabled={busy}
                  onPress={() => {
                    setMode(mode === "signup" ? "signin" : "signup");
                    setMessage("");
                  }}
                />
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                {mode === "signin" ? (
                  <>
                    <AuthLink
                      label="Lupa kata sandi"
                      disabled={busy}
                      onPress={() => {
                        setMode("reset");
                        setMessage("");
                      }}
                    />
                    <AuthLink
                      label="Kirim ulang verifikasi email"
                      disabled={busy || !email}
                      onPress={async () => {
                        setBusy(true);
                        try {
                          await authClient.sendVerificationEmail({
                            email: email.trim(),
                            callbackURL: Linking.createURL("/"),
                          });
                          setMessage(
                            "Jika akun belum terverifikasi, tautan verifikasi dikirim ke email Anda.",
                          );
                        } catch {
                          setMessage(
                            "Belum dapat mengirim email. Coba kembali.",
                          );
                        } finally {
                          setBusy(false);
                        }
                      }}
                    />
                  </>
                ) : (
                  <AuthLink
                    label="Kembali ke masuk"
                    disabled={busy}
                    onPress={() => setMode("signin")}
                  />
                )}
              </View>
              {mode === "signin" && !email && (
                <Copy muted size={12}>
                  Isi email untuk mengirim ulang verifikasi.
                </Copy>
              )}
            </View>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                alignItems: "center",
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: c.border,
              }}
            >
              <Ionicons
                name="shield-checkmark-outline"
                color={c.primary}
                size={18}
              />
              <Copy muted size={12}>
                Setiap anggota memakai akun sendiri; catatan hanya dibagikan
                kepada keluarga.
              </Copy>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function AuthLink({
  label,
  disabled = false,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: disabled ? 0.42 : pressed ? 0.65 : 1,
        paddingVertical: 4,
      })}
    >
      <Text
        style={{
          color: c.primary,
          fontSize: 13,
          lineHeight: 18,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export { HouseholdChooser } from "./household-chooser";
