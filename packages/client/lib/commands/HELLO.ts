import { RedisArgument, RespVersions, TuplesToMapReply, BlobStringReply, NumberReply, ArrayReply, UnwrapReply, Resp2Reply, Command } from '../RESP/types';

export interface HelloOptions {
  protover?: RespVersions;
  AUTH?: {
    username: RedisArgument;
    password: RedisArgument;
  };
  SETNAME?: string;
}

export type HelloReply = TuplesToMapReply<[
  [BlobStringReply<'server'>, BlobStringReply],
  [BlobStringReply<'version'>, BlobStringReply],
  [BlobStringReply<'proto'>, NumberReply<RespVersions>],
  [BlobStringReply<'id'>, NumberReply],
  [BlobStringReply<'mode'>, BlobStringReply],
  [BlobStringReply<'role'>, BlobStringReply],
  [BlobStringReply<'modules'>, ArrayReply<BlobStringReply>]
]>;

export default {
  transformArguments(protover?: RespVersions, options?: HelloOptions) {
    const args: Array<RedisArgument> = ['HELLO'];

    if (protover) {
      args.push(protover.toString());

      if (options?.AUTH) {
        args.push(
          'AUTH',
          options.AUTH.username,
          options.AUTH.password
        );
      }
  
      if (options?.SETNAME) {
        args.push(
          'SETNAME',
          options.SETNAME
        );
      }
    }
    
    return args;
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<HelloReply>>) => ({
      server: reply[1],
      version: reply[3],
      proto: reply[5],
      id: reply[7],
      mode: reply[9],
      role: reply[11],
      modules: reply[13]
    }),
    3: undefined as unknown as () => HelloReply
  }
} as const satisfies Command;
