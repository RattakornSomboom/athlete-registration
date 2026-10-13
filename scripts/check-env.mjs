import "dotenv/config";

const required = [
  "DATABASE_URL",
  "DIRECT_URL",
  "JWT_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "PRIVATE_DOCUMENT_BUCKET",
];

const missing = required.filter((name) => !process.env[name]?.trim());
const placeholder = required.filter((name) => {
  const value = process.env[name]?.trim() ?? "";
  return /YOUR_|REPLACE_WITH|PROJECT_ID|USER:PASSWORD|dummy/i.test(value);
});

if (missing.length || placeholder.length) {
  if (missing.length) console.error(`Missing environment variables: ${missing.join(", ")}`);
  if (placeholder.length) console.error(`Placeholder environment variables: ${placeholder.join(", ")}`);
  process.exit(1);
}

const jwtSecret = process.env.JWT_SECRET?.trim() ?? "";
if (jwtSecret.length < 32) {
  console.error("JWT_SECRET must contain at least 32 characters.");
  process.exit(1);
}

if (/development_only|supersecret|changeme/i.test(jwtSecret)) {
  console.warn("WARN: JWT_SECRET appears to use a development passphrase; supply a random production secret on the host.");
}

function parseUrl(name) {
  try {
    return new URL(process.env[name]);
  } catch {
    console.error(`${name} must be a valid URL.`);
    process.exit(1);
  }
}

for (const name of ["DATABASE_URL", "DIRECT_URL"]) {
  const protocol = parseUrl(name).protocol;
  if (protocol !== "postgresql:" && protocol !== "postgres:") {
    console.error(`${name} must be a PostgreSQL URL.`);
    process.exit(1);
  }
}

for (const name of ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]) {
  const url = parseUrl(name);
  if (url.protocol !== "https:") {
    console.error(`${name} must use HTTPS.`);
    process.exit(1);
  }
}

if (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith("sb_secret_")
) {
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY must not contain a privileged secret key.");
  process.exit(1);
}

console.log(`Environment validation passed (${required.length} required variables checked).`);
