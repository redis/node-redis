import { CommandParser } from '../client/parser'; // Ensure CommandParser is imported
import { Command } from '../RESP/types'; // Assuming 'Command' type from RESP/types
import { LATENCY_EVENTS, LatencyEvent } from './LATENCY_GRAPH'; // Reusing these constants

// Exporting them for convenience, as they are relevant to LATENCY commands
export { LATENCY_EVENTS, LatencyEvent };

// This object defines the LATENCY RESET command's behavior for the Redis client.
export default {
    // NOT_KEYED_COMMAND: true indicates that this command does not operate on a specific Redis key.
    // This is important for client-side routing and command categorization.
    NOT_KEYED_COMMAND: true,

    // IS_READ_ONLY: false indicates that this command modifies the server's internal state.
    // The LATENCY RESET command clears latency statistics, thus it's not read-only.
    IS_READ_ONLY: false,

    /**
     * Constructs the LATENCY RESET command by pushing arguments to the parser.
     * This method is used by the Redis client to build the command before sending it to the server.
     *
     * @param parser - The command parser instance provided by the client.
     * @param events - Optional latency event names to reset. If none are provided, all events are reset.
     * @see https://redis.io/commands/latency-reset/
     */
    parseCommand(parser: CommandParser, ...events: Array<LatencyEvent>) { // Changed from transformArguments to parseCommand
        // Start with the base command 'LATENCY' and its subcommand 'RESET'
        const args: Array<string> = ['LATENCY', 'RESET'];

        // If specific event names are provided, append them to the arguments array.
        // This allows resetting only particular latency event types.
        if (events.length > 0) {
            args.push(...events);
        }

        // Push the constructed arguments to the parser. The parser will then
        // handle the serialization into the RESP (Redis Serialization Protocol) format.
        parser.push(...args);
    },

    /**
     * Transforms the reply received from the Redis server for the LATENCY RESET command.
     *
     * The LATENCY RESET command returns an Integer Reply (the oldest timestamp of the
     * events that were reset, or 0 if no events were reset).
     * Node-redis typically handles basic RESP Integer replies automatically,
     * so a custom transformation function might not be strictly necessary for simple cases.
     *
     * @returns A number representing the oldest timestamp of the reset events.
     */
    transformReply: undefined as unknown as () => number
} as const satisfies Command; // 'satisfies Command' ensures this object conforms to the 'Command' interface
