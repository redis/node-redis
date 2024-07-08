import { SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, host: string, port: number) {
    parser.pushVariadic(['REPLICAOF', host, port.toString()]);
  },
  transformArguments(host: string, port: number) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
