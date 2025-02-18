import TestUtils from '@redis/test-utils';
import RediSearch from '.';
import { RespVersions } from '@redis/client';

export default new TestUtils({
    dockerImageName: 'redislabs/client-libs-test',
    dockerImageVersionArgument: 'redisearch-version',
    defaultDockerVersion: '8.0-M04-pre'
});

export const GLOBAL = {
  SERVERS: {
    OPEN: {
      serverArguments: [],
      clientOptions: {
        modules: {
          ft: RediSearch
        }
      }
    },
    OPEN_3: {
      serverArguments: [],
      clientOptions: {
        RESP: 3 as RespVersions,
        unstableResp3:true,
        modules: {
          ft: RediSearch
        }
      }
    }
  }
};
