import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the REPLICAOF command
   * 
   * @param parser - The command parser
   * @param host - The host of the master to replicate from
   * @param port - The port of the master to replicate from
   * @see https://redis.io/commands/replicaof/
   */
  parseCommand(parser: CommandParser, host: string, port: number) {
    parser.push('REPLICAOF', host, port.toString());
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
