import { createClient, RESP_TYPES } from 'redis-local';

export default async (host) => {
  const client = createClient({
    socket: {
      host
    },
    commandOptions: {
      [RESP_TYPES.SIMPLE_STRING]: Buffer
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
