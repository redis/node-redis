import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { ZKeys, parseZKeysArguments } from './generic-transformers';

export type ZInterKeyAndWeight = {
  key: RedisArgument;
  weight: number;
};

export type ZInterKeys<T> = T | [T, ...Array<T>];

export type ZInterKeysType = ZInterKeys<RedisArgument> | ZInterKeys<ZInterKeyAndWeight>;

export interface ZInterOptions {
  AGGREGATE?: 'SUM' | 'MIN' | 'MAX';
}

export function parseZInterArguments(
  parser: CommandParser,
  keys: ZKeys,
  options?: ZInterOptions
) {
  parseZKeysArguments(parser, keys);

  if (options?.AGGREGATE) {
    parser.push('AGGREGATE', options.AGGREGATE);
  }
}

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, keys: ZInterKeysType, options?: ZInterOptions) {
    parser.push('ZINTER');
    parseZInterArguments(parser, keys, options);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
