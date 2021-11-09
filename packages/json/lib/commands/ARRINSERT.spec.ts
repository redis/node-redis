import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ARRINSERT';

describe('ARRINSERT', () => {
    describe('transformArguments', () => {
        it('single JSON', () => {
            assert.deepEqual(
                transformArguments('key', '$', 0, 'json'),
                ['JSON.ARRINSERT', 'key', '$', '0', '"json"']
            );
        });

        it('multiple JSONs', () => {
            assert.deepEqual(
                transformArguments('key', '$', 0, '1', '2'),
                ['JSON.ARRINSERT', 'key', '$', '0', '"1"', '"2"']
            );
        });
    });

    testUtils.testWithClient('client.json.arrInsert', async client => {
        await client.json.set('key', '$', []);

        assert.deepEqual(
            await client.json.arrInsert('key', '$', 0, 'json'),
            [1]
        );
    }, GLOBAL.SERVERS.OPEN);
});
