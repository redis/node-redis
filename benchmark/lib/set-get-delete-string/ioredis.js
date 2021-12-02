import Redis from 'ioredis';

const client = new Redis({ lazyConnect: true });

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
