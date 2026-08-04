import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, configEpoch: number) {
    parser.push('CLUSTER', 'SET-CONFIG-EPOCH', configEpoch.toString());
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
