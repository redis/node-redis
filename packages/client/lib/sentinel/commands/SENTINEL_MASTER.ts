import { RedisArgument, MapReply, BlobStringReply, Command } from '../../RESP/types';
import { CommandParser } from '../../client/parser';
import { transformTuplesReply } from '../../commands/generic-transformers';

export default {
  /**
   * Returns information about the specified master.
   * @param parser - The Redis command parser.
   * @param dbname - Name of the master.
   */
  parseCommand(parser: CommandParser, dbname: RedisArgument) {
    parser.push('SENTINEL', 'MASTER', dbname);
  },
  transformReply: {
    2: transformTuplesReply<BlobStringReply>,
    3: undefined as unknown as () => MapReply<BlobStringReply, BlobStringReply>
  }
} as const satisfies Command;
