import { SimpleStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  FIRST_KEY_INDEX: undefined,
  transformArguments(host: string, port: number) {
    return ['REPLICAOF', host, port.toString()];
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
