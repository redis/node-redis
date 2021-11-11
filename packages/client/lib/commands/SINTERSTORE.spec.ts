import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SINTERSTORE';

describe('SINTERSTORE', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('destination', 'key'),
                ['SINTERSTORE', 'destination', 'key']
            );
        });

        it('array', () => {
            assert.deepEqual(
                transformArguments('destination', ['1', '2']),
                ['SINTERSTORE', 'destination', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.sInterStore', async client => {
        assert.equal(
            await client.sInterStore('destination', 'key'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
