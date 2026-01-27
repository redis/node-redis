import TestUtils from './index'

export const testUtils = TestUtils.createFromConfig({
  dockerImageName: 'redislabs/client-libs-test',
  dockerImageTagArgument: 'redis-tag',
  dockerImageVersionArgument: 'redis-version',
  defaultDockerVersion: { tag: 'custom-21183968220-debian-amd64', version: '8.6' }
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
