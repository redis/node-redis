import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Initiates a handshake with another node in the cluster
   * @param parser - The Redis command parser
   * @param host - Host name or IP address of the node
   * @param port - TCP port of the node
   */
  parseCommand(parser: CommandParser, host: string, port: number) {
    parser.push('CLUSTER', 'MEET', host, port.toString());
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
