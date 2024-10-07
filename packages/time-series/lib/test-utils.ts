import TestUtils from '@redis/test-utils';
import TimeSeries from '.';

export default new TestUtils({
  dockerImageName: 'redis',
  dockerImageVersionArgument: 'timeseries-version',
  defaultDockerVersion: '8.0-M01'
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
