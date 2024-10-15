import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RediSearchSchema, pushSchema } from './CREATE';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(index: RedisArgument, schema: RediSearchSchema) {
    const args = ['FT.ALTER', index, 'SCHEMA', 'ADD'];
    pushSchema(args, schema);
    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
