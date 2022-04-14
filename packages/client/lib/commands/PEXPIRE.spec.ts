import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './PEXPIRE';

describe('PEXPIRE', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key', 1),
                ['PEXPIRE', 'key', '1']
            );
        });

        it('with set option', () => {
            assert.deepEqual(
                transformArguments('key', 1, 'GT'),
                ['PEXPIRE', 'key', '1', 'GT']
            );
        });
    });

    testUtils.testWithClient('client.pExpire', async client => {
        assert.equal(
            await client.pExpire('key', 1),
            false
        );
    }, GLOBAL.SERVERS.OPEN);
});
