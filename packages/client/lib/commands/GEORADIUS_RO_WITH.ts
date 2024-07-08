import { Command } from '../RESP/types';
import { parseGeoRadiusWithArguments } from './GEORADIUS_WITH';
import GEORADIUS_WITH, { transformGeoRadiusWithArguments } from './GEORADIUS_WITH';

export default {
  FIRST_KEY_INDEX: GEORADIUS_WITH.FIRST_KEY_INDEX,
  IS_READ_ONLY: true,
  parseCommand: parseGeoRadiusWithArguments.bind(undefined, 'GEORADIUS_RO', true),
  transformArguments: transformGeoRadiusWithArguments.bind(undefined, 'GEORADIUS_RO'),
  transformReply: GEORADIUS_WITH.transformReply
} as const satisfies Command;
