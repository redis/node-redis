// Rate limit requests with the Redis GCRA command (Redis 8.8+).

import { createClient } from 'redis';

const client = createClient();
await client.connect();

const key = 'rate-limit:user:42';
await client.del(key);

const maxBurst = 2;
const tokensPerPeriod = 5;
const periodSeconds = 1;

console.log('Basic rate limiting (5 requests/second with burst=2)');
for (let i = 1; i <= 5; i++) {
  const { limited, maxRequests, availableRequests, retryAfter, fullBurstAfter } =
    await client.gcra(key, maxBurst, tokensPerPeriod, periodSeconds);

  console.log(
    `Attempt ${i}: limited=${limited}, max=${maxRequests}, available=${availableRequests}, retryAfter=${retryAfter}, fullBurstAfter=${fullBurstAfter}`
  );
}

console.log('\nWeighted request using TOKENS=2');
const weighted = await client.gcra(key, maxBurst, tokensPerPeriod, periodSeconds, 2);
console.log(weighted);

await client.close();
