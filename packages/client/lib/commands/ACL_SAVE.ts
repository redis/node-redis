import { SimpleStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments() {
    return ['ACL', 'SAVE'];
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
