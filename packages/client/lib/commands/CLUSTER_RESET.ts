import { SimpleStringReply, Command } from '../RESP/types';

export interface ClusterResetOptions {
  mode?: 'HARD' | 'SOFT';
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(options?: ClusterResetOptions) {
    const args = ['CLUSTER', 'RESET'];

    if (options?.mode) {
      args.push(options.mode);
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
