// This example demonstrates a simple fixed-window rate limiter using Redis.
// It shows how to limit the number of requests a user (or IP address) can
// make within a given time window using the INCR and EXPIRE commands.
// This is one of the most common Redis patterns in production systems.
//
// The pattern works as follows:
//   1. On each request, INCR a key that represents the user + current window.
//   2. If the key is brand new (count === 1), set its TTL to the window size.
//   3. If the count exceeds the limit, reject the request.
//
// No setup required — this example creates all data itself.

import { createClient } from 'redis';

const client = createClient();

await client.connect();

// --- Configuration ---
const WINDOW_SIZE_IN_SECONDS = 60; // 1-minute window
const MAX_REQUESTS_PER_WINDOW = 5; // Allow at most 5 requests per minute

/**
 * Checks whether a given user is allowed to make a request.
 * Returns an object with `allowed` (boolean) and `remaining` (number of requests left).
 *
 * @param {string} userId - A unique identifier for the user (e.g. user ID or IP).
 */
async function isRequestAllowed(userId) {
  // Build a key scoped to the current time window (rounded to the minute)
  const windowStart = Math.floor(Date.now() / (WINDOW_SIZE_IN_SECONDS * 1000));
  const rateLimitKey = `rate_limit:${userId}:${windowStart}`;

  // Atomically increment the counter for this user in this window
  const currentCount = await client.incr(rateLimitKey);

  if (currentCount === 1) {
    // This is the first request in the window — set the key to expire
    // automatically when the window closes so Redis self-cleans.
    await client.expire(rateLimitKey, WINDOW_SIZE_IN_SECONDS);
  }

  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - currentCount);
  const allowed = currentCount <= MAX_REQUESTS_PER_WINDOW;

  return { allowed, remaining, currentCount };
}

// --- Simulate 7 rapid requests from the same user ---
const userId = 'user:42';

console.log(`Rate limit: ${MAX_REQUESTS_PER_WINDOW} requests / ${WINDOW_SIZE_IN_SECONDS}s\n`);

for (let i = 1; i <= 7; i++) {
  const { allowed, remaining, currentCount } = await isRequestAllowed(userId);

  if (allowed) {
    console.log(
      `Request ${i} — ✅ ALLOWED  (count: ${currentCount}, remaining: ${remaining})`
    );
  } else {
    console.log(
      `Request ${i} — ❌ RATE LIMITED  (count: ${currentCount}, limit: ${MAX_REQUESTS_PER_WINDOW})`
    );
  }
}

await client.quit();
