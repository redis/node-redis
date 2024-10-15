import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import BITFIELD from './BITFIELD';
import { parseArgs } from './generic-transformers';

describe('BITFIELD', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      parseArgs(BITFIELD, 'key', [{
        operation: 'OVERFLOW',
        behavior: 'WRAP'
      }, {
        operation: 'GET',
        encoding: 'i8',
        offset: 0
      }, {
        operation: 'OVERFLOW',
        behavior: 'SAT'
      }, {
        operation: 'SET',
        encoding: 'i16',
        offset: 1,
        value: 0
      }, {
        operation: 'OVERFLOW',
        behavior: 'FAIL'
      }, {
        operation: 'INCRBY',
        encoding: 'i32',
        offset: 2,
        increment: 1
      }]),
      ['BITFIELD', 'key', 'OVERFLOW', 'WRAP', 'GET', 'i8', '0', 'OVERFLOW', 'SAT', 'SET', 'i16', '1', '0', 'OVERFLOW', 'FAIL', 'INCRBY', 'i32', '2', '1']
    );
  });

  testUtils.testAll('bitField', async client => {
    const a = client.bitField('key', [{
      operation: 'GET',
      encoding: 'i8',
      offset: 0
    }]);
    
    assert.deepEqual(
      await client.bitField('key', [{
        operation: 'GET',
        encoding: 'i8',
        offset: 0
      }]),
      [0]
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
