import { SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export const FAILOVER_MODES = {
  FORCE: 'FORCE',
  TAKEOVER: 'TAKEOVER'
} as const;

export type FailoverMode = typeof FAILOVER_MODES[keyof typeof FAILOVER_MODES];

export interface ClusterFailoverOptions {
  mode?: FailoverMode;
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser:CommandParser, options?: ClusterFailoverOptions) {
    parser.pushVariadic(['CLUSTER', 'FAILOVER']);

    if (options?.mode) {
      parser.push(options.mode);
    }
  },
  transformArguments(options?: ClusterFailoverOptions) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
