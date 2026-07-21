// Cluster-only routing that *consumes* command metadata. The metadata table
// and its resolver now live in `lib/command-metadata/`; import those from there.
export * from './dispatch';
export { splitMultiShardCommand, type SubCommand } from './multi-shard-splitter';

