import { createClient } from 'redis-v4';

export default async (host) => {
    const client = createClient({
        socket: {
            host
        }
    });

    await client.connect();

    return {
        benchmark() {
            return client.ping();
        },
        teardown() {
            return client.disconnect();
        }
    };
};
