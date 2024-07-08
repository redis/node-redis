import { SimpleStringReply, Command } from '../RESP/types';
import { mSetArguments, parseMSetArguments } from './MSET';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand: parseMSetArguments.bind(undefined, 'MSETNX'),
  transformArguments: mSetArguments.bind(undefined, 'MSETNX'),
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
