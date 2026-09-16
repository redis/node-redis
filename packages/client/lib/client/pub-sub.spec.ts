import { strict as assert } from 'node:assert';
import { PubSub, PUBSUB_TYPE } from './pub-sub';

describe('PubSub', () => {
  const TYPE = PUBSUB_TYPE.CHANNELS,
    CHANNEL = 'channel',
    LISTENER = () => {},
    CLIENT_ID = 'test-client-id';

  describe('subscribe to new channel', () => {
    function createAndSubscribe() {
      const pubSub = new PubSub(CLIENT_ID),
        command = pubSub.subscribe(TYPE, CHANNEL, LISTENER);

      assert.equal(pubSub.isActive, true);
      assert.ok(command);
      assert.equal(command.channelsCounter, 1);

      return {
        pubSub,
        command
      };
    }

    it('resolve', () => {
      const { pubSub, command } = createAndSubscribe();

      command.resolve();

      assert.equal(pubSub.isActive, true);
    });

    it('reject', () => {
      const { pubSub, command } = createAndSubscribe();

      assert.ok(command.reject);
      command.reject();

      assert.equal(pubSub.isActive, false);
    });
  });

  it('subscribe to already subscribed channel', () => {
    const pubSub = new PubSub(CLIENT_ID),
      firstSubscribe = pubSub.subscribe(TYPE, CHANNEL, LISTENER);
    assert.ok(firstSubscribe);

    const secondSubscribe = pubSub.subscribe(TYPE, CHANNEL, LISTENER);
    assert.ok(secondSubscribe);

    firstSubscribe.resolve();

    assert.equal(
      pubSub.subscribe(TYPE, CHANNEL, LISTENER),
      undefined
    );
  });

  it('unsubscribe all', () => {
    const pubSub = new PubSub(CLIENT_ID);

    const subscribe = pubSub.subscribe(TYPE, CHANNEL, LISTENER);
    assert.ok(subscribe);
    subscribe.resolve();
    assert.equal(pubSub.isActive, true);

    const unsubscribe = pubSub.unsubscribe(TYPE);
    assert.equal(pubSub.isActive, true);
    assert.ok(unsubscribe);
    unsubscribe.resolve();
    assert.equal(pubSub.isActive, false);
  });

  describe('unsubscribe from channel', () => {
    it('when not subscribed', () => {
      const pubSub = new PubSub(CLIENT_ID),
        unsubscribe = pubSub.unsubscribe(TYPE, CHANNEL);
      assert.ok(unsubscribe);
      unsubscribe.resolve();
      assert.equal(pubSub.isActive, false);
    });

    it('when already subscribed', () => {
      const pubSub = new PubSub(CLIENT_ID),
        subscribe = pubSub.subscribe(TYPE, CHANNEL, LISTENER);
      assert.ok(subscribe);
      subscribe.resolve();
      assert.equal(pubSub.isActive, true);

      const unsubscribe = pubSub.unsubscribe(TYPE, CHANNEL);
      assert.equal(pubSub.isActive, true);
      assert.ok(unsubscribe);
      unsubscribe.resolve();
      assert.equal(pubSub.isActive, false);
    });
  });

  describe('unsubscribe from listener', () => {
    it('when it\'s the only listener', () => {
      const pubSub = new PubSub(CLIENT_ID),
        subscribe = pubSub.subscribe(TYPE, CHANNEL, LISTENER);
      assert.ok(subscribe);
      subscribe.resolve();
      assert.equal(pubSub.isActive, true);

      const unsubscribe = pubSub.unsubscribe(TYPE, CHANNEL, LISTENER);
      assert.ok(unsubscribe);
      unsubscribe.resolve();
      assert.equal(pubSub.isActive, false);
    });

    it('when there are more listeners', () => {
      const pubSub = new PubSub(CLIENT_ID),
        subscribe = pubSub.subscribe(TYPE, CHANNEL, LISTENER);
      assert.ok(subscribe);
      subscribe.resolve();
      assert.equal(pubSub.isActive, true);

      assert.equal(
        pubSub.subscribe(TYPE, CHANNEL, () => { }),
        undefined
      );

      assert.equal(
        pubSub.unsubscribe(TYPE, CHANNEL, LISTENER),
        undefined
      );
    });

    describe('non-existing listener', () => {
      it('on subscribed channel', () => {
        const pubSub = new PubSub(CLIENT_ID),
          subscribe = pubSub.subscribe(TYPE, CHANNEL, LISTENER);
        assert.ok(subscribe);
        subscribe.resolve();
        assert.equal(pubSub.isActive, true);

        assert.equal(
          pubSub.unsubscribe(TYPE, CHANNEL, () => { }),
          undefined
        );
        assert.equal(pubSub.isActive, true);
      });

      it('on unsubscribed channel', () => {
        const pubSub = new PubSub(CLIENT_ID);
        assert.ok(pubSub.unsubscribe(TYPE, CHANNEL, () => { }));
        assert.equal(pubSub.isActive, false);
      });
    });
  });

  describe('in-flight subscribes across removeAllListeners (multi-db moves)', () => {
    it('an in-flight subscribe is folded into the snapshot; its late confirm does not resurrect it', () => {
      const pubSub = new PubSub(CLIENT_ID);
      const listener = () => {};
      const command = pubSub.subscribe(TYPE, 'moving', listener);
      assert.ok(command);
      assert.equal(command.carried?.(), false);

      const snapshot = pubSub.removeAllListeners();
      assert.ok(
        snapshot[TYPE].get('moving')?.strings.has(listener),
        'the pending intent must be carried into the snapshot'
      );
      assert.equal(command.carried?.(), true);

      command.resolve(); // the late wire confirm, now on the demoted client
      assert.equal(pubSub.listeners[TYPE].size, 0, 'the confirm must not resurrect the subscription');
      assert.equal(pubSub.isActive, false);
    });

    it('a settled subscribe leaves no pending ghost in later snapshots', () => {
      const pubSub = new PubSub(CLIENT_ID);
      const listener = () => {};
      const command = pubSub.subscribe(PUBSUB_TYPE.PATTERNS, 'p.*', listener);
      assert.ok(command);
      command.resolve();

      const first = pubSub.removeAllListeners();
      assert.ok(first[PUBSUB_TYPE.PATTERNS].get('p.*')?.strings.has(listener));
      const second = pubSub.removeAllListeners();
      assert.equal(second[PUBSUB_TYPE.PATTERNS].size, 0);
    });

    it('a rejected in-flight subscribe without a move stays a plain failure', () => {
      const pubSub = new PubSub(CLIENT_ID);
      const command = pubSub.subscribe(TYPE, 'gone', () => {});
      assert.ok(command);
      command.reject?.();
      assert.equal(command.carried?.(), false);
      assert.equal(pubSub.isActive, false);
      assert.equal(pubSub.removeAllListeners()[TYPE].size, 0);
    });

    it('an in-flight unsubscribe is applied to the snapshot, not resurrected by the move', () => {
      const pubSub = new PubSub(CLIENT_ID);
      const listener = () => {};
      pubSub.subscribe(TYPE, 'leaving', listener)!.resolve();

      // unsubscribe in flight: the channel is still in the live map until reply
      const unsub = pubSub.unsubscribe(TYPE, 'leaving', listener);
      assert.ok(unsub);

      // the move snapshots now — the leaving channel must NOT be carried over
      const snapshot = pubSub.removeAllListeners();
      assert.equal(snapshot[TYPE].has('leaving'), false, 'a channel being unsubscribed must not move');

      unsub.resolve(); // the late reply — a no-op against the fresh maps
      assert.equal(pubSub.listeners[TYPE].size, 0);
    });

    it('per-listener unsubscribe keeps a co-subscribed listener on the same channel', () => {
      const pubSub = new PubSub(CLIENT_ID);
      const staying = () => {};
      const leaving = () => {};
      pubSub.subscribe(TYPE, 'shared', staying)!.resolve();
      // second listener on the same channel needs no command (already subscribed)
      pubSub.subscribe(TYPE, 'shared', leaving);

      // removing one of two co-listeners issues no command — nothing in flight to carry
      const unsub = pubSub.unsubscribe(TYPE, 'shared', leaving);
      assert.equal(unsub, undefined);

      const snapshot = pubSub.removeAllListeners();
      assert.ok(snapshot[TYPE].get('shared')?.strings.has(staying), 'the surviving listener must move');
      assert.equal(snapshot[TYPE].get('shared')?.strings.has(leaving), false);
    });
  });
});

