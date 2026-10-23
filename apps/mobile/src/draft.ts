import { usePreventRemove } from "expo-router";
import { useState } from "react";
import { confirm } from "./ui";
export function useDraftGuard(dirty: boolean, uncertain: boolean) {
  const [leaving, setLeaving] = useState(false);
  const disable = usePreventRemove(dirty && !leaving, async ({ repeat }) => {
    if (uncertain) {
      await confirm(
        "Hasil penyimpanan belum diketahui",
        "Tetap di formulir dan gunakan Periksa & coba lagi sebelum meninggalkan halaman.",
      );
      return;
    }
    if (
      await confirm(
        "Tinggalkan isian?",
        "Isian yang belum tersimpan akan dibuang.",
      )
    ) {
      setLeaving(true);
      disable();
      repeat();
    }
  });
}
