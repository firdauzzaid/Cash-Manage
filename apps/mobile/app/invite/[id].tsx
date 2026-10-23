import React from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { request } from "../../src/client";
import { useApp } from "../../src/state";
import { Action } from "../../src/action";
import { Button, Copy, LoadState, Screen, Title } from "../../src/ui";
export default function Invitation() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    { refresh, select } = useApp(),
    q = useQuery({
      queryKey: ["invitation", id],
      queryFn: () => request<{ household_name: string }>(`/invitations/${id}`),
    });
  return (
    <Screen title="Undangan keluarga">
      <LoadState loading={q.isPending} error={q.error} retry={q.refetch} />
      {q.data && (
        <>
          <Title>{q.data.household_name}</Title>
          <Copy>
            Semua anggota dapat melihat, mengelola, dan mengekspor catatan
            keuangan di keluarga ini. Pastikan Anda mengenal pemilik ruang ini.
          </Copy>
          <Action
            label="Terima undangan"
            path={`/invitations/${id}/accept`}
            payload={{}}
            question="Bergabung dan mulai berbagi keuangan keluarga?"
            done={async (r) => {
              await refresh();
              select(r.id);
              router.replace("/");
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
