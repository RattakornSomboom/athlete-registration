const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

const source = "C:/Users/kong_/.gemini/antigravity-ide/conversations/1a6a8cd1-815a-4a1b-a88f-aaa116e85726.db";
const selected = [52, 54, 56, 61, 63, 69, 112, 141];
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

// Decode wire fields without inventing semantic names for the private format.
function fields(bytes, prefix = "", depth = 0) {
  if (depth > 16) throw new Error("Nesting limit");
  let offset = 0;
  const result = [];
  function varint() {
    let value = 0;
    let scale = 1;
    for (let i = 0; i < 10 && offset < bytes.length; i++) {
      const byte = bytes[offset++];
      value += (byte & 127) * scale;
      if (!(byte & 128)) return value;
      scale *= 128;
    }
    throw new Error("Invalid varint");
  }
  while (offset < bytes.length) {
    const key = varint();
    const field = Math.floor(key / 8);
    const wire = key % 8;
    if (!field) throw new Error("Invalid field");
    const name = prefix ? `${prefix}.${field}` : String(field);
    if (wire === 0) {
      result.push({ field: name, value: varint() });
    } else if (wire === 2) {
      const length = varint();
      if (length > bytes.length - offset) throw new Error("Invalid length");
      const payload = bytes.subarray(offset, offset + length);
      offset += length;
      const value = payload.toString("utf8");
      if (value.length && !/[\u0000-\u0008\u000b\u000c\u000e-\u001a\u001c-\u001f\ufffd]/.test(value)) {
        result.push({ field: name, text: value });
      } else {
        try { result.push(...fields(payload, name, depth + 1)); } catch { /* Opaque bytes are not text evidence. */ }
      }
    } else if (wire === 1 || wire === 5) {
      offset += wire === 1 ? 8 : 4;
      if (offset > bytes.length) throw new Error("Invalid fixed field");
    } else {
      throw new Error("Unsupported wire field");
    }
  }
  return result;
}

function redact(text) {
  return text
    .replace(/(postgres(?:ql)?:\/\/)[^\s/@]+:[^\s/@]+@/gi, "$1[REDACTED]@")
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[REDACTED_JWT]")
    .replace(/((?:PASSWORD|SECRET|SERVICE_ROLE_KEY|ACCESS_TOKEN)\s*[:=]\s*)[^\s,;]+/gi, "$1[REDACTED]");
}

const db = new DatabaseSync(source, { readOnly: true });
try {
  const records = selected.map((idx) => {
    const row = db.prepare("SELECT idx, step_type, status, step_payload FROM steps WHERE idx = ?").get(idx);
    if (!row) throw new Error(`Missing step ${idx}`);
    const bytes = Buffer.from(row.step_payload);
    const decoded = fields(bytes).map((item) => item.text === undefined ? item : { ...item, text: redact(item.text) });
    return { idx, stepType: row.step_type, status: row.status, payloadSha256: sha256(bytes), fields: decoded };
  });
  const output = {
    recoveredAt: new Date().toISOString(),
    source,
    method: "Read-only SQLite SELECT; generic protobuf wire decoding; field numbers retained without assumed schema; credential-pattern redaction",
    records,
  };
  const destination = path.join(__dirname, "history-quality-excerpts.json");
  if (fs.existsSync(destination)) throw new Error("Refusing to overwrite recovered evidence");
  fs.writeFileSync(destination, JSON.stringify(output, null, 2) + "\n");
  console.log(JSON.stringify({ destination, records: records.map((record) => ({ idx: record.idx, textFields: record.fields.filter((field) => field.text !== undefined).map((field) => ({ field: field.field, length: field.text.length, preview: field.text.slice(0, 160) })) })) }, null, 2));
} finally {
  db.close();
}
