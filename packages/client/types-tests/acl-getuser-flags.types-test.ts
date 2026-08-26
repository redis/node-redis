/**
 * Compile-time regression: ACL GETUSER's flags field must model the RESP3
 * set that acl.c emits (setDeferredSetLen). The wire element is a set, but it
 * decodes to a plain Array unless callers map RESP_TYPES.SET to Set, which is
 * exactly how SetReply types it. Sibling commands already use SetReply
 * (FUNCTION LIST, CLIENT TRACKINGINFO); replies remain arrays by default.
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
    // With SET mapped to Set, flags resolves to Set<string>.
    const flags: Set<string> = reply.flags;
    console.log(flags.size > 0 ? 'has flags' : 'no flags');
}
