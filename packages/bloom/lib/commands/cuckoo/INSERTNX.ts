import { Command } from '@redis/client/dist/lib/RESP/types';
import INSERT, { transofrmCfInsertArguments } from './INSERT';

export default {
  FIRST_KEY_INDEX: INSERT.FIRST_KEY_INDEX,
  IS_READ_ONLY: INSERT.IS_READ_ONLY,
  transformArguments: transofrmCfInsertArguments.bind(undefined, 'CF.INSERTNX'),
  transformReply: INSERT.transformReply
} as const satisfies Command;
