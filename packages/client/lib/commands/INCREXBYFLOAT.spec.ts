import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import INCREXBYFLOAT from './INCREXBYFLOAT';
import { parseArgs } from './generic-transformers';

describe('INCREXBYFLOAT', () => {
  describe('transformArguments', () => {
    it('basic', () => {
      assert.deepEqual(
        parseArgs(INCREXBYFLOAT, 'key', 0.25),
        ['INCREX', 'key', 'BYFLOAT', '0.25']
      );
    });

    it('negative', () => {
      assert.deepEqual(
        parseArgs(INCREXBYFLOAT, 'key', -0.5),
        ['INCREX', 'key', 'BYFLOAT', '-0.5']
      );
    });

    it('accepts string for precision-safe big values', () => {
      assert.deepEqual(
        parseArgs(INCREXBYFLOAT, 'key', '1.234567890123456789'),
        ['INCREX', 'key', 'BYFLOAT', '1.234567890123456789']
      );
    });

    it('with bounds', () => {
      assert.deepEqual(
        parseArgs(INCREXBYFLOAT, 'key', 1.5, { lowerBound: 0, upperBound: 100 }),
        ['INCREX', 'key', 'BYFLOAT', '1.5', 'LBOUND', '0', 'UBOUND', '100']
      );
    });

    it('with SATURATE', () => {
      assert.deepEqual(
        parseArgs(INCREXBYFLOAT, 'key', 5, { upperBound: 2, saturate: true }),
        ['INCREX', 'key', 'BYFLOAT', '5', 'UBOUND', '2', 'SATURATE']
      );
    });

    it('expiration EX with ENX', () => {
      assert.deepEqual(
        parseArgs(INCREXBYFLOAT, 'key', 1.5, { expiration: { type: 'EX', value: 60, ENX: true } }),
        ['INCREX', 'key', 'BYFLOAT', '1.5', 'EX', '60', 'ENX']
      );
    });

    it('expiration PERSIST', () => {
      assert.deepEqual(
        parseArgs(INCREXBYFLOAT, 'key', 1.5, { expiration: { type: 'PERSIST' } }),
        ['INCREX', 'key', 'BYFLOAT', '1.5', 'PERSIST']
      );
    });
  });

  testUtils.testAll('incrExByFloat basic increment', async client => {
    await client.set('key', '1.5');
    const reply = await client.incrExByFloat('key', 0.25);
    assert.ok(Math.abs(Number(reply[0]) - 1.75) < 1e-9);
    assert.ok(Math.abs(Number(reply[1]) - 0.25) < 1e-9);
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 8] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 8] }
  });

  testUtils.testAll('incrExByFloat negative', async client => {
    await client.set('key', '1.5');
    const reply = await client.incrExByFloat('key', -0.5);
    assert.ok(Math.abs(Number(reply[0]) - 1) < 1e-9);
    assert.ok(Math.abs(Number(reply[1]) - -0.5) < 1e-9);
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 8] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 8] }
  });

  testUtils.testAll('incrExByFloat SATURATE clamps at upper bound', async client => {
    await client.set('key', '1.5');
    const reply = await client.incrExByFloat('key', 5, { upperBound: 2, saturate: true });
    assert.ok(Math.abs(Number(reply[0]) - 2) < 1e-9);
    assert.ok(Math.abs(Number(reply[1]) - 0.5) < 1e-9);
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 8] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 8] }
  });

  testUtils.testAll('incrExByFloat out-of-bounds rejected (no SATURATE) returns 0 as actualIncrement', async client => {
    await client.set('key', '1.5');
    const reply = await client.incrExByFloat('key', 5, { upperBound: 2 });
    assert.ok(Math.abs(Number(reply[0]) - 1.5) < 1e-9);
    assert.equal(Number(reply[1]), 0);
  }, {
    client: { ...GLOBAL.SERVERS.OPEN, minimumDockerVersion: [8, 8] },
    cluster: { ...GLOBAL.CLUSTERS.OPEN, minimumDockerVersion: [8, 8] }
  });
});
