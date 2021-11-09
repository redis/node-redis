import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SPOP';

describe('SPOP', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['SPOP', 'key']
            );
        });

        it('with count', () => {
            assert.deepEqual(
                transformArguments('key', 2),
                ['SPOP', 'key', '2']
            );
        });
    });

    testUtils.testWithClient('client.sPop', async client => {
        assert.equal(
            await client.sPop('key'),
            null
        );
    }, GLOBAL.SERVERS.OPEN);
});
