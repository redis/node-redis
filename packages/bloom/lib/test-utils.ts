import TestUtils from '@redis/test-utils';
import RedisBloomModules from '.';

export default new TestUtils({
  dockerImageName: 'redislabs/client-libs-test',
  dockerImageVersionArgument: 'redisbloom-version',
  defaultDockerVersion: '8.0-M04-pre'
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
