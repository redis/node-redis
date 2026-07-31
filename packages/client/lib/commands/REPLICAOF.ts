import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, host: string, port: number) {
    parser.push('REPLICAOF', host, port.toString());
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
