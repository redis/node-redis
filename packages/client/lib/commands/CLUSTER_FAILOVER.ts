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
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(options?: ClusterFailoverOptions) {
    const args = ['CLUSTER', 'FAILOVER'];

    if (options?.mode) {
      args.push(options.mode);
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
