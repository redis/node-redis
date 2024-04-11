import { BlobStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(bits?: number) {
    const args = ['ACL', 'GENPASS'];

    if (bits) {
      args.push(bits.toString());
    }

    return args;
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;

