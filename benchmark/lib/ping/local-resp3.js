import { createClient } from 'redis-local';

export default async (host) => {
  const client = createClient({
    socket: {
      host
    },
    RESP: 3
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
