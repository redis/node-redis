import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LIST';

describe('LIST', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['GRAPH.LIST']
        );
    });

    testUtils.testWithClient('client.graph.list', async client => {
        assert.deepEqual(
            await client.graph.list(),
            []
        );
    }, GLOBAL.SERVERS.OPEN);
});
