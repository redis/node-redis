import { strict as assert } from 'assert';
import { SinonFakeTimers, useFakeTimers, spy } from 'sinon';
import RedisSocket, { RedisSocketOptions } from './socket';

describe('Socket', () => {
    function createSocket(options: RedisSocketOptions): RedisSocket {
        const socket = new RedisSocket(
            () => Promise.resolve(),
            options
        );

        socket.on('error', (err) => {
            // ignore errors
            console.log(err);
        });

        return socket;
    }

    describe('reconnectStrategy', () => {
        let clock: SinonFakeTimers;
        beforeEach(() => clock = useFakeTimers());
        afterEach(() => clock.restore());

        it('custom strategy', async () => {
            const reconnectStrategy = spy((retries: number) => {
                assert.equal(retries + 1, reconnectStrategy.callCount);

                if (retries === 50) return new Error('50');

                const time = retries * 2;
                queueMicrotask(() => clock.tick(time));
                return time;
            });

            const socket = createSocket({
                host: 'error',
                reconnectStrategy
            });

            await assert.rejects(socket.connect(), {
                message: '50'
            });

            assert.equal(socket.isOpen, false);
        });

        it('should handle errors', async () => {
            const socket = createSocket({
                host: 'error',
                reconnectStrategy(retries: number) {
                    if (retries === 1) return new Error('done');
                    queueMicrotask(() => clock.tick(500));
                    throw new Error();
                }
            });

            await assert.rejects(socket.connect());

            assert.equal(socket.isOpen, false);
        });
    });
});
