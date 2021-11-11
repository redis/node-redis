import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './DICTDEL';

describe('DICTDEL', () => {
    describe('transformArguments', () => {
        it('string', () => {
            assert.deepEqual(
                transformArguments('dictionary', 'term'),
                ['FT.DICTDEL', 'dictionary', 'term']
            );
        });

        it('Array', () => {
            assert.deepEqual(
                transformArguments('dictionary', ['1', '2']),
                ['FT.DICTDEL', 'dictionary', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.ft.dictDel', async client => {
        assert.equal(
            await client.ft.dictDel('dictionary', 'term'),
            0
        );
    }, GLOBAL.SERVERS.OPEN);
});
