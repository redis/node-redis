import { strict as assert } from 'node:assert';
import RedisCluster from '.';

describe('Cluster batch routing', () => {
  it('passes the selected slot to MULTI execution', async () => {
    const cluster = RedisCluster.create({ rootNodes: [] });
    let capturedSlotNumber: number | undefined;

    const fakeClient = {
      _executeMulti: async (_commands: unknown, _selectedDB?: number, slotNumber?: number) => {
        capturedSlotNumber = slotNumber;
        return ['OK'];
      }
    };

    cluster._slots.getClientAndSlotNumber = async () => ({
      client: fakeClient as never,
      slotNumber: 123
    });

    assert.deepEqual(
      await cluster.multi()
        .sendCommand(['SET', 'key', 'value'], {
          firstKey: 'key',
          isReadonly: false
        })
        .exec(),
      ['OK']
    );
    assert.equal(capturedSlotNumber, 123);
  });

  it('passes the selected slot to pipeline execution', async () => {
    const cluster = RedisCluster.create({ rootNodes: [] });
    let capturedSlotNumber: number | undefined;

    const fakeClient = {
      _executePipeline: async (_commands: unknown, _selectedDB?: number, slotNumber?: number) => {
        capturedSlotNumber = slotNumber;
        return ['OK'];
      }
    };

    cluster._slots.getClientAndSlotNumber = async () => ({
      client: fakeClient as never,
      slotNumber: 456
    });

    assert.deepEqual(
      await cluster.multi()
        .sendCommand(['SET', 'key', 'value'], {
          firstKey: 'key',
          isReadonly: false
        })
        .execAsPipeline(),
      ['OK']
    );
    assert.equal(capturedSlotNumber, 456);
  });
});
