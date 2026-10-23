import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import * as Network from "expo-network";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
  focusManager,
  onlineManager,
} from "@tanstack/react-query";
import type { QueryObserverResult } from "@tanstack/react-query";
import type { Household } from "@cashflow/contracts";
import { authClient, onAccessLost, request } from "./client";
export type Me = {
  id: string;
  display_name: string;
  email: string;
  households: Household[];
  invitations: { id: string; household_name: string; expires_at: string }[];
};
const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
      refetchInterval: 15000,
      refetchIntervalInBackground: false,
      gcTime: 0,
    },
    mutations: { retry: false },
  },
});
type State = {
  me: Me | null;
  household: Household | null;
  select: (id: string | null) => void;
  refresh: () => Promise<QueryObserverResult<Me, Error>>;
  signout: () => Promise<void>;
  ready: boolean;
  error: Error | null;
  online: boolean;
  notice: string | null;
  feedback: { message: string; tone: "success" | "info" } | null;
  notify: (message: string, tone?: "success" | "info") => void;
  dismissFeedback: () => void;
};
const Context = createContext<State>(null!);
export function useApp() {
  return useContext(Context);
}
function SessionProvider({ children }: React.PropsWithChildren) {
  const cache = useQueryClient(),
    session = authClient.useSession(),
    [selected, setSelected] = useState<string | null>(null),
    [foreground, setForeground] = useState(
      AppState.currentState !== "background",
    ),
    [validated, setValidated] = useState(false),
    [online, setOnline] = useState(true),
    [notice, setNotice] = useState<string | null>(null),
    [feedback, setFeedback] = useState<State["feedback"]>(null),
    feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissFeedback = useCallback(() => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = null;
    setFeedback(null);
  }, []);
  const notify = useCallback(
    (message: string, tone: "success" | "info" = "success") => {
      dismissFeedback();
      setFeedback({ message, tone });
      feedbackTimer.current = setTimeout(dismissFeedback, 6000);
    },
    [dismissFeedback],
  );
  useEffect(() => dismissFeedback, [dismissFeedback]);
  const me = useQuery({
    queryKey: ["me", session.data?.user.id],
    queryFn: () => request<Me>("/me"),
    enabled: !!session.data?.user && foreground,
  });
  useEffect(() => {
    onAccessLost((code) => {
      cache.clear();
      setSelected(null);
      setValidated(false);
      setNotice(
        code === "HOUSEHOLD_ACCESS"
          ? "Akses keluarga tidak lagi tersedia."
          : "Sesi tidak lagi aktif. Silakan masuk kembali.",
      );
      if (code !== "HOUSEHOLD_ACCESS") void authClient.signOut();
      else void me.refetch();
    });
    return () => onAccessLost(() => {});
  }, [session.data?.user.id]);
  useEffect(() => {
    if (!session.data?.user) {
      cache.clear();
      setSelected(null);
      setValidated(false);
    }
  }, [session.data?.user.id]);
  useEffect(() => {
    if (me.isSuccess && !me.isFetching) setValidated(true);
  }, [me.dataUpdatedAt, me.isFetching]);
  useEffect(() => {
    if (
      selected &&
      me.data &&
      !me.data.households.some((h) => h.id === selected)
    ) {
      cache.removeQueries({ predicate: (q) => q.queryKey[0] === "household" });
      setSelected(null);
      setNotice("Akses keluarga berubah. Pilih keluarga yang tersedia.");
    }
  }, [me.dataUpdatedAt, selected]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      const active = state === "active";
      setForeground(active);
      focusManager.setFocused(active);
      if (!active) {
        setValidated(false);
      } else if (session.data?.user) {
        void me.refetch();
      }
    });
    const net = Network.addNetworkStateListener((state) => {
      const connected =
        !!state.isConnected && state.isInternetReachable !== false;
      setOnline(connected);
      onlineManager.setOnline(connected);
      if (connected && session.data?.user) void me.refetch();
    });
    return () => {
      sub.remove();
      net.remove();
    };
  }, [session.data?.user.id]);
  const h = me.data?.households.find((x) => x.id === selected) ?? null;
  return (
    <Context.Provider
      value={{
        me: me.data ?? null,
        household: h,
        select: (id) => {
          cache.removeQueries({
            predicate: (q) => q.queryKey[0] === "household",
          });
          setSelected(id);
          setNotice(null);
        },
        refresh: () => me.refetch(),
        signout: async () => {
          await authClient.signOut();
          cache.clear();
          setSelected(null);
        },
        ready:
          !session.isPending &&
          (!session.data?.user || (foreground && validated)),
        error: me.error,
        online,
        notice,
        feedback,
        notify,
        dismissFeedback,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function Providers({ children }: React.PropsWithChildren) {
  return (
    <QueryClientProvider client={client}>
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  );
}
export function useHouseholdQuery<T>(resource: string) {
  const { household, me } = useApp();
  return useQuery<T>({
    queryKey: ["household", me?.id, household?.id, resource],
    queryFn: () => request<T>(`/households/${household!.id}/${resource}`),
    enabled: !!household,
  });
}
