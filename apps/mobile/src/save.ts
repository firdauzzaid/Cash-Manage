import { useRef, useState } from "react";
import * as Crypto from "expo-crypto";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, request } from "./client";
import { useApp } from "./state";
export function useSave() {
  const cache = useQueryClient(),
    { online, notify } = useApp(),
    attempt = useRef<{
      key: string;
      path: string;
      method: string;
      body: string;
    } | null>(null);
  const inFlight = useRef(false),
    [busy, setBusy] = useState(false),
    [uncertain, setUncertain] = useState(false),
    [error, setError] = useState<Error | null>(null);
  async function save(
    path: string,
    payload: unknown,
    method = "POST",
    done?: (result: any) => void,
    successMessage = "Perubahan tersimpan.",
  ) {
    if (inFlight.current) return;
    if (!online) {
      setUncertain(false);
      setError(
        new Error("Anda sedang offline. Sambungkan internet lalu coba lagi."),
      );
      return;
    }
    inFlight.current = true;
    if (!attempt.current)
      attempt.current = {
        key: Crypto.randomUUID(),
        path,
        method,
        body: JSON.stringify(payload),
      };
    const a = attempt.current;
    setBusy(true);
    setError(null);
    let result: unknown;
    try {
      result = await request(a.path, {
        method: a.method,
        body: a.body,
        headers: { "Idempotency-Key": a.key },
      });
      attempt.current = null;
      setUncertain(false);
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Penyimpanan gagal.");
      setError(err);
      if (!(e instanceof ApiError) || e.status >= 500) {
        setUncertain(true);
      } else {
        attempt.current = null;
        setUncertain(false);
      }
      return undefined;
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
    await cache.invalidateQueries();
    notify(successMessage);
    done?.(result);
    return result;
  }
  return {
    save,
    busy,
    uncertain,
    error,
    locked: busy || uncertain,
    reset: () => {
      attempt.current = null;
      setUncertain(false);
      setError(null);
    },
  };
}
