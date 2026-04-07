import TestUtils from '@redis/test-utils';
import RedisJSON from '.';

export default TestUtils.createFromConfig({
  dockerImageName: 'redislabs/client-libs-test',
  dockerImageTagArgument: 'redis-tag',
  dockerImageVersionArgument: 'redis-version',
  defaultDockerVersion: { tag: 'unstable-24425681442-debian', version: '8.8' }
});

export const GLOBAL = {
  SERVERS: {
    OPEN: {
      serverArguments: [],
      clientOptions: {
        RESP: 3 as const,
        modules: {
          json: RedisJSON
        }
      }
    }
  }
};
