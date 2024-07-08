import { SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import ACL_LOG from './ACL_LOG';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: ACL_LOG.IS_READ_ONLY,
  parseCommand(parser: CommandParser) {
    parser.pushVariadic(['ACL', 'LOG', 'RESET']);
  },
  transformArguments() { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
