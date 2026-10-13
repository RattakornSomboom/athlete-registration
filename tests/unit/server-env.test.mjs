import test from "node:test";
import assert from "node:assert/strict";

test("requiredServerEnv returns trimmed value when env variable exists", async () => {
  process.env.TEST_REQUIRED_VAR = "  hello-world  ";
  const { requiredServerEnv } = await import("../../lib/server-env.ts");
  assert.equal(requiredServerEnv("TEST_REQUIRED_VAR"), "hello-world");
  delete process.env.TEST_REQUIRED_VAR;
});

test("requiredServerEnv throws when env variable is missing or empty", async () => {
  const { requiredServerEnv } = await import("../../lib/server-env.ts");
  delete process.env.TEST_MISSING_VAR;
  assert.throws(
    () => requiredServerEnv("TEST_MISSING_VAR"),
    /Missing required server environment variable: TEST_MISSING_VAR/
  );

  process.env.TEST_EMPTY_VAR = "   ";
  assert.throws(
    () => requiredServerEnv("TEST_EMPTY_VAR"),
    /Missing required server environment variable: TEST_EMPTY_VAR/
  );
  delete process.env.TEST_EMPTY_VAR;
});
