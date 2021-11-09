import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './DICTADD';

describe('DICTADD', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('dictionary', 'term'),
                ['FT.DICTADD', 'dictionary', 'term']
            );
        });

        it('Array', () => {
            assert.deepEqual(
                transformArguments('dictionary', ['1', '2']),
                ['FT.DICTADD', 'dictionary', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.ft.dictAdd', async client => {
        assert.equal(
            await client.ft.dictAdd('dictionary', 'term'),
            1
        );
    }, GLOBAL.SERVERS.OPEN);
});
