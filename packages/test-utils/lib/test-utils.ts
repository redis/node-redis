import TestUtils from './index'

export const testUtils = TestUtils.createFromConfig({
  dockerImageName: 'redislabs/client-libs-test',
  dockerImageVersionArgument: 'redis-version',
  defaultDockerVersion: '8.2.1-pre'
});



export const DEBUG_MODE_ARGS = testUtils.isVersionGreaterThan([7]) ?
  ['--enable-debug-command', 'yes'] :
  [];

export const GLOBAL = {
  SERVERS: {

    OPEN_RESP_3: {
      serverArguments: [...DEBUG_MODE_ARGS],
      clientOptions: {
        RESP: 3,
      }
    },
  }
}
