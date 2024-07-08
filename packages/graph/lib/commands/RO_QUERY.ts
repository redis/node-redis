import { Command } from '@redis/client/dist/lib/RESP/types';
import QUERY, { parseQueryArguments } from './QUERY';

export default {
  FIRST_KEY_INDEX: QUERY.FIRST_KEY_INDEX,
  IS_READ_ONLY: true,
  parseCommand: parseQueryArguments.bind(undefined, 'GRAPH.RO_QUERY'),
  transformArguments: QUERY.transformArguments,
  transformReply: QUERY.transformReply
} as const satisfies Command;
