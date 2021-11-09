import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './ARRPOP';

describe('ARRPOP', () => {
    describe('transformArguments', () => {
        it('key', () => {
            assert.deepEqual(
                transformArguments('key'),
                ['JSON.ARRPOP', 'key']
            );
        });

        it('key, path', () => {
            assert.deepEqual(
                transformArguments('key', '$'),
                ['JSON.ARRPOP', 'key', '$']
            );
        });

        it('key, path, index', () => {
            assert.deepEqual(
                transformArguments('key', '$', 0),
                ['JSON.ARRPOP', 'key', '$', '0']
            );
        });
    });

    testUtils.testWithClient('client.json.arrPop', async client => {
        await client.json.set('key', '$', []);

        assert.deepEqual(
            await client.json.arrPop('key', '$'),
            [null]
        );
    }, GLOBAL.SERVERS.OPEN);
});
