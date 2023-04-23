import { RedisArgument, SimpleStringReply, Command, NumberReply } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  transformArguments(numberOfReplicas: number, timeout: number) {
    return ['WAIT', numberOfReplicas.toString(), timeout.toString()];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
