import { CommandParser } from '../client/parser';
import { SimpleStringReply, NullReply, Command } from '../RESP/types';

/**
 * HOTKEYS STOP command - stops hotkeys tracking but keeps results available for GET
 *
 * State transitions:
 * - ACTIVE -> STOPPED (returns OK)
 * - STOPPED -> STOPPED (no-op)
 * - EMPTY -> EMPTY (returns null - no session was started)
 *
 * Note: Returns null if no session was started or is already stopped.
 */
export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: false,
  /**
   * Stops hotkeys tracking. Results remain available via HOTKEYS GET.
   * Returns null if no session was started or is already stopped.
   * @param parser - The Redis command parser
   * @see https://redis.io/commands/hotkeys-stop/
   */
  parseCommand(parser: CommandParser) {
    parser.push('HOTKEYS', 'STOP');
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'> | NullReply
} as const satisfies Command;
