import { createClient } from 'redis-local';

export default async (host, { batchSize }) => {
  const client = createClient({
    socket: {
      host
    },
    commandOptions: {
      timeout: 0
    },
    RESP: 3
  });

  await client.connect();

  return {
    benchmark() {
      const multi = client.multi();
      for (let i = 0; i < batchSize; i++) {
        multi.ping();
      }
      return multi.exec();
    },
    teardown() {
      return client.disconnect();
    }
  };
};
