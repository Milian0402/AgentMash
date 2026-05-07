import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 20_000,
  expect: {
    timeout: 5_000
  },
  use: {
    channel: "chrome",
    trace: "retain-on-failure"
  }
});
