import { strict as assert } from 'assert';
import { SinonFakeTimers, useFakeTimers, spy } from 'sinon';
import RedisSocket from './socket';

describe('Socket', () => {
    describe('retryStrategy', () => {
        let clock: SinonFakeTimers;
        beforeEach(() => clock = useFakeTimers());
        afterEach(() => clock.uninstall());

        it('custom strategy', async () => {
            const retryStrategy = spy((retries: number): number | Error => {
                assert.equal(retries + 1, retryStrategy.callCount);

                if (retries === 50) {
                    return Error('50');
                }

                const time = retries * 2;
                queueMicrotask(() => clock.tick(time));
                return time;
            });

            const socket = new RedisSocket(undefined, {
                host: 'error',
                retryStrategy
            });

            socket.on('error', () => {
                // ignore errors
            });

            await assert.rejects(socket.connect(), {
                message: '50'
            });
        })
    });
});
