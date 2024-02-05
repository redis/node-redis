import { SimpleStringReply, Command } from '../RESP/types';

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
  transformArguments(options?: FailoverOptions) {
    const args = ['FAILOVER'];

    if (options?.TO) {
      args.push('TO', options.TO.host, options.TO.port.toString());

      if (options.TO.FORCE) {
        args.push('FORCE');
      }
    }

    if (options?.ABORT) {
      args.push('ABORT');
    }

    if (options?.TIMEOUT) {
      args.push('TIMEOUT', options.TIMEOUT.toString());
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
