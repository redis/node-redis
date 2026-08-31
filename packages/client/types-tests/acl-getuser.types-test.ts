/**
 * Compile-time regression for https://github.com/redis/node-redis/issues/2745.
 *
 * ACL GETUSER replies null for a nonexistent user, but the declared reply type
 * claimed a non-null object shape and the RESP2 transformer indexed into the
 * null reply. These assertions fail to compile against the unfixed code.
 *
 * Lives outside lib/ so it is not picked up by the production build / typedoc.
 * Checked with `npm run test:types -w @redis/client`.
 */
import type { CommandReply, ReplyWithTypeMapping } from '../lib/RESP/types';
import type ACL_GETUSER from '../lib/commands/ACL_GETUSER';

type Assert<T extends true> = T;

// The default (RESP3) client-facing reply type must include null.
type Resp3ClientReply = ReplyWithTypeMapping<CommandReply<typeof ACL_GETUSER, 3>, {}>;
export type Resp3ClientReplyIncludesNull = Assert<null extends Resp3ClientReply ? true : false>;

// The RESP2 client-facing reply type must include null too.
type Resp2ClientReply = ReplyWithTypeMapping<CommandReply<typeof ACL_GETUSER, 2>, {}>;
export type Resp2ClientReplyIncludesNull = Assert<null extends Resp2ClientReply ? true : false>;
