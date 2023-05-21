import {strict as assert} from 'assert';
import testUtils, {GLOBAL} from '../test-utils';
import { transformArguments } from './LATENCY_LATEST';

describe('LATENCY LATEST', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['LATENCY', 'LATEST']
        );
    });

    testUtils.testWithClient('client.latencyLatest', async client => {
        await Promise.all([
            client.configSet('latency-monitor-threshold', '100'),
            client.sendCommand(['DEBUG', 'SLEEP', '1'])
        ]);
        const latency = await client.latencyLatest();
        assert.ok(Array.isArray(latency));
        for (const event of latency) {
            assert.ok(typeof event.name === 'string', 'Name should be a string');
            assert.ok(typeof event.timestamp === 'number', 'Timestamp should be a number');
            assert.ok(typeof event.latestLatency === 'number', 'Latest latency should be a number');
            assert.ok(typeof event.allTimeLatency === 'number', 'All-time latency should be a number');
        }
    }, GLOBAL.SERVERS.OPEN);
});
