import TestUtils from '@redis/test-utils';
import RediSearch from '.';
import { RespVersions } from '@redis/client';

export default TestUtils.createDefault();

export const GLOBAL = {
  SERVERS: {
    OPEN: {
      serverArguments: [],
      clientOptions: {
        RESP: 3 as const,
        modules: {
          ft: RediSearch
        }
      }
    },
    OPEN_3: {
      serverArguments: [],
      clientOptions: {
        RESP: 3 as RespVersions,
        modules: {
          ft: RediSearch
        }
      }
    },
    OPEN_UNSTABLE: {
      serverArguments: ['--search-enable-unstable-features', 'yes'],
      clientOptions: {
        RESP: 3 as const,
        modules: {
          ft: RediSearch
        }
      }
    }
  }
};
