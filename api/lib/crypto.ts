import { createHash } from "crypto";
import sodium from "libsodium-wrappers";

/**
 * Server-side crypto optimized for serverless
 *
 * Uses libsodium-wrappers for sealed box encryption to maintain
 * compatibility with frontend. The ~200-300ms cold start overhead
 * is acceptable because:
 * 1. Vercel functions stay warm after first invocation
 * 2. Ensures 100% compatibility with frontend decryption
 * 3. Battle-tested cryptography implementation
 */

// Pre-initialize sodium to avoid repeated initialization
let sodiumInitialized = false;
async function initSodium() {
  if (!sodiumInitialized) {
    await sodium.ready;
    sodiumInitialized = true;
  }
}

/**
 * SHA-256 hash function for validation
 * Uses native Node.js crypto for ZERO overhead (no external dependencies)
 */
export async function sha256(input: string): Promise<string> {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Encrypt data using public key (sealed box compatible with libsodium)
 *
 * CRITICAL SECURITY: This function ONLY encrypts. The server NEVER has the private key
 * and therefore CANNOT decrypt user data. This ensures zero-knowledge encryption.
 *
 * Implementation uses libsodium's sealed box construction:
 * 1. Generate ephemeral keypair
 * 2. Perform X25519 key exchange
 * 3. Derive encryption key using BLAKE2b
 * 4. Encrypt with XSalsa20-Poly1305
 * 5. Prepend ephemeral public key
 *
 * Performance: Uses minimal dependencies for fast cold starts
 * - Native Node.js crypto for hashing
 * - Lightweight pure JS for X25519/crypto_box primitives
 */
export async function encryptData(data: string, publicKeyHex: string): Promise<string> {
  // Ensure sodium is initialized (only happens once per container)
  await initSodium();

  // Convert hex public key to Uint8Array
  const publicKey = hexToUint8Array(publicKeyHex);

  // Encode the data
  const dataBytes = new TextEncoder().encode(data);

  // Use sealed box for public key encryption
  const encrypted = sodium.crypto_box_seal(dataBytes, publicKey);

  // Return as base64 string for storage
  return uint8ArrayToBase64(encrypted);
}

/**
 * Validate that a public key hash matches the actual public key
 * This ensures clients can't spoof their identity
 */
export async function validatePublicKeyHash(
  publicKey: string,
  publicKeyHash: string,
): Promise<boolean> {
  const computedHash = await sha256(publicKey);
  return computedHash === publicKeyHash;
}

/**
 * Helper: Convert hex string to Uint8Array
 */
function hexToUint8Array(hexString: string): Uint8Array {
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Helper: Convert Uint8Array to base64
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}
