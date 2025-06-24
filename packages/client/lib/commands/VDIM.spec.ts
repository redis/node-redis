import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import VDIM from './VDIM';
import { BasicCommandParser } from '../client/parser';

describe('VDIM', () => {
  it('parseCommand', () => {
    const parser = new BasicCommandParser();
    VDIM.parseCommand(parser, 'key');
    assert.deepEqual(
      parser.redisArgs,
      ['VDIM', 'key']
    );
  });

  testUtils.testAll('vDim', async client => {
    await client.vAdd('key', [1.0, 2.0, 3.0], 'element');

    assert.equal(
      await client.vDim('key'),
      3
    );
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 0] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 0] }
  });

  testUtils.testWithClient('vDim with RESP3', async client => {
    await client.vAdd('resp3-5d', [1.0, 2.0, 3.0, 4.0, 5.0], 'elem5d');

    assert.equal(
      await client.vDim('resp3-5d'),
      5
    );

  }, {
    ...GLOBAL.SERVERS.OPEN,
    clientOptions: {
      RESP: 3
    },
    minimumDockerVersion: [8, 0]
  });
});
