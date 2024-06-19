import { SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, configEpoch: number) {
    parser.pushVariadic(['CLUSTER', 'SET-CONFIG-EPOCH', configEpoch.toString()]);
  },
  transformArguments(configEpoch: number) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
