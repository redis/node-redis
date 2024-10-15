import { createClient } from 'redis-local';
import PING from 'redis-local/dist/lib/commands/PING.js';

export default async (host) => {
  const client = createClient({
    socket: {
      host
    },
    RESP: 3,
    modules: {
      module: {
        ping: PING.default
      }
    }
  });

  await client.connect();

  return {
    benchmark() {
      return client.withTypeMapping({}).module.ping();
    },
    teardown() {
      return client.disconnect();
    }
  };
};
