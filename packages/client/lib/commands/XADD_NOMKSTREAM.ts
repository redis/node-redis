import { BlobStringReply, NullReply, Command } from '../RESP/types';
import { Tail } from './generic-transformers';
import { parseXAddArguments } from './XADD';

/**
 * Command for adding entries to an existing stream without creating it if it doesn't exist
 */
export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the XADD command with NOMKSTREAM option to append a new entry to an existing stream
   *
   * @param args - Arguments tuple containing parser, key, id, message, and options
   * @returns The ID of the added entry, or null if the stream doesn't exist
   * @see https://redis.io/commands/xadd/
   */
  parseCommand(...args: Tail<Parameters<typeof parseXAddArguments>>) {
    return parseXAddArguments('NOMKSTREAM', ...args);
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
