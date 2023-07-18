import { createClient } from '@redis/client';
import RedisJSON from '.';

const client = createClient({
  modules: {
    json: RedisJSON,
    JSON: RedisJSON
  }
});

client.JSON.