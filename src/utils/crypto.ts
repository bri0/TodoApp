import sodium from "libsodium-wrappers";

/**
 * SHA-256 hash function
 */
export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Derive encryption key from password using PBKDF2
 *
 * PBKDF2 with 600,000 iterations (OWASP recommendation 2024):
 * - Much more secure than basic SHA-256
 * - Built into Web Crypto API (no dependencies)
 * - Computationally expensive for attackers
 * - Industry standard (used by many password managers)
 *
 * @param userId - Used as deterministic salt
 * @param password - User's password
 * @returns 32-byte hex string suitable for key generation
 */
export async function deriveKeyFromPassword(userId: string, password: string): Promise<string> {
  const encoder = new TextEncoder();

  // Import password as a key
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  // Use userId as deterministic salt
  const salt = encoder.encode(userId);

  // Derive 256 bits using PBKDF2 with 600,000 iterations
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 600000, // OWASP 2024 recommendation
      hash: "SHA-256",
    },
    passwordKey,
    256, // 32 bytes output
  );

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(derivedBits));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Perform recursive SHA-256 hashing
 * result(n) = sha256(result(n-1) + n)
 * result(0) = seed
 */
export async function recursiveSha256(seed: string, rounds: number): Promise<string> {
  let result = seed;

  for (let i = 1; i <= rounds; i++) {
    result = await sha256(result + i.toString());
  }

  return result;
}

/**
 * Generate a key pair from a seed using libsodium
 */
export async function generateKeyPairFromSeed(seedHex: string): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  await sodium.ready;

  // Convert hex seed to Uint8Array (32 bytes for libsodium seed)
  const seedBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    seedBytes[i] = parseInt(seedHex.substr(i * 2, 2), 16);
  }

  // Generate key pair from seed
  const keyPair = sodium.crypto_box_seed_keypair(seedBytes);

  // Convert to hex strings for storage
  const publicKey = sodium.to_hex(keyPair.publicKey);
  const privateKey = sodium.to_hex(keyPair.privateKey);

  return { publicKey, privateKey };
}

/**
 * Encrypt data using public key (sealed box)
 * This is typically done server-side but included for completeness
 */
export async function encryptData(data: string, publicKeyHex: string): Promise<string> {
  await sodium.ready;

  const publicKey = sodium.from_hex(publicKeyHex);
  const dataBytes = new TextEncoder().encode(data);

  // Use sealed box for public key encryption
  const encrypted = sodium.crypto_box_seal(dataBytes, publicKey);

  return sodium.to_base64(encrypted);
}

/**
 * Decrypt data using private key (sealed box)
 */
export async function decryptData(
  encryptedBase64: string,
  publicKeyHex: string,
  privateKeyHex: string,
): Promise<string> {
  await sodium.ready;

  const publicKey = sodium.from_hex(publicKeyHex);
  const privateKey = sodium.from_hex(privateKeyHex);
  const encrypted = sodium.from_base64(encryptedBase64);

  // Decrypt using sealed box
  const decrypted = sodium.crypto_box_seal_open(encrypted, publicKey, privateKey);

  return new TextDecoder().decode(decrypted);
}

/**
 * Generate next numeric ID for tasks or categories
 */
export function getNextNumericId(type: "task" | "category"): number {
  const key = type === "task" ? "taskIdCounter" : "categoryIdCounter";
  const currentId = parseInt(localStorage.getItem(key) || "0", 10);
  const nextId = currentId + 1;

  // Ensure it stays within 2-byte range (0-65535)
  if (nextId > 65535) {
    throw new Error(`${type} ID counter exceeded maximum value of 65535`);
  }

  localStorage.setItem(key, nextId.toString());
  return nextId;
}
