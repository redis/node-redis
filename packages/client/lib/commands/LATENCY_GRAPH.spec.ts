import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './LATENCY_GRAPH';

describe('LATENCY GRAPH', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('command'),
            [
                'LATENCY',
                'GRAPH',
                'command'
            ]
        );
    });

    testUtils.testWithClient('client.latencyGraph', async client => {
        await Promise.all([
            client.configSet('latency-monitor-threshold', '1'),
            client.sendCommand(['DEBUG', 'SLEEP', '0.001'])
        ]);

        assert.equal(
            typeof await client.latencyGraph('command'),
            'string'
        );
    }, GLOBAL.SERVERS.OPEN);
});
