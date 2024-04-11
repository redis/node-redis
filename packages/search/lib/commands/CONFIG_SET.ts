import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

// using `string & {}` to avoid TS widening the type to `string`
// TODO
type FtConfigProperties = 'a' | 'b' | (string & {}) | Buffer;

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(property: FtConfigProperties, value: RedisArgument) {
    return ['FT.CONFIG', 'SET', property, value];
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
