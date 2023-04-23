import { SimpleStringReply, Command } from '../RESP/types';

export default {
  transformArguments(host: string, port: number) {
    return ['CLUSTER', 'MEET', host, port.toString()];
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
