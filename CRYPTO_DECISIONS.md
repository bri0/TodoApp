# Cryptography Implementation Decisions

## Question: Why not use Node.js native crypto instead of libsodium-wrappers?

Great question! Here's the detailed analysis:

## The Constraint

The **frontend uses libsodium's sealed box** (`crypto_box_seal`) for encryption:

- Specific format: ephemeral keypair + X25519 key exchange + XSalsa20-Poly1305
- The server MUST produce ciphertext the frontend can decrypt
- Changing crypto requires changing both frontend AND backend

## Option 1: Pure Node.js Crypto (Native)

**Pros:**

- ZERO cold start overhead
- No external dependencies
- Smaller bundle size

**Cons:**

- Node.js doesn't have `crypto_box_seal` built-in
- Would need to manually implement sealed box construction:
  ```
  1. Generate ephemeral X25519 keypair
  2. Perform X25519(ephemeral_sk, recipient_pk)
  3. Derive symmetric key using BLAKE2b
  4. Encrypt with XSalsa20-Poly1305
  5. Prepend ephemeral public key (32 bytes) to ciphertext
  ```
- High risk of implementation bugs
- Compatibility issues if libsodium format changes
- Would need extensive testing

**Verdict:** Possible but risky and time-consuming

## Option 2: TweetNaCl + Sealed Box Library

**Pros:**

- Faster cold start (~100ms vs ~300ms)
- Smaller bundle (~25KB vs ~200KB)
- Pure JavaScript

**Cons:**

- Still external dependencies
- Needs `tweetnacl-sealedbox-js` for sealed box
- Less battle-tested than libsodium
- Potential compatibility issues

**Verdict:** Better performance, slightly more risk

## Option 3: libsodium-wrappers (CHOSEN)

**Pros:**

- **100% compatibility** with frontend (same library)
- Battle-tested, widely used
- Correct sealed box implementation guaranteed
- Same API on client and server (easier to maintain)
- Security-critical code should use proven implementations

**Cons:**

- ~200-300ms cold start (WASM initialization)
- Larger bundle (~200KB)

**Verdict:** Best choice for security and maintainability

## Why Cold Start is Acceptable

1. **Vercel Function Reuse**: After first invocation, the container stays warm

   - First request: ~300ms initialization
   - Subsequent requests: < 10ms (no initialization)

2. **Typical Usage Pattern**: Users sync periodically, not constantly

   - Most requests hit warm containers
   - Cold starts are rare in production

3. **300ms is Acceptable**: For security-critical encryption operations
   - Total API latency budget: ~2000ms for sync
   - Initialization: 300ms (15%)
   - Database: 50-100ms
   - Encryption: 20-50ms
   - Network: ~500ms
   - Still well under budget

## Performance Optimizations Applied

```typescript
// Cache initialization to prevent repeated initialization
let sodiumInitialized = false;
async function initSodium() {
  if (!sodiumInitialized) {
    await sodium.ready;
    sodiumInitialized = true;
  }
}
```

This ensures:

- First request initializes (one-time 300ms cost)
- All subsequent requests in same container: instant
- If container is recycled, new container initializes once

## Alternative: Hybrid Approach

If cold start becomes a real issue, we could:

1. **Use Node.js crypto for hashing** (already doing this)

   ```typescript
   export async function sha256(input: string): Promise<string> {
     return createHash("sha256").update(input).digest("hex");
   }
   ```

2. **Keep libsodium for sealed box encryption**
   - Only encryption operations pay the cold start cost
   - Validation operations (90% of API calls) are instant

## Monitoring Recommendation

Add timing metrics to track:

```typescript
const start = Date.now();
await initSodium();
const initTime = Date.now() - start;
console.log(`Sodium initialization: ${initTime}ms`);
```

If cold starts become an issue (> 500ms p95), we can:

1. Implement sealed box manually with Node.js crypto
2. Switch to provisioned concurrency on Vercel
3. Use a pre-warmed function pool

## Conclusion

**We use libsodium-wrappers** because:

- Security > Performance for encryption
- 300ms cold start is acceptable in context
- Compatibility with frontend is guaranteed
- Proven, battle-tested implementation
- Easier to maintain (same library everywhere)

**We optimize by:**

- Caching initialization state
- Using Node.js native crypto where possible (hashing)
- Relying on Vercel's container reuse

This is the right tradeoff for a security-focused application.
