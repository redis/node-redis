import TestUtils from '@redis/test-utils';
import TimeSeries from '.';

export default TestUtils.createFromConfig({
  dockerImageName: 'redislabs/client-libs-test',
  dockerImageVersionArgument: 'redis-version',
  defaultDockerVersion: 'custom-21183968220-debian-amd64'
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
