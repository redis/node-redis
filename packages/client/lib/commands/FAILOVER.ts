import { SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

interface FailoverOptions {
  TO?: {
    host: string;
    port: number;
    FORCE?: true;
  };
  ABORT?: true;
  TIMEOUT?: number;
}

export default {
  parseCommand(parser: CommandParser, options?: FailoverOptions) {
    parser.push('FAILOVER');

    if (options?.TO) {
      parser.pushVariadic(['TO', options.TO.host, options.TO.port.toString()]);

      if (options.TO.FORCE) {
        parser.push('FORCE');
      }
    }

    if (options?.ABORT) {
      parser.push('ABORT');
    }

    if (options?.TIMEOUT) {
      parser.pushVariadic(['TIMEOUT', options.TIMEOUT.toString()]);
    }
  },
  transformArguments(options?: FailoverOptions) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
