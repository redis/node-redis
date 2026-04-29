import { Command } from '../RESP/types';
import { parseGeoRadiusWithArguments } from './GEORADIUS_WITH';
import GEORADIUS_WITH from './GEORADIUS_WITH';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  parseCommand(...args: Parameters<typeof parseGeoRadiusWithArguments>) {
    args[0].push('GEORADIUS_RO');
    parseGeoRadiusWithArguments(...args);
  },
  transformReply: GEORADIUS_WITH.transformReply
} as const satisfies Command;
