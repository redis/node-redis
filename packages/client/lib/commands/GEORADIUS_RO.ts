import { Command } from '../RESP/types';
import GEORADIUS, { parseGeoRadiusArguments } from './GEORADIUS';

export default {
  parseCommand(...args: Parameters<typeof parseGeoRadiusArguments>) {
    args[0].push('GEORADIUS_RO');
    parseGeoRadiusArguments(...args);
  },
  transformReply: GEORADIUS.transformReply
} as const satisfies Command;
