import TestUtils from '@redis/test-utils';
import RedisBloomModules from '.';

export default new TestUtils({
  dockerImageName: 'redis',
  dockerImageVersionArgument: 'redisbloom-version',
  defaultDockerVersion: '8.0-M01'
});

export const GLOBAL = {
  SERVERS: {
    OPEN: {
      serverArguments: [],
      clientOptions: {
        modules: RedisBloomModules
      }
    }
  }
};
