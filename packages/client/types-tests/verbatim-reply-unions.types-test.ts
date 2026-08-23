/**
 * Compile-time regression: INFO, CLUSTER INFO, CLUSTER NODES, LATENCY DOCTOR
 * and LATENCY GRAPH are emitted through addReplyVerbatim (networking.c), which
 * sends a bulk string on RESP2 and a verbatim string on RESP3. Declaring only
 * one of the two primitives misdescribed the reply on the other protocol.
 *
 * Lives outside `lib/` so it is not picked up by the production build /
 * typedoc. Checked with `npm run test:types -w @redis/client`.
 */
import INFO from '../lib/commands/INFO';
import CLUSTER_INFO from '../lib/commands/CLUSTER_INFO';
import CLUSTER_NODES from '../lib/commands/CLUSTER_NODES';
import LATENCY_DOCTOR from '../lib/commands/LATENCY_DOCTOR';
import LATENCY_GRAPH from '../lib/commands/LATENCY_GRAPH';
import { BlobStringReply, CommandReply, VerbatimStringReply } from '../lib/RESP/types';

export function infoReplyAcceptsBulkString(blob: BlobStringReply): void {
    const reply: CommandReply<typeof INFO, 3> = blob;
    console.log(reply);
}

export function clusterInfoReplyAcceptsBulkString(blob: BlobStringReply): void {
    const reply: CommandReply<typeof CLUSTER_INFO, 3> = blob;
    console.log(reply);
}

export function clusterNodesReplyAcceptsBulkString(blob: BlobStringReply): void {
    const reply: CommandReply<typeof CLUSTER_NODES, 3> = blob;
    console.log(reply);
}

export function latencyDoctorReplyAcceptsBulkString(blob: BlobStringReply): void {
    const reply: CommandReply<typeof LATENCY_DOCTOR, 3> = blob;
    console.log(reply);
}

export function latencyGraphReplyAcceptsBulkString(blob: BlobStringReply): void {
    const reply: CommandReply<typeof LATENCY_GRAPH, 3> = blob;
    console.log(reply);
}

export function latencyDoctorReplyAcceptsVerbatim(verbatim: VerbatimStringReply): void {
    const reply: CommandReply<typeof LATENCY_DOCTOR, 3> = verbatim;
    console.log(reply);
}

export function latencyGraphReplyAcceptsVerbatim(verbatim: VerbatimStringReply): void {
    const reply: CommandReply<typeof LATENCY_GRAPH, 3> = verbatim;
    console.log(reply);
}
