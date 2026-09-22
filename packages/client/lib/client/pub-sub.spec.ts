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

  it('concurrent subscribes to the same channel both register their listeners', () => {
    const pubSub = new PubSub(CLIENT_ID);

    // Two subscribe() calls before either resolves — both need a SUBSCRIBE command
    const listener1 = () => {};
    const listener2 = () => {};
    const cmd1 = pubSub.subscribe(TYPE, CHANNEL, listener1);
    const cmd2 = pubSub.subscribe(TYPE, CHANNEL, listener2);
    assert.ok(cmd1);
    assert.ok(cmd2);

    cmd1.resolve();
    cmd2.resolve();

    const ch = pubSub.listeners[TYPE].get(CHANNEL);
    assert.ok(ch);
    assert.ok(ch.strings.has(listener1), 'listener1 must be registered after cmd1.resolve()');
    assert.ok(ch.strings.has(listener2), 'listener2 must be registered after cmd2.resolve()');
  });

  it('mixed subscribe: already-subscribed channel listener survives reject of new channel', () => {
    const pubSub = new PubSub(CLIENT_ID);

    const ch1Subscribe = pubSub.subscribe(TYPE, 'ch1', LISTENER);
    assert.ok(ch1Subscribe);
    ch1Subscribe.resolve();

    // ch1 confirmed, ch2 new — returns a command (must subscribe ch2)
    const listener2 = () => {};
    const mixed = pubSub.subscribe(TYPE, ['ch1', 'ch2'], listener2);
    assert.ok(mixed);

    // ch2's SUBSCRIBE fails (e.g. connection lost)
    assert.ok(mixed.reject);
    mixed.reject();

    // listener2 must already be active on ch1 — it was subscribed before the failed command
    const ch1Listeners = pubSub.listeners[TYPE].get('ch1');
    assert.ok(ch1Listeners);
    assert.ok(
      ch1Listeners.strings.has(listener2),
      'listener2 must survive reject: ch1 was already subscribed when subscribe() was called'
    );

    // ch2 was never confirmed, so it must not appear in the map
    assert.equal(pubSub.listeners[TYPE].get('ch2'), undefined);
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
});
