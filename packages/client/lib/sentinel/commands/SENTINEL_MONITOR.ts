import { RedisArgument, SimpleStringReply, Command } from '../../RESP/types';

export default {
  transformArguments(dbname: RedisArgument, host: RedisArgument, port: RedisArgument, quorum: RedisArgument) {
    return ['SENTINEL', 'MONITOR', dbname, host, port, quorum];
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'> 
} as const satisfies Command;
