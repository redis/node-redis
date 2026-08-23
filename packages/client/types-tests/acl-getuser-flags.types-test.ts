/**
 * Compile-time regression: ACL GETUSER's flags field must be typed as a
 * RESP3 SET. acl.c emits the flags element with setDeferredSetLen, so RESP3
 * clients receive a set on the wire, while ArrayReply promised an array.
 * Sibling commands already model this with SetReply (FUNCTION LIST,
 * CLIENT TRACKINGINFO); RESP2 replies remain arrays either way.
 *
 * Lives outside `lib/` so it is not picked up by the production build /
 * typedoc. Checked with `npm run test:types -w @redis/client`.
 */
import ACL_GETUSER from '../lib/commands/ACL_GETUSER';
import { RESP_TYPES } from '../lib/RESP/decoder';
import { CommandReply, ReplyWithTypeMapping } from '../lib/RESP/types';

type FlagsWithSetMapping = ReplyWithTypeMapping<
  CommandReply<typeof ACL_GETUSER, 3>,
  { [RESP_TYPES.SET]: typeof Set }
>;

export function aclGetUserFlagsAreSets(reply: FlagsWithSetMapping): void {
    // With SET mapped, flags resolves to the RESP3 wire type.
    const flags: Set<string> = reply.flags;
    console.log(flags.size > 0 ? 'has flags' : 'no flags');
}
