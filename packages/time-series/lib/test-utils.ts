import TestUtils from '@redis/test-utils';
import TimeSeries from '.';

export default new TestUtils({
  dockerImageName: 'redislabs/client-libs-test',
  dockerImageVersionArgument: 'timeseries-version',
  defaultDockerVersion: '8.0-M04-pre'
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
