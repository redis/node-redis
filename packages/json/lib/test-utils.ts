import TestUtils from '@redis/test-utils';
import RedisJSON from '.';

export default new TestUtils({
  dockerImageName: 'redis',
  dockerImageVersionArgument: 'redis-version',
  defaultDockerVersion: '8.0-M01'
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
