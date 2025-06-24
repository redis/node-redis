import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VCARD from './VCARD';
import { BasicCommandParser } from '../client/parser';

describe('VCARD', () => {
  it('parseCommand', () => {
    const parser = new BasicCommandParser();
    VCARD.parseCommand(parser, 'key')
    assert.deepEqual(
      parser.redisArgs,
      ['VCARD', 'key']
    );
  });

  testUtils.testAll('vCard', async client => {
    await client.vAdd('key', [1.0, 2.0, 3.0], 'element1');
    await client.vAdd('key', [4.0, 5.0, 6.0], 'element2');

    assert.equal(
      await client.vCard('key'),
      2
    );

    assert.equal(await client.vCard('unknown'), 0);
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 0] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 0] }
  });

  testUtils.testWithClient('vCard with RESP3', async client => {
    // Test empty vector set
    assert.equal(
      await client.vCard('resp3-empty-key'),
      0
    );

    // Add elements and test cardinality
    await client.vAdd('resp3-key', [1.0, 2.0], 'elem1');
    assert.equal(
      await client.vCard('resp3-key'),
      1
    );

    await client.vAdd('resp3-key', [3.0, 4.0], 'elem2');
    await client.vAdd('resp3-key', [5.0, 6.0], 'elem3');
    assert.equal(
      await client.vCard('resp3-key'),
      3
    );

    assert.equal(await client.vCard('unknown'), 0);
  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 3
    },
    minimumDockerVersion: [8, 0]
  });
});
