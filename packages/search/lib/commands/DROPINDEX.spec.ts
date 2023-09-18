import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DROPINDEX from './DROPINDEX';
import { SCHEMA_FIELD_TYPE } from './CREATE';

describe('FT.DROPINDEX', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        DROPINDEX.transformArguments('index'),
        ['FT.DROPINDEX', 'index']
      );
    });

    it('with DD', () => {
      assert.deepEqual(
        DROPINDEX.transformArguments('index', { DD: true }),
        ['FT.DROPINDEX', 'index', 'DD']
      );
    });
  });

  testUtils.testWithClient('client.ft.dropIndex', async client => {
    const [, reply] = await Promise.all([
      client.ft.create('index', {
        field: SCHEMA_FIELD_TYPE.TEXT
      }),
      client.ft.dropIndex('index')
    ]);

    assert.equal(reply, 'OK');
  }, GLOBAL.SERVERS.OPEN);
});
