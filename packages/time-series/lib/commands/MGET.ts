import { CommandParser } from '@redis/client/lib/client/parser';
import { Command, BlobStringReply, ArrayReply, Resp2Reply, MapReply, TuplesReply, TypeMapping } from '@redis/client/lib/RESP/types';
import { resp2MapToValue, resp3MapToValue, SampleRawReply, transformSampleReply } from '.';
import { RedisVariadicArgument } from '@redis/client/lib/commands/generic-transformers';

export interface TsMGetOptions {
  LATEST?: boolean;
}

export function parseLatestArgument(parser: CommandParser, latest?: boolean) {
  if (latest) {
    parser.push('LATEST');
  }
}

export function parseFilterArgument(parser: CommandParser, filter: RedisVariadicArgument) {
  parser.push('FILTER');
  parser.pushVariadic(filter);
}

export type MGetRawReply2 = ArrayReply<
  TuplesReply<[
    key: BlobStringReply,
    labels: never,
    sample: Resp2Reply<SampleRawReply>
  ]>
>;

export type MGetRawReply3 = MapReply<
  BlobStringReply,
  TuplesReply<[
    labels: never,
    sample: SampleRawReply
  ]>
>;

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, filter: RedisVariadicArgument, options?: TsMGetOptions) {
    parser.push('TS.MGET');
    parseLatestArgument(parser, options?.LATEST);
    parseFilterArgument(parser, filter);
  },
  transformReply: {
    2(reply: MGetRawReply2, _, typeMapping?: TypeMapping) {
      return resp2MapToValue(reply, ([,, sample]) => {
        return {
          sample: transformSampleReply[2](sample)
        };
      }, typeMapping);
    },
    3(reply: MGetRawReply3) {
      return resp3MapToValue(reply, ([, sample]) => {
        return {
          sample: transformSampleReply[3](sample)
        };
      });
    }
  }
} as const satisfies Command;
