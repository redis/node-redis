/**
 * Compile-time regression: the ROLE replica state union must include every
 * status replication.c emits (handshake, none, connect, connecting, sync,
 * connected, unknown). Declaring only connect/connecting/sync/connected
 * rejects valid server states like the handshake phase of a fresh replica.
 *
 * Lives outside `lib/` so it is not picked up by the production build /
 * typedoc. Checked with `npm run test:types -w @redis/client`.
 */
import { createClient } from '../index';

type Client = ReturnType<typeof createClient>;
type RoleReply = Awaited<ReturnType<Client['role']>>;

export function roleSlaveStateCoversServerStates(reply: RoleReply): void {
  if (!reply) return;
  if (reply.role === 'slave') {
    const state = reply.state;
    // Comparing against real server states must be a legal check.
    if (state === 'handshake' || state === 'none' || state === 'unknown') {
      console.log('transient state:', state);
    }
    console.log(state);
  }
}
