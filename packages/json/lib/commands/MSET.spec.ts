import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import MSET from './MSET';
import { parseArgs } from '@redis/client/lib/commands/generic-transformers';

describe('JSON.MSET', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(MSET, [{
        key: '1',
        path: '$',
        value: 1
      }, {
        key: '2',
        path: '$',
        value: '2'
      }]),
      ['JSON.MSET', '1', '$', '1', '2', '$', '"2"']
    );
  });

  testUtils.testWithClient('client.json.mSet', async client => {
    assert.equal(
      await client.json.mSet([{
        key: '1',
        path: '$',
        value: 1
      }, {
        key: '2',
        path: '$',
        value: '2'
      }]),
      'OK'
    );
  }, GLOBAL.SERVERS.OPEN);
});
