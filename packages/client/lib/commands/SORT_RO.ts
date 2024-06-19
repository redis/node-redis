import { Command } from '../RESP/types';
import SORT, { parseSortArguments, transformSortArguments } from './SORT';

export default {
  FIRST_KEY_INDEX: SORT.FIRST_KEY_INDEX,
  IS_READ_ONLY: true,
  parseCommand: parseSortArguments.bind(undefined, 'SORT_RO'),
  transformArguments: transformSortArguments.bind(undefined, 'SORT_RO'),
  transformReply: SORT.transformReply
} as const satisfies Command;
