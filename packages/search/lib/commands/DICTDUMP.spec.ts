import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import DICTDUMP from './DICTDUMP';

describe('FT.DICTDUMP', () => {
  it('transformArguments', () => {
    assert.deepEqual(
      DICTDUMP.transformArguments('dictionary'),
      ['FT.DICTDUMP', 'dictionary']
    );
  });

  testUtils.testWithClient('client.ft.dictDump', async client => {
    const [, reply] = await Promise.all([
      client.ft.dictAdd('dictionary', 'string'),
      client.ft.dictDump('dictionary')
    ]);

    assert.deepEqual(reply, ['string']);
  }, GLOBAL.SERVERS.OPEN);
});
