import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Controls whether to prevent the client's connections from being evicted
   * @param parser - The Redis command parser
   * @param value - Whether to enable (true) or disable (false) the no-evict mode
   */
  parseCommand(parser: CommandParser, value: boolean) {
    parser.push(
      'CLIENT',
      'NO-EVICT',
      value ? 'ON' : 'OFF'
    );
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
