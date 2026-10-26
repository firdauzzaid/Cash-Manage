import { withHousehold } from "../../src/household-screen";
import React, { useEffect, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { FlatList, Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { Transaction } from "@cashflow/contracts";
import { useApp } from "../../src/state";
import { request } from "../../src/client";
import { FilterPanel, filterParams, initialFilters } from "../../src/filters";
import {
  Button,
  Card,
  Copy,
  LoadState,
  SectionTitle,
  Title,
  scrollFocusedField,
  useColors,
} from "../../src/ui";
import { TransactionRow } from "../../src/transaction-row";
function Transactions() {
  const link = useLocalSearchParams<{
    category_id?: string;
    from?: string;
    to?: string;
  }>();
  const { household, me } = useApp(),
    c = useColors(),
    list = useRef<FlatList<Transaction>>(null),
    [filters, setFilters] = useState(initialFilters(household!.timezone)),
    params = filterParams(filters);
  useEffect(() => {
    if (link.category_id && link.from && link.to)
      setFilters({
        ...initialFilters(household!.timezone),
        category_id: link.category_id,
        from: link.from,
        to: link.to,
      });
  }, [link.category_id, link.from, link.to]);
  const q = useInfiniteQuery({
    queryKey: ["household", me!.id, household!.id, "transactions", params],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      request<{ items: Transaction[]; next_cursor: string | null }>(
        `/households/${household!.id}/transactions?${params}${pageParam ? "&cursor=" + encodeURIComponent(pageParam) : ""}`,
      ),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  });
  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={{ flex: 1, backgroundColor: c.bg }}
    >
      <FlatList
        ref={list}
        data={q.data?.pages.flatMap((p) => p.items) ?? []}
        keyExtractor={(x) => x.id}
        renderItem={({ item }) => <TransactionRow item={item} />}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 100,
          maxWidth: 720,
          width: "100%",
          alignSelf: "center",
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        refreshing={q.isRefetching && !q.isFetchingNextPage}
        onRefresh={() => void q.refetch()}
        ListHeaderComponent={
          <View style={{ gap: 16, paddingBottom: 16 }}>
            <View style={{ gap: 4 }}>
              <Title>Transaksi</Title>
              <Copy muted>
                Setiap catatan di {household!.name} tersimpan untuk seluruh
                keluarga.
              </Copy>
            </View>
            <Card style={{ gap: 14 }}>
              <SectionTitle title="Filter transaksi" />
              <FilterPanel
                value={filters}
                onChange={setFilters}
                onSearchFocus={(target) =>
                  scrollFocusedField(list.current?.getScrollResponder(), target)
                }
              />
            </Card>
            <LoadState
              loading={q.isPending}
              error={q.error}
              retry={q.refetch}
              stale={!!q.data}
            />
          </View>
        }
        ListEmptyComponent={
          !q.isPending && !q.error ? (
            <Card>
              <Copy muted>Tidak ada transaksi yang sesuai filter ini.</Copy>
            </Card>
          ) : undefined
        }
        ListFooterComponent={
          q.hasNextPage ? (
            <Button
              label={
                q.isFetchingNextPage ? "Memuat…" : "Muat transaksi berikutnya"
              }
              secondary
              disabled={q.isFetchingNextPage}
              onPress={() => void q.fetchNextPage()}
            />
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

export default withHousehold(Transactions);
