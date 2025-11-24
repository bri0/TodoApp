import postgres from "postgres";
import type { User, UserData, RegisterRequest } from "./types";

// Initialize postgres connection for serverless
// This is optimized for serverless environments with better connection handling
const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: "require",
  max: 1, // Serverless works best with minimal connections
  idle_timeout: 20,
  connect_timeout: 10,
  transform: {
    undefined: null, // Transform undefined to null for PostgreSQL
  },
});

/**
 * Initialize database schema
 * Creates tables if they don't exist
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        public_key_hash TEXT NOT NULL UNIQUE,
        public_key TEXT NOT NULL,
        created_at BIGINT NOT NULL
      )
    `;

    // Create index on public_key_hash for fast lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_public_key_hash
      ON users(public_key_hash)
    `;

    // Create user_data table
    await sql`
      CREATE TABLE IF NOT EXISTS user_data (
        uid TEXT PRIMARY KEY REFERENCES users(uid) ON DELETE CASCADE,
        encrypted_data TEXT,
        version BIGINT NOT NULL DEFAULT 0,
        updated_at BIGINT NOT NULL
      )
    `;

    console.log("Database schema initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await sql`SELECT NOW()`;
    console.log("Database connection successful:", result[0]?.now);
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

/**
 * Check if a user ID exists
 */
export async function userExists(uid: string): Promise<boolean> {
  const result = await sql`SELECT 1 FROM users WHERE uid = ${uid}`;
  return result.length > 0;
}

/**
 * Get user by UID
 */
export async function getUser(uid: string): Promise<User | null> {
  const result = await sql<User[]>`
    SELECT uid, public_key_hash, public_key, created_at
    FROM users
    WHERE uid = ${uid}
  `;

  const row = result[0];
  if (!row) return null;

  // Ensure created_at is a number
  return {
    ...row,
    created_at: Number(row.created_at),
  };
}

/**
 * Create a new user
 */
export async function createUser(data: RegisterRequest): Promise<void> {
  const { uid, publicKeyHash, publicKey } = data;
  const createdAt = Date.now();

  await sql`
    INSERT INTO users (uid, public_key_hash, public_key, created_at)
    VALUES (${uid}, ${publicKeyHash}, ${publicKey}, ${createdAt})
  `;
}

/**
 * Get user data (encrypted)
 */
export async function getUserData(uid: string): Promise<UserData | null> {
  const result = await sql<UserData[]>`
    SELECT uid, encrypted_data, version, updated_at
    FROM user_data
    WHERE uid = ${uid}
  `;

  const row = result[0];
  if (!row) return null;

  // Ensure version and updated_at are numbers
  return {
    ...row,
    version: Number(row.version),
    updated_at: Number(row.updated_at),
  };
}

/**
 * Save encrypted user data
 */
export async function saveUserData(
  uid: string,
  encryptedData: string,
  version?: number,
): Promise<number> {
  const updatedAt = Date.now();
  const currentVersion = version !== undefined ? Number(version) : 0;
  const newVersion = currentVersion + 1;

  await sql`
    INSERT INTO user_data (uid, encrypted_data, version, updated_at)
    VALUES (${uid}, ${encryptedData}, ${newVersion}, ${updatedAt})
    ON CONFLICT (uid) DO UPDATE
    SET encrypted_data = ${encryptedData},
        version = ${newVersion},
        updated_at = ${updatedAt}
  `;

  return newVersion;
}

/**
 * Close database connection (for cleanup)
 */
export async function closeDatabase(): Promise<void> {
  await sql.end();
  console.log("Database connection closed");
}
