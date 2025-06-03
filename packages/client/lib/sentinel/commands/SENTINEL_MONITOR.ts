import { CommandParser } from '../../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../../RESP/types';

export default {
  /**
   * Instructs a Sentinel to monitor a new master with the specified parameters.
   * @param parser - The Redis command parser.
   * @param dbname - Name that identifies the master.
   * @param host - Host of the master.
   * @param port - Port of the master.
   * @param quorum - Number of Sentinels that need to agree to trigger a failover.
   */
  parseCommand(parser: CommandParser, dbname: RedisArgument, host: RedisArgument, port: RedisArgument, quorum: RedisArgument) {
    parser.push('SENTINEL', 'MONITOR', dbname, host, port, quorum);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'> 
} as const satisfies Command;
