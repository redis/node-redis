import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { TsMRangeOptions, pushGroupByArgument } from './MRANGE';
import { Timestamp, pushWithLabelsArgument } from '.';
import { pushFilterArgument } from './MGET';
import { pushRangeArguments } from './RANGE';

export interface TsMRangeWithLabelsOptions extends TsMRangeOptions {
  SELECTED_LABELS?: RedisVariadicArgument;
}

export function transformMRangeWithLabelsArguments(
  command: RedisArgument,
  fromTimestamp: Timestamp,
  toTimestamp: Timestamp,
  filter: RedisVariadicArgument,
  options?: TsMRangeWithLabelsOptions
) {
  let args = pushRangeArguments([command], fromTimestamp, toTimestamp, options);
  args = pushWithLabelsArgument(args, options?.SELECTED_LABELS);
  args = pushFilterArgument(args, filter);
  return pushGroupByArgument(args, options?.GROUPBY);
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments: transformMRangeWithLabelsArguments.bind(undefined, 'TS.MRANGE'),
  // TODO
  // export { transformMRangeWithLabelsReply as transformReply } from '.';
  transformReply: undefined as unknown as () => any
} as const satisfies Command;
