import TestUtils from '@redis/test-utils';
import RedisBloomModules from '.';

export default new TestUtils({
  dockerImageName: 'redis/redis-stack',
  dockerImageVersionArgument: 'redisbloom-version',
  defaultDockerVersion: '7.4.0-v1'
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
