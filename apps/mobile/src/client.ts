import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4310";
export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: "cashflow",
      storagePrefix: "cashflow",
      storage: SecureStore,
      disableCache: true,
    }),
  ],
});
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any,
  ) {
    super(message);
  }
}
let lostAccess: (code: string) => void = () => {};
export function onAccessLost(fn: typeof lostAccess) {
  lostAccess = fn;
}
export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (Platform.OS !== "web") {
    const cookie = await authClient.getCookie();
    if (cookie) headers.set("Cookie", cookie);
  }
  if (options.body) headers.set("Content-Type", "application/json");
  const response = await fetch(API_URL + path, {
    ...options,
    headers,
    credentials: "include",
    signal: options.signal ?? AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    const e = await response.json().catch(() => ({}));
    if (
      response.status === 401 ||
      ["HOUSEHOLD_ACCESS", "ACCOUNT_UNAVAILABLE"].includes(e.code)
    )
      lostAccess(e.code ?? "SIGN_IN_REQUIRED");
    throw new ApiError(
      response.status,
      e.code ?? "REQUEST_FAILED",
      e.message ?? "Permintaan gagal. Coba kembali.",
      e.details,
    );
  }
  return (
    response.headers.get("content-type")?.includes("text/csv")
      ? await response.text()
      : await response.json()
  ) as T;
}
