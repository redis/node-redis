import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/lib/commands/generic-transformers';

export interface TDigestMergeOptions {
  COMPRESSION?: number;
  OVERRIDE?: boolean;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    destination: RedisArgument,
    source: RedisVariadicArgument,
    options?: TDigestMergeOptions
  ) {
    parser.push('TDIGEST.MERGE');
    parser.pushKey(destination);
    parser.pushKeysLength(source);

    if (options?.COMPRESSION !== undefined) {
      parser.push('COMPRESSION', options.COMPRESSION.toString());
    }

    if (options?.OVERRIDE) {
      parser.push('OVERRIDE');
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
