import { SimpleStringReply, Command } from '../RESP/types';

export interface BgSaveOptions {
  SCHEDULE?: boolean;
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(options?: BgSaveOptions) {
    const args = ['BGSAVE'];
    
    if (options?.SCHEDULE) {
      args.push('SCHEDULE');
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
