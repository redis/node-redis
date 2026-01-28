import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

/**
 * HOTKEYS RESET command - releases resources used for hotkey tracking
 * 
 * State transitions:
 * - STOPPED -> EMPTY
 * - EMPTY -> EMPTY
 * - ACTIVE -> ERROR (must stop first)
 */
export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: false,
  /**
   * Releases resources used for hotkey tracking.
   * Returns error if a session is active (must be stopped first).
   * @param parser - The Redis command parser
   * @see https://redis.io/commands/hotkeys-reset/
   */
  parseCommand(parser: CommandParser) {
    parser.push('HOTKEYS', 'RESET');
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

