import TestUtils from '@redis/test-utils';
import RedisGraph from '.';

export default new TestUtils({
  dockerImageName: 'redis/redis-stack',
  dockerImageVersionArgument: 'redisgraph-version',
  defaultDockerVersion: '7.4.0-v1'
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
