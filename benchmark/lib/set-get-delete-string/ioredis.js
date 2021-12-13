import Redis from 'ioredis';

export default async (host, { randomString }) => {
    const client = new Redis({
        host,
        lazyConnect: true
    });

    await client.connect();

    return {
        benchmark() {
            return Promise.all([
                client.set(randomString, randomString),
                client.get(randomString),
                client.del(randomString)
            ]);
        },
        teardown() {
            return client.disconnect();
        }
    }
};
