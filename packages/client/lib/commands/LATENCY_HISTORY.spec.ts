import {strict as assert} from 'assert';
import testUtils, {GLOBAL} from '../test-utils';
import { transformArguments } from './LATENCY_HISTORY';

describe('LATENCY HISTORY', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('command'),
            ['LATENCY', 'HISTORY', 'command']
        );
    });

    testUtils.testWithClient('client.latencyHistory', async client => {
        await Promise.all([
            client.configSet('latency-monitor-threshold', '100'),
            client.sendCommand(['DEBUG', 'SLEEP', '1'])
        ]);
        
        const latencyHisRes = await client.latencyHistory('command');
        assert.ok(Array.isArray(latencyHisRes));
        for (const [timestamp, latency] of latencyHisRes) {
            assert.equal(typeof timestamp, 'number');
            assert.equal(typeof latency, 'number');
        }
    }, GLOBAL.SERVERS.OPEN);
});
