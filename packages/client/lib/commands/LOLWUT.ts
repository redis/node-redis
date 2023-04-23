import { BlobStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  FIRST_KEY_INDEX: undefined,
  transformArguments(version?: number, ...optionalArguments: Array<number>) {
    const args = ['LOLWUT'];

    if (version) {
      args.push(
        'VERSION',
        version.toString(),
        ...optionalArguments.map(String),
      );
    }

    return args;
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
