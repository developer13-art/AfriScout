#!/usr/bin/env tsx
import { createHash, randomBytes } from "node:crypto";

const PREFIX = "afs";

function generateApiKey(): { prefix: string; plainText: string; hash: string } {
  const secret = randomBytes(32).toString("base64url");
  const prefix = `${PREFIX}_${secret.slice(0, 10)}`;
  const plainText = `${prefix}_${secret}`;
  const hash = createHash("sha256").update(plainText).digest("hex");
  return { prefix, plainText, hash };
}

const { prefix, plainText, hash } = generateApiKey();

console.log("API key generated for manual insertion or testing");
console.log("");
console.log(`prefix      : ${prefix}`);
console.log(`plainText   : ${plainText}`);
console.log(`sha256 hash : ${hash}`);
console.log("");
console.log("Store the plainText securely. Only the hash is stored in the database.");
console.log("Insert with:");
console.log("");
console.log("  INSERT INTO api_keys (id, user_id, name, prefix, key_hash, scopes, rate_limit_per_min)");
console.log("  VALUES (gen_random_uuid(), '<user-uuid>', 'CLI generated',");
console.log(`    '${prefix}', '${hash}', ARRAY['opportunities:read'], 60);`);