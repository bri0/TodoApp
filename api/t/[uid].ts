import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  initializeDatabase,
  testConnection,
  getUser,
  createUser,
  getUserData,
  saveUserData,
} from "../../src/server/db";
import { encryptData, validatePublicKeyHash } from "../../src/server/crypto";
import type { SyncRequest, SyncResponse } from "../../src/server/types";

// Initialize database on cold start
// Use a promise to prevent race conditions during concurrent requests
let initializationPromise: Promise<void> | null = null;

async function ensureInitialized() {
  if (initializationPromise) {
    // Wait for existing initialization to complete
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = (async () => {
    console.log("Initializing database...");
    const connected = await testConnection();
    if (!connected) {
      throw new Error("Failed to connect to database");
    }
    await initializeDatabase();
    console.log("Database initialized successfully");
  })();

  try {
    await initializationPromise;
  } catch (error) {
    // Reset on error so next request can retry
    initializationPromise = null;
    throw error;
  }
}

/**
 * Vercel Serverless Function Handler
 * POST /api/t/:uid - Sync data (auto-registers on first sync)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Ensure database is initialized
    await ensureInitialized();

    // Get UID from query parameter
    const { uid } = req.query;

    if (!uid || typeof uid !== "string") {
      return res.status(400).json({ error: "Missing or invalid UID parameter" });
    }

    const decodedUid = decodeURIComponent(uid);
    const body = req.body as SyncRequest;
    const { publicKeyHash, publicKey, data, merged } = body;

    // Validate required fields
    if (!publicKeyHash || !publicKey || !data) {
      return res.status(400).json({
        error: "Missing required fields: publicKeyHash, publicKey, data",
      });
    }

    // Validate public key hash
    const isValid = await validatePublicKeyHash(publicKey, publicKeyHash);
    if (!isValid) {
      return res.status(403).json({ error: "Invalid user ID or password" });
    }

    // Check if user exists
    let user = await getUser(decodedUid);

    // AUTO-REGISTER: If user doesn't exist, create them
    if (!user) {
      console.log(`Auto-registering new user: ${decodedUid}`);
      await createUser({ uid: decodedUid, publicKeyHash, publicKey });
      user = await getUser(decodedUid);

      if (!user) {
        throw new Error("Failed to create user");
      }
    }

    // Validate public key hash matches (prevent wrong password)
    if (user.public_key_hash !== publicKeyHash) {
      console.log(`Invalid credentials for user: ${decodedUid}`);
      return res.status(403).json({ error: "Invalid user ID or password" });
    }

    // Get existing data
    const existingData = await getUserData(decodedUid);

    // If no existing data OR merged data is being sent back
    if (!existingData || !existingData.encrypted_data || merged === true) {
      // Encrypt client's data
      const dataString = JSON.stringify(data);
      const encryptedData = await encryptData(dataString, user.public_key);

      // Save to database
      const newVersion = await saveUserData(decodedUid, encryptedData, existingData?.version);

      console.log(`Data saved for user: ${decodedUid} (version ${newVersion})`);

      // Return the encrypted data
      const response: SyncResponse = {
        encryptedData,
        version: newVersion,
        needsMerge: false,
      };

      return res.status(200).json(response);
    } else {
      // Return existing encrypted data for client to merge
      console.log(
        `Returning existing data for user: ${decodedUid} (version ${existingData.version})`,
      );

      const response: SyncResponse = {
        encryptedData: existingData.encrypted_data,
        version: existingData.version,
        needsMerge: true,
      };

      return res.status(200).json(response);
    }
  } catch (error) {
    console.error("Error handling request:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
