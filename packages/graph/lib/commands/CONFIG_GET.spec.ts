import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CONFIG_GET';

describe('CONFIG GET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('TIMEOUT'),
            ['GRAPH.CONFIG', 'GET', 'TIMEOUT']
        );
    });

    testUtils.testWithClient('client.graph.configGet', async client => {
        assert.deepEqual(
            await client.graph.configGet('TIMEOUT'),
            [
                'TIMEOUT',
                0
            ]
        );
    }, GLOBAL.SERVERS.OPEN);
});
