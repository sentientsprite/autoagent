/**
 * Envelope encryption for OAuth refresh tokens.
 *
 * Threat model: a leaked Postgres dump (read-only DB compromise) must not yield
 * working OAuth tokens. The master key (NEMO_TENANT_KMS_KEY) lives only in
 * the runtime env and is never persisted alongside ciphertext.
 *
 * Algorithm: AES-256-GCM with per-record random IV. Output is base64 of
 * [iv(12) || authTag(16) || ciphertext]. We tag with the org_id as additional
 * authenticated data so a token row can't be silently moved between orgs.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALG = "aes-256-gcm";

function masterKey(): Buffer {
  const raw = process.env.NEMO_TENANT_KMS_KEY;
  if (!raw) throw new Error("NEMO_TENANT_KMS_KEY missing");
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) {
    throw new Error("NEMO_TENANT_KMS_KEY must decode to 32 bytes (base64)");
  }
  return buf;
}

export function encryptToken(plaintext: string, orgId: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALG, masterKey(), iv);
  cipher.setAAD(Buffer.from(orgId, "utf8"));
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

export function decryptToken(blob: string, orgId: string): string {
  const buf = Buffer.from(blob, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = createDecipheriv(ALG, masterKey(), iv);
  decipher.setAAD(Buffer.from(orgId, "utf8"));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}
