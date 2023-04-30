import { SimpleStringReply, Command } from '../RESP/types';
import { pushVariadicNumberArguments } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  transformArguments(slots: number | Array<number>) {
    return pushVariadicNumberArguments(
      ['CLUSTER', 'DELSLOTS'],
      slots
    );
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
