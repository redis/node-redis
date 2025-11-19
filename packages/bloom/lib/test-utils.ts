import TestUtils from '@redis/test-utils';
import RedisBloomModules from '.';

export default  TestUtils.createFromConfig({
  dockerImageName: 'redislabs/client-libs-test',
  dockerImageVersionArgument: 'redis-version',
  defaultDockerVersion: '8.4.0'
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
