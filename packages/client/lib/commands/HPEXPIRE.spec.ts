import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import HPEXPIRE from './HPEXPIRE';

describe('HPEXPIRE', () => {
  testUtils.isVersionGreaterThanHook([7, 4]);
  
  describe('transformArguments', () => {
    it('string', () => {
      assert.deepEqual(
        HPEXPIRE.transformArguments('key', 'field', 1),
        ['HPEXPIRE', 'key', '1', '1', 'field']
      );
    });

    it('array', () => {
      assert.deepEqual(
        HPEXPIRE.transformArguments('key', ['field1', 'field2'], 1),
        ['HPEXPIRE', 'key', '1', '2', 'field1', 'field2']
      );
    });

    it('with set option', () => {
      assert.deepEqual(
        HPEXPIRE.transformArguments('key', ['field1'], 1, 'NX'),
        ['HPEXPIRE', 'key', '1', 'NX', '1', 'field1']
      );
    });
  });

  testUtils.testAll('hpRxpire', async client => {
    assert.equal(
      await client.hpExpire('key', ['field'], 0),
      null
    );
  }, {
    client: GLOBAL.SERVERS.OPEN,
    cluster: GLOBAL.CLUSTERS.OPEN
  });
});
