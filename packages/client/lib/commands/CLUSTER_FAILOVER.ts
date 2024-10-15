import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export const FAILOVER_MODES = {
  FORCE: 'FORCE',
  TAKEOVER: 'TAKEOVER'
} as const;

export type FailoverMode = typeof FAILOVER_MODES[keyof typeof FAILOVER_MODES];

export interface ClusterFailoverOptions {
  mode?: FailoverMode;
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser:CommandParser, options?: ClusterFailoverOptions) {
    parser.push('CLUSTER', 'FAILOVER');

    if (options?.mode) {
      parser.push(options.mode);
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
