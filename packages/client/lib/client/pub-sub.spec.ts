import { strict as assert } from 'assert';
import { PubSub, PubSubType } from './pub-sub';

describe('PubSub', () => {
    const TYPE = PubSubType.CHANNELS,
        CHANNEL = 'channel',
        LISTENER = () => {};

    describe('subscribe to new channel', () => {
        function createAndSubscribe() {
            const pubSub = new PubSub(),
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
        const pubSub = new PubSub(),
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
        const pubSub = new PubSub();
        
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
            const pubSub = new PubSub(),
                unsubscribe = pubSub.unsubscribe(TYPE, CHANNEL);
            assert.ok(unsubscribe);
            unsubscribe.resolve();
            assert.equal(pubSub.isActive, false);
        });

        it('when already subscribed', () => {
            const pubSub = new PubSub(),
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
            const pubSub = new PubSub(),
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
            const pubSub = new PubSub(),
                subscribe = pubSub.subscribe(TYPE, CHANNEL, LISTENER);
            assert.ok(subscribe);
            subscribe.resolve();
            assert.equal(pubSub.isActive, true);

            assert.equal(
                pubSub.subscribe(TYPE, CHANNEL, () => {}),
                undefined
            );

            assert.equal(
                pubSub.unsubscribe(TYPE, CHANNEL, LISTENER),
                undefined
            );
        });

        describe('non-existing listener', () => {
            it('on subscribed channel', () => {
                const pubSub = new PubSub(),
                    subscribe = pubSub.subscribe(TYPE, CHANNEL, LISTENER);
                assert.ok(subscribe);
                subscribe.resolve();
                assert.equal(pubSub.isActive, true);

                assert.equal(
                    pubSub.unsubscribe(TYPE, CHANNEL, () => {}),
                    undefined
                );
                assert.equal(pubSub.isActive, true);
            });

            it('on unsubscribed channel', () => {
                const pubSub = new PubSub();
                assert.ok(pubSub.unsubscribe(TYPE, CHANNEL, () => {}));
                assert.equal(pubSub.isActive, false);
            });
        });
    });
});
