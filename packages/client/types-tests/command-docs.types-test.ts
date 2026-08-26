/**
 * Compile-time regression: COMMAND DOCS containers that the server encodes as
 * RESP3 sets must be declared as SetReply. addReplyCommandFlags and
 * addReplyCommandHistory use addReplySetLen for doc_flags, argument flags and
 * history, so ArrayReply misdescribed the wire type (RESP2 replies stay
 * arrays either way).
 *
 * Lives outside `lib/` so it is not picked up by the production build /
 * typedoc. Checked with `npm run test:types -w @redis/client`.
 */
import { CommandDoc, CommandDocsArgument } from '../lib/commands/COMMAND_DOCS';
import { BlobStringReply, SetReply, TuplesReply } from '../lib/RESP/types';

export function commandDocSetsAreSets(doc: CommandDoc): void {
    const docFlags: SetReply<BlobStringReply> | undefined = doc.doc_flags;
    const history: SetReply<TuplesReply<[BlobStringReply, BlobStringReply]>> | undefined = doc.history;
    console.log(docFlags, history);
}

export function commandDocsArgumentFlagsAreSets(arg: CommandDocsArgument): void {
    const flags: SetReply<BlobStringReply> | undefined = arg.flags;
    console.log(flags);
}
