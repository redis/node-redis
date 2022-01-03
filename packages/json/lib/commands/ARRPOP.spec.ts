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

    describe('client.json.arrPop', () => {
        testUtils.testWithClient('null', async client => {
            await client.json.set('key', '.', []);

            assert.equal(
                await client.json.arrPop('key', '.'),
                null
            );
        }, GLOBAL.SERVERS.OPEN);

        testUtils.testWithClient('with value', async client => {
            await client.json.set('key', '.', ['value']);

            assert.equal(
                await client.json.arrPop('key', '.'),
                'value'
            );
        }, GLOBAL.SERVERS.OPEN);

        testUtils.testWithClient('array', async client => {
            await client.json.set('key', '$', ['value']);

            assert.deepEqual(
                await client.json.arrPop('key', '$'),
                ['value']
            );
        }, GLOBAL.SERVERS.OPEN);
    });
});
