/**
 * Compile-time regression: the `last-delivered-id` member of the XINFO GROUPS
 * reply is a stream entry ID string (e.g. "0-0"), not a number. The declared
 * reply type used to label it NumberReply, so consumers saw a `number` where
 * Redis sends a string.
 *
 * Lives outside `lib/` so it is not picked up by the production build /
 * typedoc. Checked with `npm run test:types -w @redis/client`.
 */
import { createClient } from '../index';

type Client = ReturnType<typeof createClient>;
type Group = Awaited<ReturnType<Client['xInfoGroups']>>[number];
type LastDeliveredId = Group['last-delivered-id'];

declare const lastDeliveredId: LastDeliveredId;

// Must be usable as a string.
const asString: string = lastDeliveredId;

// Must not be treated as a number.
// @ts-expect-error stream entry IDs are strings, not numbers
const asNumber: number = lastDeliveredId;

export const XINFO_GROUPS_LAST_DELIVERED_ID_IS_A_STRING = [asString, asNumber] as const;
