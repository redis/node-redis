import { SimpleStringReply, Command } from '../RESP/types';
import { pushVariadicNumberArguments } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(slots: number | Array<number>) {
    return pushVariadicNumberArguments(
      ['CLUSTER', 'ADDSLOTS'],
      slots
    );
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
