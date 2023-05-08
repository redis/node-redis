import { Command } from '../RESP/types';
import GEORADIUSBYMEMBER_WITH, { transformGeoRadiusByMemberWithArguments } from './GEORADIUSBYMEMBER_WITH';

export default {
  FIRST_KEY_INDEX: GEORADIUSBYMEMBER_WITH.FIRST_KEY_INDEX,
  IS_READ_ONLY: true,
  transformArguments: transformGeoRadiusByMemberWithArguments.bind(undefined, 'GEORADIUSBYMEMBER_RO'),
  transformReply: GEORADIUSBYMEMBER_WITH.transformReply
} as const satisfies Command;
