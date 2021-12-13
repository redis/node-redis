import Redis from 'ioredis';

export default async (host) => {
    const client = new Redis({
        host,
        lazyConnect: true
    });

    await client.connect();

    return {
        benchmark() {
            return client.ping();
        },
        teardown() {
            return client.disconnect();
        }
    }
};
