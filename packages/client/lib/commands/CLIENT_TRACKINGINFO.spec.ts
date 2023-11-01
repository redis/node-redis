import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import CLIENT_TRACKINGINFO from './CLIENT_TRACKINGINFO';

describe('CLIENT TRACKINGINFO', () => {
  testUtils.isVersionGreaterThanHook([6, 2]);

  it('transformArguments', () => {
    assert.deepEqual(
      CLIENT_TRACKINGINFO.transformArguments(),
      ['CLIENT', 'TRACKINGINFO']
    );
  });

  testUtils.testWithClient('client.clientTrackingInfo', async client => {
    assert.deepEqual(
      await client.clientTrackingInfo(),
      {
        flags: ['off'],
        redirect: -1,
        prefixes: []
      }
    );
  }, GLOBAL.SERVERS.OPEN);
});
