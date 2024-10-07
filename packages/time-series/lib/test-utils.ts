import TestUtils from '@redis/test-utils';
import TimeSeries from '.';

export default new TestUtils({
  dockerImageName: 'redis/redis-stack',
  dockerImageVersionArgument: 'timeseries-version',
  defaultDockerVersion: '7.4.0-v1'
});

export const GLOBAL = {
  SERVERS: {
    OPEN: {
      serverArguments: [],
      clientOptions: {
        modules: {
          ts: TimeSeries
        }
      }
    }
  }
};
