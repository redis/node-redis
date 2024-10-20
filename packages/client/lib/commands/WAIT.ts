import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, numberOfReplicas: number, timeout: number) {
    parser.push('WAIT', numberOfReplicas.toString(), timeout.toString());
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
