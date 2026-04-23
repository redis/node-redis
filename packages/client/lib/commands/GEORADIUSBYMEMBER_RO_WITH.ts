import { Command } from '../RESP/types';
import GEORADIUSBYMEMBER_WITH, { parseGeoRadiusByMemberWithArguments } from './GEORADIUSBYMEMBER_WITH';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  parseCommand(...args: Parameters<typeof parseGeoRadiusByMemberWithArguments>) {
    const parser = args[0];
    parser.push('GEORADIUSBYMEMBER_RO');
    parseGeoRadiusByMemberWithArguments(...args);
  },
  transformReply: GEORADIUSBYMEMBER_WITH.transformReply
} as const satisfies Command;
