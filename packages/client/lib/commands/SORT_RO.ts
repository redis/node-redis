import { Command } from '../RESP/types';
import SORT, { transformSortArguments } from './SORT';

export default {
  FIRST_KEY_INDEX: SORT.FIRST_KEY_INDEX,
  IS_READ_ONLY: true,
  transformArguments: transformSortArguments.bind(undefined, 'SORT_RO'),
  transformReply: SORT.transformReply
} as const satisfies Command;
