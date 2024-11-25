import { Command } from '../RESP/types';
import GEORADIUSBYMEMBER, { parseGeoRadiusByMemberArguments } from './GEORADIUSBYMEMBER';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  parseCommand(...args: Parameters<typeof parseGeoRadiusByMemberArguments>) {
    const parser = args[0];
    parser.push('GEORADIUSBYMEMBER_RO');
    parseGeoRadiusByMemberArguments(...args);
  },
  transformReply: GEORADIUSBYMEMBER.transformReply
} as const satisfies Command;
