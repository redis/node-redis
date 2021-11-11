import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './HSETNX';

describe('HSETNX', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('key', 'field', 'value'),
            ['HSETNX', 'key', 'field', 'value']
        );
    });

    testUtils.testWithClient('client.hSetNX', async client => {
        assert.equal(
            await client.hSetNX('key', 'field', 'value'),
            true
        );
    }, GLOBAL.SERVERS.OPEN);
});
