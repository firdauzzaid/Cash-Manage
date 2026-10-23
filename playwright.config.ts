import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/ui",
  timeout: 90000,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    actionTimeout: 10000,
    baseURL: "http://localhost:8081",
    viewport: { width: 360, height: 800 },
    launchOptions: {
      executablePath:
        process.env.CHROME_PATH ??
        "C:/Program Files/Google/Chrome/Application/chrome.exe",
    },
    trace: "off",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node scripts/preview.mjs",
    url: "http://localhost:8081",
    reuseExistingServer: true,
  },
});
