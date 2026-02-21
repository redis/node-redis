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
});
