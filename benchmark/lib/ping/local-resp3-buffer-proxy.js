import { createClient, RESP_TYPES } from 'redis-local';

export default async (host) => {
  const client = createClient({
    socket: {
      host
    },
    RESP: 3
  }).withTypeMapping({
    [RESP_TYPES.SIMPLE_STRING]: Buffer
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
