import { Command } from '../RESP/types';
import GEORADIUS, { transformGeoRadiusArguments } from './GEORADIUS';

export default {
  FIRST_KEY_INDEX: GEORADIUS.FIRST_KEY_INDEX,
  IS_READ_ONLY: true,
  transformArguments: transformGeoRadiusArguments.bind(undefined, 'GEORADIUS_RO'),
  transformReply: GEORADIUS.transformReply
} as const satisfies Command;
