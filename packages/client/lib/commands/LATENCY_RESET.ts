import { CommandParser } from '../client/parser';
import { Command } from '../RESP/types';
import { LATENCY_EVENTS, LatencyEvent } from './LATENCY_GRAPH';

export { LATENCY_EVENTS, LatencyEvent };

export default {
    NOT_KEYED_COMMAND: true,
    IS_READ_ONLY: false,
    /**
     * Constructs the LATENCY RESET command
     * * @param parser - The command parser
     * @param events - The latency events to reset. If not specified, all events are reset.
     * @see https://redis.io/commands/latency-reset/
     */
    parseCommand(parser: CommandParser, ...events: Array<LatencyEvent>) {
        const args = ['LATENCY', 'RESET'];
        if (events.length > 0) {
            args.push(...events);
        }
        parser.push(...args);
    },
    transformReply: undefined as unknown as () => number
} as const satisfies Command;
