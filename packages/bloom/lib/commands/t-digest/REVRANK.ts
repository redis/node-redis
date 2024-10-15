import { Command } from '@redis/client/dist/lib/RESP/types';
import RANK, { transformRankArguments } from './RANK';

export default {
  FIRST_KEY_INDEX: RANK.FIRST_KEY_INDEX,
  IS_READ_ONLY: RANK.IS_READ_ONLY,
  transformArguments: transformRankArguments.bind(undefined, 'TDIGEST.REVRANK'),
  transformReply: RANK.transformReply
} as const satisfies Command;
