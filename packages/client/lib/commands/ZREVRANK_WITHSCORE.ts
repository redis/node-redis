import ZRANK_WITHSCORE from './ZRANK_WITHSCORE';
import ZREVRANK from './ZREVRANK';
import { Command } from '../RESP/types';

export default {
  parseCommand(...args: Parameters<typeof ZREVRANK.parseCommand>) {
    const parser = args[0];

    ZREVRANK.parseCommand(...args);
    parser.push('WITHSCORE');
  },
  transformReply: ZRANK_WITHSCORE.transformReply
} as const satisfies Command;
