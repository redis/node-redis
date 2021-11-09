import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './TOUCH';

describe('TOUCH', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['TOUCH', 'key']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments(['1', '2']),
                ['TOUCH', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.touch', async client => {
        assert.equal(
            await client.touch('key'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
