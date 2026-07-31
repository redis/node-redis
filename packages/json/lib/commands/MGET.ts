import { CommandParser } from '@redis/client/dist/lib/client/parser';
import {
    RedisArgument,
    UnwrapReply,
    ArrayReply,
    NullReply,
    BlobStringReply,
    Command,
} from '@redis/client/dist/lib/RESP/types';
import {
    transformRedisJsonNullReply,
    JsonReviver,
} from '@redis/client/dist/lib/commands/generic-transformers';

export default {
    parseCommand(
        parser: CommandParser,
        keys: Array<RedisArgument>,
        path: RedisArgument,
        reviver?: JsonReviver,
    ) {
        parser.push('JSON.MGET');
        parser.pushKeys(keys);
        parser.push(path);
        parser.preserve = reviver;
    },
    transformReply(reply: UnwrapReply<ArrayReply<NullReply | BlobStringReply>>, reviver?: JsonReviver) {
        return reply.map((json) => transformRedisJsonNullReply(json, reviver));
    },
} as const satisfies Command;
