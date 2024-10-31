import { Command } from '@redis/client/lib/RESP/types';
import QUERY, { parseQueryArguments } from './QUERY';

export default {
  IS_READ_ONLY: true,
  parseCommand: parseQueryArguments.bind(undefined, 'GRAPH.RO_QUERY'),
  transformReply: QUERY.transformReply
} as const satisfies Command;
