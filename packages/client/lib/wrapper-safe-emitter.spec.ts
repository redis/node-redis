import { strict as assert } from 'node:assert';
import { EventEmitter } from 'node:events';
import { spy } from 'sinon';
import RedisClient from './client';
import { RedisClientPool } from './client/pool';
import RedisCluster from './cluster';
import RedisSentinel from './sentinel';
import { RESP_TYPES } from './RESP/decoder';

// Every factory returns `Object.create(instance)`, and the instance is what
// emits. None of these tests connects: they emit on the instance directly.
type Wrapper = EventEmitter & {
  withTypeMapping(typeMapping: object): EventEmitter;
};

const NOWHERE = { host: '127.0.0.1', port: 1 };

const KINDS: Array<[string, () => Wrapper]> = [
  ['RedisClient', () => RedisClient.create()],
  ['RedisClientPool', () => RedisClientPool.create()],
  ['RedisCluster', () => RedisCluster.create({ rootNodes: [{ socket: NOWHERE }] })],
  ['RedisSentinel', () => RedisSentinel.create({ name: 'mymaster', sentinelRootNodes: [NOWHERE] })]
];

const REMOVALS: Array<[string, (wrapper: Wrapper, listener: () => void) => unknown]> = [
  ['removeListener', (wrapper, listener) => wrapper.removeListener('error', listener)],
  ['off', (wrapper, listener) => wrapper.off('error', listener)],
  ["removeAllListeners('error')", wrapper => wrapper.removeAllListeners('error')],
  ['removeAllListeners()', wrapper => wrapper.removeAllListeners()]
];

/** emit the way the instance does: on itself, not through the wrapper */
function emitOnInstance(wrapper: Wrapper, event: string, ...args: Array<unknown>) {
  return EventEmitter.prototype.emit.call(Object.getPrototypeOf(wrapper), event, ...args);
}

for (const [kind, create] of KINDS) {
  describe(`${kind} listeners behind the Object.create() wrapper`, () => {
    for (const [name, remove] of REMOVALS) {
      it(`${name} removes the last listener, and a later listener fires`, () => {
        const wrapper = create();
        const removed = spy();
        const added = spy();

        wrapper.on('error', removed);
        remove(wrapper, removed);
        wrapper.on('error', added);
        emitOnInstance(wrapper, 'error', new Error('test'));

        assert.equal(removed.callCount, 0);
        assert.equal(added.callCount, 1);
        assert.equal(wrapper.listenerCount('error'), 1);
        assert.deepEqual(wrapper.listeners('error'), [added]);
      });
    }

    it('a listener added through a with*() proxy fires, and the proxy can remove it', () => {
      const wrapper = create();
      const proxy = wrapper.withTypeMapping({ [RESP_TYPES.SIMPLE_STRING]: Buffer });
      const removed = spy();
      const added = spy();

      proxy.on('end', removed);
      proxy.removeListener('end', removed);
      proxy.once('end', added);
      assert.equal(wrapper.listenerCount('end'), 1);

      emitOnInstance(wrapper, 'end');
      emitOnInstance(wrapper, 'end');

      assert.equal(removed.callCount, 0);
      assert.equal(added.callCount, 1);
      assert.equal(wrapper.listenerCount('end'), 0);
    });

    it('chainable methods return the object they were called on', () => {
      const wrapper = create();
      const proxy = wrapper.withTypeMapping({});
      const listener = () => {};

      for (const target of [wrapper, proxy]) {
        assert.equal(target.on('error', listener), target);
        assert.equal(target.addListener('error', listener), target);
        assert.equal(target.once('error', listener), target);
        assert.equal(target.prependListener('error', listener), target);
        assert.equal(target.prependOnceListener('error', listener), target);
        assert.equal(target.off('error', listener), target);
        assert.equal(target.removeListener('error', listener), target);
        assert.equal(target.setMaxListeners(20), target);
        assert.equal(target.removeAllListeners('error'), target);
        assert.equal(target.removeAllListeners(), target);
      }
    });

    it('the wrapper, its proxies and the instance share one listener state', () => {
      const wrapper = create();
      const proxy = wrapper.withTypeMapping({});
      const instance = Object.getPrototypeOf(wrapper) as EventEmitter;
      const first = spy();
      const second = spy();

      wrapper.on('end', first);
      proxy.prependListener('end', second);
      proxy.setMaxListeners(42);

      for (const target of [wrapper, proxy, instance]) {
        assert.deepEqual(target.listeners('end'), [second, first]);
        assert.deepEqual(target.rawListeners('end'), [second, first]);
        assert.deepEqual(target.eventNames(), ['end']);
        assert.equal(target.listenerCount('end'), 2);
        assert.equal(target.getMaxListeners(), 42);
        // state never lands on the wrapper or the proxy
        assert.equal(Object.hasOwn(target, '_events'), target === instance);
        assert.equal(Object.hasOwn(target, '_eventsCount'), target === instance);
      }

      // an explicit `undefined` event name removes nothing, as in EventEmitter
      proxy.removeAllListeners(undefined);
      assert.equal(instance.listenerCount('end'), 2);

      assert.equal(wrapper.emit('ready'), false);
      assert.equal(proxy.emit('end', 1, 2), true);
      assert.deepEqual(first.firstCall.args, [1, 2]);
      assert.deepEqual(second.firstCall.args, [1, 2]);
    });
  });
}
