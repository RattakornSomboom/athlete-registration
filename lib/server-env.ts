/**
 * Server-only environment variable helper.
 * Fails fast if accessed on client or when required secrets are missing.
 */
export function assertServerContext(): void {
  if (typeof window !== "undefined") {
    throw new Error("This module can only be executed in a server environment.");
  }
}

export function requiredServerEnv(name: string): string {
  assertServerContext();
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }
  return value;
}
