import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './PEXPIREAT';

describe('PEXPIREAT', () => {
    describe('transformArguments', () => {
        it('number', () => {
            assert.deepEqual(
                transformArguments('key', 1),
                ['PEXPIREAT', 'key', '1']
            );
        });

        it('date', () => {
            const d = new Date();
            assert.deepEqual(
                transformArguments('key', d),
                ['PEXPIREAT', 'key', d.getTime().toString()]
            );
        });

        it('with set option', () => {
            assert.deepEqual(
                transformArguments('key', 1, 'XX'),
                ['PEXPIREAT', 'key', '1', 'XX']
            );
        });
    });

    testUtils.testWithClient('client.pExpireAt', async client => {
        assert.equal(
            await client.pExpireAt('key', 1),
            false
        );
    }, GLOBAL.SERVERS.OPEN);
});
