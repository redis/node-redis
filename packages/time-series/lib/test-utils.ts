import TestUtils from '@redis/test-utils';
import TimeSeries from '.';

export default TestUtils.createDefault();

export const GLOBAL = {
  SERVERS: {
    OPEN: {
      serverArguments: [],
      clientOptions: {
        RESP: 3 as const,
        modules: {
          ts: TimeSeries
        }
      }
    }
  }
};
