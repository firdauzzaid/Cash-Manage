import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
test("signup, verify, household, account, expense and CSV through the real UI", async ({
  page,
  request,
}) => {
  const email = `qa-${randomUUID()}@cashflow.example`,
    password = "QA-" + randomUUID(),
    screens = ".impeccable/review";
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await expect
    .poll(async () => {
      try {
        return (
          await request.get("http://localhost:4310/health/ready")
        ).status();
      } catch {
        return 0;
      }
    })
    .toBe(200);
  await mkdir(screens, { recursive: true });
  await page.goto("/");
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollHeight <= window.innerHeight + 1,
      ),
    )
    .toBe(true);
  await expect(
    page.getByRole("button", { name: "Masuk", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: `${screens}/web-auth.png`, fullPage: true });
  await page.getByRole("button", { name: "Daftar", exact: true }).click();
  await page.getByLabel("Nama Anda", { exact: true }).fill("Pengguna QA");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Buat akun", exact: true }).click();
  await expect(page.getByText("Akun dibuat.", { exact: false })).toBeVisible();
  let link: string | undefined;
  await expect
    .poll(async () => {
      const list = await (
        await request.get("http://localhost:8027/api/v1/messages")
      ).json();
      const message = list.messages.find((m: any) =>
        m.To?.some((to: any) => to.Address === email),
      );
      if (!message) return false;
      const detail = await (
        await request.get(`http://localhost:8027/api/v1/message/${message.ID}`)
      ).json();
      link = detail.Text.match(/https?:\/\/\S+/)?.[0];
      return !!link;
    })
    .toBeTruthy();
  await request.get(link!);
  await page.getByLabel("Kata sandi", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Halo, Pengguna QA" }),
  ).toBeVisible();
  await page.screenshot({
    path: `${screens}/web-household-chooser.png`,
    fullPage: true,
  });
  await page
    .getByLabel("Nama keluarga", { exact: true })
    .fill("Keluarga QA · Data pengujian");
  await page
    .getByRole("button", { name: "Buat keluarga", exact: true })
    .click();
  await expect(
    page.getByText("Ruang keluarga berhasil dibuat.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("SALDO SAAT INI", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Tambah rekening", exact: true })
    .click();
  await page.getByLabel("Nama rekening", { exact: true }).fill("Bank QA");
  await page.getByLabel("Saldo awal", { exact: true }).fill("1000000");
  await page
    .getByRole("button", { name: "Simpan rekening", exact: true })
    .click();
  await expect(
    page.getByText("Rp1.000.000", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Tambah transaksi", exact: true })
    .click();
  await page.getByLabel("Nominal", { exact: true }).fill("25000");
  await page
    .getByRole("button", { name: "Rekening, Belum dipilih", exact: true })
    .click();
  await page.getByRole("radio", { name: "Bank QA", exact: true }).click();
  await page
    .getByRole("button", { name: "Kategori, Belum dipilih", exact: true })
    .click();
  await page.getByRole("radio", { name: "Belanja rumah", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page
    .getByLabel("Catatan (opsional)", { exact: true })
    .fill("Data QA · belanja bersama");
  await page
    .getByRole("heading", { name: "Catat untuk keluarga", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `${screens}/web-transaction.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Simpan pengeluaran", exact: true })
    .click();
  await expect(
    page.getByText("Pengeluaran berhasil disimpan.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Rp975.000", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("heading", { name: "Keluarga QA · Data pengujian", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `${screens}/web-home-light.png`,
    fullPage: true,
  });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.screenshot({
    path: `${screens}/web-home-dark.png`,
    fullPage: true,
  });
  await page.emulateMedia({ colorScheme: "light" });
  await page
    .getByRole("button", { name: "Lihat laporan & ekspor", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Ekspor CSV sesuai filter", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("cash-flow.csv");
  await page.goto("/");
  await page
    .getByRole("button", {
      name: "Keluarga QA · Data pengujian · Pemilik",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Tambah transaksi", exact: true })
    .click();
  await page.getByLabel("Nominal", { exact: true }).fill("1000");
  await page
    .getByRole("button", { name: "Rekening, Belum dipilih", exact: true })
    .click();
  await page.getByRole("radio", { name: "Bank QA", exact: true }).click();
  await page
    .getByRole("button", { name: "Kategori, Belum dipilih", exact: true })
    .click();
  await page.getByRole("radio", { name: "Belanja rumah", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  let dropResponse = true;
  await page.route("**/households/*/transactions", async (route) => {
    if (route.request().method() === "POST" && dropResponse) {
      dropResponse = false;
      const committed = await route.fetch();
      expect(committed.status()).toBe(200);
      await route.abort("failed");
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Simpan pengeluaran", exact: true })
    .click();
  await expect(
    page.getByText("Hasil penyimpanan belum diketahui.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByLabel("Nominal", { exact: true })).toHaveValue("1000");
  await page
    .getByRole("button", { name: "Periksa & coba lagi", exact: true })
    .click();
  await expect(
    page.getByText("Rp974.000", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Pilih household", exact: true })
    .click();
  await page
    .getByLabel("Nama keluarga", { exact: true })
    .fill("Keluarga QA kedua · Data pengujian");
  await page
    .getByRole("button", { name: "Buat keluarga", exact: true })
    .click();
  await expect(page.getByText("SALDO SAAT INI", { exact: true })).toBeVisible();
  await expect(page.getByText("Bank QA", { exact: true })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Pilih household", exact: true })
    .click();
  await page.getByRole("button", { name: "Akun saya", exact: true }).click();
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Pilih atau buat keluarga lain", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Keluarga QA · Data pengujian · Pemilik",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Rp974.000", { exact: true }).first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
