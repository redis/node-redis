import { strict as assert } from 'node:assert';
import calculateSlot from 'cluster-key-slot';
import RedisCluster from '.';
import { ErrorReply } from '../errors';

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

  it('retries MULTI after a MOVED redirect', async () => {
    const cluster = RedisCluster.create({ rootNodes: [] });
    const key = 'key';
    const slotNumber = calculateSlot(key);
    const attempts: Array<{ client: string; slotNumber?: number }> = [];

    const redirectedClient = {
      _clientId: 'redirected',
      _executeMulti: async (
        _commands: unknown,
        _selectedDB?: number,
        routedSlot?: number
      ) => {
        attempts.push({ client: 'redirected', slotNumber: routedSlot });
        return ['OK'];
      }
    };
    const staleClient = {
      _clientId: 'stale',
      _executeMulti: async (
        _commands: unknown,
        _selectedDB?: number,
        routedSlot?: number
      ): Promise<Array<unknown>> => {
        attempts.push({ client: 'stale', slotNumber: routedSlot });
        throw new ErrorReply(`MOVED ${slotNumber} 127.0.0.1:7001`);
      }
    };
    let currentClient = staleClient;

    cluster._slots.getClientAndSlotNumber = async () => ({
      client: currentClient as never,
      slotNumber
    });
    cluster._slots.rediscover = async () => {
      currentClient = redirectedClient as typeof staleClient;
    };

    assert.deepEqual(
      await cluster.multi().set(key, 'value').exec(),
      ['OK']
    );
    assert.deepEqual(attempts, [
      { client: 'stale', slotNumber },
      { client: 'redirected', slotNumber }
    ]);
  });

  it('keeps ASKING and the redirected MULTI in the same queue chain', async () => {
    const cluster = RedisCluster.create({ rootNodes: [] });
    const key = 'key';
    const slotNumber = calculateSlot(key);
    let askingChainId: symbol | undefined;
    let multiChainId: symbol | undefined;
    let redirectedSlot: number | undefined;

    const redirectedClient = {
      _clientId: 'redirected',
      sendCommand: async (
        args: ReadonlyArray<string>,
        options?: { chainId?: symbol }
      ) => {
        assert.deepEqual(args, ['ASKING']);
        askingChainId = options?.chainId;
        return 'OK';
      },
      _executeMulti: async (
        _commands: unknown,
        _selectedDB?: number,
        routedSlot?: number,
        chainId?: symbol
      ) => {
        redirectedSlot = routedSlot;
        multiChainId = chainId;
        return ['OK'];
      }
    };
    const staleClient = {
      _clientId: 'stale',
      _executeMulti: async (): Promise<Array<unknown>> => {
        throw new ErrorReply(`ASK ${slotNumber} 127.0.0.1:7001`);
      }
    };

    cluster._slots.getClientAndSlotNumber = async () => ({
      client: staleClient as never,
      slotNumber
    });
    cluster._slots.getMasterByAddress = async () => redirectedClient as never;

    assert.deepEqual(
      await cluster.multi().get(key).exec(),
      ['OK']
    );
    assert.notEqual(askingChainId, undefined);
    assert.equal(multiChainId, askingChainId);
    assert.equal(redirectedSlot, slotNumber);
  });

  it('does not retry a non-atomic pipeline after MOVED', async () => {
    const cluster = RedisCluster.create({ rootNodes: [] });
    const key = 'key';
    const slotNumber = calculateSlot(key);
    let attempts = 0;
    let rediscoveries = 0;

    const client = {
      _executePipeline: async (): Promise<Array<unknown>> => {
        attempts++;
        throw new ErrorReply(`MOVED ${slotNumber} 127.0.0.1:7001`);
      }
    };

    cluster._slots.getClientAndSlotNumber = async () => ({
      client: client as never,
      slotNumber
    });
    cluster._slots.rediscover = async () => {
      rediscoveries++;
    };

    await assert.rejects(
      cluster.multi().get(key).execAsPipeline(),
      error => error instanceof ErrorReply && error.message.startsWith('MOVED')
    );
    assert.equal(attempts, 1);
    assert.equal(rediscoveries, 0);
  });
});
