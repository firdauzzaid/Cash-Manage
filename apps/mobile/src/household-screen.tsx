import React from "react";
import { authClient } from "./client";
import { useApp } from "./state";
import { Loading, Screen } from "./ui";
export function withHousehold<P extends object>(
  Component: React.ComponentType<P>,
) {
  return function HouseholdScreen(props: P) {
    const { household, me } = useApp(),
      session = authClient.useSession();
    // Navigation can retain an outgoing screen for its transition after access/context changes.
    if (!household || !me || !session.data?.user)
      return (
        <Screen>
          <Loading />
        </Screen>
      );
    return <Component key={`${me.id}:${household.id}`} {...props} />;
  };
}
