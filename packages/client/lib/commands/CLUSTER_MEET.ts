import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, host: string, port: number) {
    parser.push('CLUSTER', 'MEET', host, port.toString());
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
