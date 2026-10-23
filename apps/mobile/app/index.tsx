import { Redirect } from "expo-router";
import { authClient } from "../src/client";
import { useApp } from "../src/state";
import { Screen, Loading } from "../src/ui";
export default function Index() {
  const session = authClient.useSession(),
    state = useApp();
  if (session.isPending || !state.ready)
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  if (!session.data?.user) return <Redirect href="/sign-in" />;
  return (
    <Redirect href={state.household ? "/(tabs)/home" : "/choose-household"} />
  );
}
