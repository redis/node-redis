import { createClient } from '@node-redis/client-production';

const client = createClient();

export function setup() {
    return client.connect();
}

export function benchmark({ randomString }) {
    return Promise.all([
        client.set(randomString, randomString),
        client.get(randomString),
        client.del(randomString)
    ]);
}

export function teardown() {
    return client.disconnect();
}
