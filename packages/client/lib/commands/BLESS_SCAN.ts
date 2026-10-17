import { CommandParser } from '../client/parser';
import { RedisArgument, Command, BlobStringReply, ArrayReply } from '../RESP/types';
import { BlessFlag } from './BLESS_SET';

/**
 * Options for the BLESS SCAN command
 * @property COUNT - Hint for how many elements to return per iteration
 */
export interface BlessScanOptions {
    COUNT?: number;
}

export default {
    // Keyless read: replica-safe, but the metadata-derived isReplicaSafe
    // returns false for keyless commands, so opt in explicitly.
    IS_READ_ONLY: true,
    parseCommand(parser: CommandParser, cursor: RedisArgument, flag: BlessFlag, options?: BlessScanOptions) {
        parser.push('BLESS');
        parser.push('SCAN');
        parser.push(cursor);
        parser.push(flag);
        if (options?.COUNT) {
            parser.push('COUNT', options.COUNT.toString());
        }
    },
    /**
     * Transforms the BLESS SCAN reply into a structured object
     *
     * @param reply - The raw reply containing cursor and keys
     * @returns Object with cursor and keys properties
     */
    transformReply([cursor, keys]: [BlobStringReply, ArrayReply<BlobStringReply>]) {
        return {
            cursor,
            keys
        };
    }
} as const satisfies Command;
