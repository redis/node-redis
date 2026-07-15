import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export interface ClusterResetOptions {
  mode?: 'HARD' | 'SOFT';
}

export default {
  parseCommand(parser: CommandParser, options?: ClusterResetOptions) {
    parser.push('CLUSTER', 'RESET');

    if (options?.mode) {
      parser.push(options.mode);
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
