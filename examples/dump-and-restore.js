// This example demonstrates the use of the DUMP and RESTORE commands

import { commandOptions, createClient } from 'redis';

const client = createClient();
await client.connect();

// DUMP a specific key into a local variable
const dump = await client.dump(
    commandOptions({ returnBuffers: true }),
    'source'
);

// RESTORE into a new key
await client.restore('destination', 0, dump);

// RESTORE and REPLACE an existing key
await client.restore('destination', 0, dump, {
    REPLACE: true
});

await client.quit();
