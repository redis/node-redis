import { RedisCommandArgument } from '.';
import { pushVerdictArgument, transformEXAT, transformPXAT } from './generic-transformers';
import { HashExpiration } from './HEXPIRE';

export const FIRST_KEY_INDEX = 1;
export const IS_READ_ONLY = true;

export function transformArguments(
  key: RedisCommandArgument,
  fields: RedisCommandArgument | Array<RedisCommandArgument>,
  timestamp: number | Date,
  mode?: 'NX' | 'XX' | 'GT' | 'LT'
) {
  const args = ['HPEXPIREAT', key, transformPXAT(timestamp)];

  if (mode) {
    args.push(mode);
  }

  args.push('FIELDS')

  return pushVerdictArgument(args, fields);
}

export declare function transformReply(): Array<HashExpiration> | null;