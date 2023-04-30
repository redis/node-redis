import { SimpleStringReply, Command } from '../RESP/types';
import ACL_LOG from './ACL_LOG';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: ACL_LOG.IS_READ_ONLY,
  transformArguments() {
    return ['ACL', 'LOG', 'RESET'];
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
