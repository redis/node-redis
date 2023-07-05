import { Command } from '@redis/client/dist/lib/RESP/types';
import BYRANK, { transformByRankArguments } from './BYRANK';

export default {
  FIRST_KEY_INDEX: BYRANK.FIRST_KEY_INDEX,
  IS_READ_ONLY: BYRANK.IS_READ_ONLY,
  transformArguments: transformByRankArguments.bind(undefined, 'TDIGEST.BYREVRANK'),
  transformReply: BYRANK.transformReply
} as const satisfies Command;
