import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CONFIG_GET';

describe('CONFIG GET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('TIMEOUT'),
            ['FT.CONFIG', 'GET', 'TIMEOUT']
        );
    });

    testUtils.testWithClient('client.ft.configGet', async client => {
        assert.deepEqual(
            await client.ft.configGet('TIMEOUT'),
            Object.create(null, {
                TIMEOUT: {
                    value: '500',
                    configurable: true,
                    enumerable: true
                }
            })
        );
    }, GLOBAL.SERVERS.OPEN);
});
