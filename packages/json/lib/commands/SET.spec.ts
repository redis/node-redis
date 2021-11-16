import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SET';

describe('SET', () => {
    describe('transformArguments', () => {
        it('transformArguments', () => {
            assert.deepEqual(
                transformArguments('key', '$', 'json'),
                ['JSON.SET', 'key', '$', '"json"']
            );
        });

        it('NX', () => {
            assert.deepEqual(
                transformArguments('key', '$', 'json', { NX: true }),
                ['JSON.SET', 'key', '$', '"json"', 'NX']
            );
        });

        it('XX', () => {
            assert.deepEqual(
                transformArguments('key', '$', 'json', { XX: true }),
                ['JSON.SET', 'key', '$', '"json"', 'XX']
            );
        });
    });

    testUtils.testWithClient('client.json.mGet', async client => {
        assert.equal(
            await client.json.set('key', '$', 'json'),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});
