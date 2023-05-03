import { SimpleStringReply, Command } from '../RESP/types';

export const FAILOVER_MODES = {
  FORCE: 'FORCE',
  TAKEOVER: 'TAKEOVER'
} as const;

export type FailoverModes = typeof FAILOVER_MODES[keyof typeof FAILOVER_MODES];

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(mode?: FailoverModes) {
    const args = ['CLUSTER', 'FAILOVER'];

    if (mode) {
      args.push(mode);
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
