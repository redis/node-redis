import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

/**
 * HOTKEYS STOP command - stops hotkeys tracking but keeps results available for GET
 * 
 * State transitions:
 * - ACTIVE -> STOPPED
 * - STOPPED -> STOPPED (no-op)
 * - EMPTY -> EMPTY
 */
export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: false,
  /**
   * Stops hotkeys tracking. Results remain available via HOTKEYS GET.
   * @param parser - The Redis command parser
   * @see https://redis.io/commands/hotkeys-stop/
   */
  parseCommand(parser: CommandParser) {
    parser.push('HOTKEYS', 'STOP');
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

