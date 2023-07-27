import { Command } from '@redis/client/dist/lib/RESP/types';
import { transformMRangeWithLabelsArguments } from './MRANGE_WITHLABELS';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments: transformMRangeWithLabelsArguments.bind(undefined, 'TS.MREVRANGE'),
  // TODO
  // export { transformMRangeWithLabelsReply as transformReply } from '.';
  transformReply: undefined as unknown as () => any
} as const satisfies Command;
