import TestUtils from '@redis/test-utils';
import RediSearch from '.';
import { RespVersions } from '@redis/client';

export default TestUtils.createFromConfig({
  dockerImageName: 'redislabs/client-libs-test',
  dockerImageTagArgument: 'redis-tag',
  dockerImageVersionArgument: 'redis-version',
  defaultDockerVersion: { tag: '8.8-m03', version: '8.8' }
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
