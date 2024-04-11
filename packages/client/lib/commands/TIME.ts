import { BlobStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments() {
    return ['TIME'];
  },
  transformReply: undefined as unknown as () => [
    unixTimestamp: BlobStringReply<`${number}`>,
    microseconds: BlobStringReply<`${number}`>
  ]
} as const satisfies Command;
