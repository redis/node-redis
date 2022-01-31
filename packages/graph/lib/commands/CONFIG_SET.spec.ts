import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './CONFIG_SET';

describe('CONFIG SET', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('TIMEOUT', 0),
            ['GRAPH.CONFIG', 'SET', 'TIMEOUT', '0']
        );
    });

    testUtils.testWithClient('client.graph.configSet', async client => {
        assert.equal(
            await client.graph.configSet('TIMEOUT', 0),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});
