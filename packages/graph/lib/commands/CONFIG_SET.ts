import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: false,
  transformArguments(configKey: RedisArgument, value: number) {
    return [
      'GRAPH.CONFIG',
      'SET',
      configKey,
      value.toString()
    ];
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
