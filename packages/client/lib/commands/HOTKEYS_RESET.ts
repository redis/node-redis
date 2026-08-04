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
  parseCommand(parser: CommandParser) {
    parser.push('HOTKEYS', 'RESET');
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

