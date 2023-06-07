// This example demonstrates the use of DUMP and RESTORE functionalities

import { commandOptions, createClient } from 'redis';

const client = createClient();
await client.connect();

// DUMP a specific key into a local variable
const firstValueDump = await client.dump(
    commandOptions({ returnBuffers: true }),
    'FirstKey'
);

// RESTORE into a new key
await client.restore('newKey', 0, firstValueDump);

// DUMP a different key a local variable
const secondValueDump = await client.dump(
    commandOptions({ returnBuffers: true }),
    'FirstKey'
);

// RESTORE into an existing key
await client.restore('newKey', 0, secondValueDump, {
    REPLACE: true
});

// RESTORE into an new key with TTL
await client.restore('TTLKey', 60000, secondValueDump);

await client.quit();
