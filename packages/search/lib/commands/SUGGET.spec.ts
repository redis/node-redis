import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import SUGGET from './SUGGET';

describe('FT.SUGGET', () => {
  describe('transformArguments', () => {
    it('without options', () => {
      assert.deepEqual(
        SUGGET.transformArguments('key', 'prefix'),
        ['FT.SUGGET', 'key', 'prefix']
      );
    });

    it('with FUZZY', () => {
      assert.deepEqual(
        SUGGET.transformArguments('key', 'prefix', { FUZZY: true }),
        ['FT.SUGGET', 'key', 'prefix', 'FUZZY']
      );
    });

    it('with MAX', () => {
      assert.deepEqual(
        SUGGET.transformArguments('key', 'prefix', { MAX: 10 }),
        ['FT.SUGGET', 'key', 'prefix', 'MAX', '10']
      );
    });
  });

  describe('client.ft.sugGet', () => {
    testUtils.testWithClient('null', async client => {
      assert.equal(
        await client.ft.sugGet('key', 'prefix'),
        null
      );
    }, GLOBAL.SERVERS.OPEN);

    testUtils.testWithClient('with suggestions', async client => {
      const [, reply] = await Promise.all([
        client.ft.sugAdd('key', 'string', 1),
        client.ft.sugGet('key', 's')
      ]);

      assert.deepEqual(reply, ['string']);
    }, GLOBAL.SERVERS.OPEN);
  });
});
