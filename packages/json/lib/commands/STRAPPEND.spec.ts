import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './STRAPPEND';

describe('STRAPPEND', () => {
    describe('transformArguments', () => {
        it('without path', () => {
            assert.deepEqual(
                transformArguments('key', 'append'),
                ['JSON.STRAPPEND', 'key', '"append"']
            );
        });

        it('with path', () => {
            assert.deepEqual(
                transformArguments('key', '$', 'append'),
                ['JSON.STRAPPEND', 'key', '$', '"append"']
            );
        });
    });

    testUtils.testWithClient('client.json.strAppend', async client => {
        await client.json.set('key', '$', '');

        assert.deepEqual(
            await client.json.strAppend('key', '$', 'append'),
            [6]
        );
    }, GLOBAL.SERVERS.OPEN);
});
