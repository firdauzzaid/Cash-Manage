import React from "react";
import { useSave } from "./save";
import { SaveState, confirm } from "./ui";
export function Action({
  label,
  path,
  payload,
  question,
  done,
  destructive = false,
}: {
  label: string;
  path: string;
  payload: unknown;
  question?: string;
  done?: (r: any) => void;
  destructive?: boolean;
}) {
  const s = useSave();
  return (
    <SaveState
      state={s}
      label={label}
      onPress={async () => {
        if (
          !question ||
          s.uncertain ||
          (await confirm(label, question, label, destructive))
        )
          void s.save(path, payload, "POST", done, `${label} berhasil.`);
      }}
    />
  );
}
