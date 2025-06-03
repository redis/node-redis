import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Controls whether to prevent the client from touching the LRU/LFU of keys
   * @param parser - The Redis command parser
   * @param value - Whether to enable (true) or disable (false) the no-touch mode
   */
  parseCommand(parser: CommandParser, value: boolean) {
    parser.push(
      'CLIENT',
      'NO-TOUCH',
      value ? 'ON' : 'OFF'
    );
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

