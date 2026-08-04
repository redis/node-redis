import TestUtils from '@redis/test-utils';
import RedisBloomModules from '.';

export default TestUtils.createDefault();

export const GLOBAL = {
  SERVERS: {
    OPEN: {
      serverArguments: [],
      clientOptions: {
        RESP: 3 as const,
        modules: RedisBloomModules
      }
    }
  }
};
