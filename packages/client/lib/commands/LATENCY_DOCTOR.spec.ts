import {strict as assert} from 'assert';
import testUtils, {GLOBAL} from '../test-utils';
import { transformArguments } from './LATENCY_DOCTOR';

describe('LATENCY DOCTOR', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['LATENCY', 'DOCTOR']
        );
    });

    testUtils.testWithClient('client.latencyDoctor', async client => {
        assert.equal(
            typeof (await client.latencyDoctor()),
            'string'
        );
    }, GLOBAL.SERVERS.OPEN);
});
