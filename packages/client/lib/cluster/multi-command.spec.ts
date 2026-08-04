import { strict as assert } from 'node:assert';
import RedisClusterMultiCommand from './multi-command';
import { RedisArgument } from '../RESP/types';

/**
 * Deterministic (no-server) coverage for how `RedisClusterMultiCommand` chooses the
 * routing key when a `keyPrefix` is configured. The routing key drives slot selection,
 * so it must be prefixed to match the (prefixed) keys the commands operate on — otherwise
 * the transaction routes to the wrong node (CROSSSLOT / MOVED).
 */
describe('RedisClusterMultiCommand keyPrefix routing', () => {
  function setup(routing: RedisArgument | undefined, keyPrefix: RedisArgument | undefined) {
    const routedKeys: Array<RedisArgument | undefined> = [];
    const execute = (
      firstKey: RedisArgument | undefined,
      _isReadonly: boolean | undefined,
      queue: Array<unknown>
    ) => {
      routedKeys.push(firstKey);
      return Promise.resolve(queue.map(() => null));
    };

    const multi = new RedisClusterMultiCommand(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- minimal execute stub
      execute as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- minimal execute stub
      execute as any,
      routing,
      undefined,
      keyPrefix
    );

    return { multi, routedKeys };
  }

  it('prefixes an explicit routing key so it matches the prefixed command keys', async () => {
    const { multi, routedKeys } = setup('user', 'app:');
    multi.addCommand('app:user', false, ['GET', 'app:user']);

    await multi.exec();

    assert.deepEqual(routedKeys, ['app:user']);
  });

  it('routes by the already-prefixed command key when no explicit routing is given', async () => {
    const { multi, routedKeys } = setup(undefined, 'app:');
    multi.addCommand('app:user', false, ['GET', 'app:user']);

    await multi.exec();

    assert.deepEqual(routedKeys, ['app:user']);
  });

  it('leaves the routing key untouched when no prefix is configured', async () => {
    const { multi, routedKeys } = setup('user', undefined);
    multi.addCommand('user', false, ['GET', 'user']);

    await multi.exec();

    assert.deepEqual(routedKeys, ['user']);
  });
});
