import TestUtils from '@redis/test-utils';
import RediSearch from '.';
import { RespVersions } from '@redis/client';

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
