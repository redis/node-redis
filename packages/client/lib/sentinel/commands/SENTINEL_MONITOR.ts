import { CommandParser } from '../../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../../RESP/types';

export default {
  parseCommand(parser: CommandParser, dbname: RedisArgument, host: RedisArgument, port: RedisArgument, quorum: RedisArgument) {
    parser.push('SENTINEL', 'MONITOR', dbname, host, port, quorum);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'> 
} as const satisfies Command;
