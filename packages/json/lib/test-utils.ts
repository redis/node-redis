import TestUtils from '@redis/test-utils';
import RedisJSON from '.';

export default new TestUtils({
  dockerImageName: 'redislabs/client-libs-test',
  dockerImageVersionArgument: 'redisgraph-version',
  defaultDockerVersion: '8.0-M04-pre'
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
