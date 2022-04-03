import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './EXPIREAT';

describe('EXPIREAT', () => {
    describe('transformArguments', () => {
        it('number', () => {
            assert.deepEqual(
                transformArguments('key', 1),
                ['EXPIREAT', 'key', '1']
            );
        });

        it('date', () => {
            const d = new Date();
            assert.deepEqual(
                transformArguments('key', d),
                ['EXPIREAT', 'key', Math.floor(d.getTime() / 1000).toString()]
            );
        });
        
        it('with set option', () => {
            assert.deepEqual(
                transformArguments('key', 1, 'GT'),
                ['EXPIREAT', 'key', '1', 'GT']
            );
        });
    });

    testUtils.testWithClient('client.expireAt', async client => {
        assert.equal(
            await client.expireAt('key', 1),
            false
        );
    }, GLOBAL.SERVERS.OPEN);
});
