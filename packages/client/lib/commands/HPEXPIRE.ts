import { RedisCommandArgument } from '.';
import { pushVerdictArgument } from './generic-transformers';
import { HashExpiration } from "./HEXPIRE";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: RedisCommandArgument, 
  fields: RedisCommandArgument | Array<RedisCommandArgument>,
  ms: number,
  mode?: 'NX' | 'XX' | 'GT' | 'LT',
) {
  const args = ['HPEXPIRE', key, ms.toString()];

  if (mode) {
    args.push(mode);
  }

  args.push('FIELDS')

  return pushVerdictArgument(args, fields);
}

export declare function transformReply(): Array<HashExpiration> | null;