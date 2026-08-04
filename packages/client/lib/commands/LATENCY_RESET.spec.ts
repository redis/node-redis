import { strict as assert } from 'node:assert';
import testUtils, { GLOBAL } from '../test-utils';
import LATENCY_RESET, { LATENCY_EVENTS } from './LATENCY_RESET';
import { parseArgs } from './generic-transformers';

describe('LATENCY RESET', function () {


    it('transformArguments with no events', () => {
        assert.deepEqual(
            parseArgs(LATENCY_RESET),
            [
                'LATENCY',
                'RESET'
            ]
        );
    });

    it('transformArguments with one event', () => {
        assert.deepEqual(
            parseArgs(LATENCY_RESET, LATENCY_EVENTS.COMMAND),
            [
                'LATENCY',
                'RESET',
                'command'
            ]
        );
    });

    it('transformArguments with multiple events', () => {
        assert.deepEqual(
            parseArgs(LATENCY_RESET, LATENCY_EVENTS.COMMAND, LATENCY_EVENTS.FORK),
            [
                'LATENCY',
                'RESET',
                'command',
                'fork'
            ]
        );
    });


    testUtils.testWithClient('client.latencyReset', async client => {

        await client.configSet('latency-monitor-threshold', '1');


        await client.sendCommand(['DEBUG', 'SLEEP', '0.1']);


        const latestLatencyBeforeReset = await client.latencyLatest();
        assert.ok(latestLatencyBeforeReset.length > 0, 'Expected latency events to be recorded before first reset.');
        const commandEventBeforeReset = latestLatencyBeforeReset.find(event => event[0] === LATENCY_EVENTS.COMMAND);
        assert.ok(
            commandEventBeforeReset,
            `Expected "command" event to be recorded. Got events: ${latestLatencyBeforeReset.map(event => event[0]).join(', ')}`
        );
        assert.ok(Number(commandEventBeforeReset[2]) >= 100, 'Expected latest latency for "command" to be at least 100ms.');


        const replyAll = await client.latencyReset();

        assert.equal(typeof replyAll, 'number');
        assert.ok(replyAll >= 0);


        const latestLatencyAfterAllReset = await client.latencyLatest();
        assert.deepEqual(latestLatencyAfterAllReset, [], 'Expected no latency events after resetting all.');


        await client.sendCommand(['DEBUG', 'SLEEP', '0.05']);
        const latestLatencyBeforeSpecificReset = await client.latencyLatest();
        assert.ok(latestLatencyBeforeSpecificReset.length > 0, 'Expected latency events before specific reset.');


        const replySpecific = await client.latencyReset(LATENCY_EVENTS.COMMAND);
        assert.equal(typeof replySpecific, 'number');
        assert.ok(replySpecific >= 0);


        const latestLatencyAfterSpecificReset = await client.latencyLatest();
        assert.ok(
            latestLatencyAfterSpecificReset.every(event => event[0] !== LATENCY_EVENTS.COMMAND),
            `Expected no "${LATENCY_EVENTS.COMMAND}" event after specific reset. Got events: ${latestLatencyAfterSpecificReset.map(event => event[0]).join(', ')}`
        );


        await client.sendCommand(['DEBUG', 'SLEEP', '0.02']);


        const latestLatencyBeforeMultipleReset = await client.latencyLatest();
        assert.ok(latestLatencyBeforeMultipleReset.length > 0, 'Expected latency events before multiple reset.');


        const replyMultiple = await client.latencyReset(LATENCY_EVENTS.COMMAND, LATENCY_EVENTS.FORK);
        assert.equal(typeof replyMultiple, 'number');
        assert.ok(replyMultiple >= 0);

        const latestLatencyAfterMultipleReset = await client.latencyLatest();
        assert.ok(
            latestLatencyAfterMultipleReset.every(event => (
                event[0] !== LATENCY_EVENTS.COMMAND &&
                event[0] !== LATENCY_EVENTS.FORK
            )),
            `Expected no "${LATENCY_EVENTS.COMMAND}" or "${LATENCY_EVENTS.FORK}" events after reset. Got events: ${latestLatencyAfterMultipleReset.map(event => event[0]).join(', ')}`
        );

    }, {

        ...GLOBAL.SERVERS.OPEN,
        clientOptions: {
            socket: {
                connectTimeout: 300000
            }
        }
    });
});
