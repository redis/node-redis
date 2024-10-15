import { Command } from '@redis/client/dist/lib/RESP/types';
import QUERY, { transformQueryArguments } from './QUERY';

export default {
  FIRST_KEY_INDEX: QUERY.FIRST_KEY_INDEX,
  IS_READ_ONLY: true,
  transformArguments: transformQueryArguments.bind(undefined, 'GRAPH.RO_QUERY'),
  transformReply: QUERY.transformReply
} as const satisfies Command;
