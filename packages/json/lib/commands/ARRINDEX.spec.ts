import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ARRINDEX';

describe('ARRINDEX', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key', '$', 'json'),
                ['JSON.ARRINDEX', 'key', '$', '"json"']
            );
        });

        it('with start', () => {
            assert.deepEqual(
                transformArguments('key', '$', 'json', 1),
                ['JSON.ARRINDEX', 'key', '$', '"json"', '1']
            );
        });

        it('with start, end', () => {
            assert.deepEqual(
                transformArguments('key', '$', 'json', 1, 2),
                ['JSON.ARRINDEX', 'key', '$', '"json"', '1', '2']
            );
        });
    });

    testUtils.testWithClient('client.json.arrIndex', async client => {
        await client.json.set('key', '$', []);

        assert.deepEqual(
            await client.json.arrIndex('key', '$', 'json'),
            [-1]
        );
    }, GLOBAL.SERVERS.OPEN);
});
