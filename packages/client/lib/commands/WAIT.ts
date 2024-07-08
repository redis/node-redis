import { NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, numberOfReplicas: number, timeout: number) {
    parser.pushVariadic(['WAIT', numberOfReplicas.toString(), timeout.toString()]);
  },
  transformArguments(numberOfReplicas: number, timeout: number) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
