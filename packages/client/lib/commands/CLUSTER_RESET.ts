import { SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export interface ClusterResetOptions {
  mode?: 'HARD' | 'SOFT';
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, options?: ClusterResetOptions) {
    parser.pushVariadic(['CLUSTER', 'RESET']);

    if (options?.mode) {
      parser.push(options.mode);
    }
  },
  transformArguments(options?: ClusterResetOptions) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
