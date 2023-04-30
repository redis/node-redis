import { BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  transformArguments() {
    return [
      'CLIENT',
      'GETNAME'
    ];
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
