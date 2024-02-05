import { Command } from '../RESP/types';
import GEORADIUSBYMEMBER, { transformGeoRadiusByMemberArguments } from './GEORADIUSBYMEMBER';

export default {
  FIRST_KEY_INDEX: GEORADIUSBYMEMBER.FIRST_KEY_INDEX,
  IS_READ_ONLY: true,
  transformArguments: transformGeoRadiusByMemberArguments.bind(undefined, 'GEORADIUSBYMEMBER_RO'),
  transformReply: GEORADIUSBYMEMBER.transformReply
} as const satisfies Command;
