import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 20_000,
  expect: {
    timeout: 5_000
  },
  webServer: {
    command: "npm run serve",
    url: "http://127.0.0.1:5177/",
    reuseExistingServer: true,
    timeout: 10_000
  },
  use: {
    trace: "retain-on-failure"
  }
});
