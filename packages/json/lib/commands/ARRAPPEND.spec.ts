import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ARRAPPEND';

describe('ARRAPPEND', () => {
    describe('transformArguments', () => {
        it('single JSON', () => {
            assert.deepEqual(
                transformArguments('key', '$', 1),
                ['JSON.ARRAPPEND', 'key', '$', '1']
            );
        });

        it('multiple JSONs', () => {
            assert.deepEqual(
                transformArguments('key', '$', 1, 2),
                ['JSON.ARRAPPEND', 'key', '$', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.json.arrAppend', async client => {
        await client.json.set('key', '$', []);

        assert.deepEqual(
            await client.json.arrAppend('key', '$', 1),
            [1]
        );
    }, GLOBAL.SERVERS.OPEN);
});
