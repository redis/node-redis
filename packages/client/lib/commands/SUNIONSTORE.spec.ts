import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SUNIONSTORE';

describe('SUNIONSTORE', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('destination', 'key'),
                ['SUNIONSTORE', 'destination', 'key']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('destination', ['1', '2']),
                ['SUNIONSTORE', 'destination', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.sUnionStore', async client => {
        assert.equal(
            await client.sUnionStore('destination', 'key'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
