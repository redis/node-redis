import TestUtils from '@redis/test-utils';
import RedisGraph from '.';

export default new TestUtils({
  dockerImageName: 'redis',
  dockerImageVersionArgument: 'redisgraph-version',
  defaultDockerVersion: '8.0-M01'
});

export const GLOBAL = {
  SERVERS: {
    OPEN: {
      serverArguments: [],
      clientOptions: {
        modules: {
          graph: RedisGraph
        }
      }
    }
  }
};
