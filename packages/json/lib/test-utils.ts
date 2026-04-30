import TestUtils from '@redis/test-utils';
import RedisJSON from '.';

export default TestUtils.createFromConfig({
  dockerImageName: 'redislabs/client-libs-test',
  dockerImageTagArgument: 'redis-tag',
  dockerImageVersionArgument: 'redis-version',
  defaultDockerVersion: { tag: '8.8-m03', version: '8.8' }
});

export const GLOBAL = {
  SERVERS: {
    OPEN: {
      serverArguments: [],
      clientOptions: {
        modules: {
          json: RedisJSON
        }
      }
    }
  }
};
