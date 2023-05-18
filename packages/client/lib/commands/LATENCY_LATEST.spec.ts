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
        const latency = await client.latencyLatest();
        const latencyType = Array.isArray(latency);
        assert.strictEqual(latencyType, true);
    }, GLOBAL.SERVERS.OPEN);
});
