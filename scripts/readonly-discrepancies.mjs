#!/usr/bin/env node
// Find discrepancies between our IS_READ_ONLY command flag and the server's
// `readonly` command flag (from COMMAND INFO).
//
// Command name is derived from the FILE NAME (not parser.push), then resolved
// against the server by trimming trailing tokens until COMMAND INFO recognizes
// it. This collapses variant files (e.g. ZRANGE_WITHSCORES -> zrange) onto
// their base command without hardcoding a suffix list.
//
// Usage: node scripts/readonly-discrepancies.mjs   (SHOW_UNKNOWN=1 to list unknowns)
// Requires a running redis at 127.0.0.1:6379 (redis-cli on PATH).

import { readFileSync, globSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename } from 'node:path';

// Module command prefix by package dir (+ bloom subfolder). '' = core, no prefix.
const PACKAGE_PREFIX = {
  client: '',
  search: 'ft',
  json: 'json',
  'time-series': 'ts'
};
const BLOOM_SUBDIR_PREFIX = {
  bloom: 'bf',
  cuckoo: 'cf',
  'top-k': 'topk',
  'count-min-sketch': 'cms',
  't-digest': 'tdigest'
};

function prefixFor(path) {
  const parts = path.split('/');
  const pkg = parts[1]; // packages/<pkg>/lib/commands/...
  if (pkg === 'bloom') {
    const sub = parts[4]; // packages/bloom/lib/commands/<sub>/FILE.ts
    return BLOOM_SUBDIR_PREFIX[sub] ?? null;
  }
  return PACKAGE_PREFIX[pkg] ?? null;
}

// Filenames that glue command + arg with no separator, so token-splitting
// can't recover the real command name. Map file basename -> server name.
const NAME_OVERRIDES = {
  INCREXBYFLOAT: 'increx' // pushes INCREX ... BYFLOAT
};

const files = globSync('packages/*/lib/commands/**/*.ts', { cwd: process.cwd() })
  .filter(f => !f.endsWith('.spec.ts') && !f.endsWith('index.ts'));

const commands = [];
for (const f of files) {
  const base = basename(f, '.ts');
  // Command files are UPPERCASE (GET, ACL_CAT, ZRANGE_WITHSCORES); skip helpers etc.
  if (base !== base.toUpperCase()) continue;

  const prefix = prefixFor(f);
  if (prefix === null) continue; // unknown package/subdir

  const roMatch = readFileSync(f, 'utf8').match(/IS_READ_ONLY\s*:\s*(true|false)/);
  const isReadOnly = roMatch ? roMatch[1] === 'true' : false;

  // Filename tokens: split on '_', lowercase. Hyphens kept (count-failure-reports).
  // Overrides bypass token-splitting for glued names (single token, no prefix).
  const override = NAME_OVERRIDES[base];
  const tokens = override ? [override] : base.toLowerCase().split('_');
  commands.push({ file: f, prefix: override ? '' : prefix, tokens, isReadOnly });
}

// Build a server name from a prefix + the first `len` filename tokens joined
// by `sep`. Format: `<prefix>.<joined>` for modules, `<joined>` for core.
//   sep '_' -> matches names with underscores (bitfield_ro, tdigest.trimmed_mean)
//   sep '|' -> matches container subcommands (acl|cat, object|encoding)
function nameFor(c, len, sep) {
  const joined = c.tokens.slice(0, len).join(sep);
  return c.prefix ? `${c.prefix}.${joined}` : joined;
}

// Batched trim-until-found. Query current-length names for all unresolved
// commands; keep the hits, decrement length on misses, repeat.
function redisCommandInfo(names) {
  const raw = execFileSync('redis-cli', ['--json', 'COMMAND', 'INFO', ...names], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64
  });
  return JSON.parse(raw);
}

let pending = commands.map(c => ({ c, len: c.tokens.length }));
const resolved = new Map(); // command obj -> server info entry
while (pending.length) {
  const active = pending.filter(p => p.len >= 1);
  if (!active.length) break;
  // Try both separators at this length: '_' first (bitfield_ro before bitfield),
  // then '|' (acl|cat). Query both in one batch.
  const usNames = active.map(p => nameFor(p.c, p.len, '_'));
  const barNames = active.map(p => nameFor(p.c, p.len, '|'));
  const infos = redisCommandInfo([...usNames, ...barNames]);
  const n = active.length;
  const next = [];
  active.forEach((p, i) => {
    const info = infos[i] ?? infos[i + n]; // '_' hit preferred, else '|'
    if (info) resolved.set(p.c, info);
    else if (p.len > 1) next.push({ c: p.c, len: p.len - 1 });
    // len===1 and still null -> genuinely unknown, drop
  });
  pending = next;
}

const discrepancies = [];
const unknown = [];
for (const c of commands) {
  const info = resolved.get(c);
  if (!info) { unknown.push(c); continue; }
  const flags = info[2] || [];
  const serverReadOnly = flags.includes('readonly');
  const serverWrite = flags.includes('write');
  if (serverReadOnly === c.isReadOnly) continue;

  let bucket;
  if (c.isReadOnly && serverWrite) bucket = 'BUG_WRITE_AS_RO';
  else if (!c.isReadOnly && serverReadOnly) bucket = 'MISSED_RO';
  else bucket = 'NOISE';
  discrepancies.push({
    command: info[0],
    file: c.file,
    ours: c.isReadOnly,
    server: serverReadOnly,
    serverFlags: flags,
    bucket
  });
}

console.log(`<!-- Scanned ${commands.length} defs | resolved ${resolved.size} | unknown ${unknown.length} | discrepancies ${discrepancies.length} -->\n`);

const BUCKET_DESC = {
  BUG_WRITE_AS_RO: 'we mark IS_READ_ONLY but server flags `write` (cluster would route to a replica)',
  MISSED_RO: 'we do not mark IS_READ_ONLY but server flags `readonly` (lost replica routing)',
  NOISE: 'server has neither `readonly` nor `write` (admin/conn/pubsub/cluster) — likely by-design'
};

// Manual verdict for each NOISE (keyless) command: is IS_READ_ONLY=true
// (i.e. safe to route to a replica / does not require the primary) correct?
//   Yes = read-only introspection OR connection/node-local -> replica-safe
//   No  = mutates server/cluster/replication/persistence state OR needs primary
// Server `readonly` flag is absent for ALL of these because it only tags
// KEYSPACE reads; these are keyless, so the flag says nothing about them.
const NOISE_VERDICT = {
  'acl|cat': ['Yes', 'reads static ACL categories'],
  'acl|deluser': ['No', 'mutates ACL'],
  'acl|dryrun': ['Yes', 'simulates, no mutation'],
  'acl|genpass': ['Yes', 'pure RNG, node-local'],
  'acl|getuser': ['Yes', 'reads ACL'],
  'acl|list': ['Yes', 'reads ACL'],
  'acl|load': ['No', 'reloads ACL from file'],
  'acl|log': ['Yes', 'reads ACL security log'],
  'acl|save': ['No', 'writes ACL to file'],
  'acl|setuser': ['No', 'mutates ACL'],
  'acl|users': ['Yes', 'reads ACL'],
  'acl|whoami': ['Yes', 'connection identity read'],
  'asking': ['Yes', 'connection-local cluster redirect marker'],
  'auth': ['Yes', 'connection-local auth'],
  'bgrewriteaof': ['No', 'triggers AOF rewrite on the node'],
  'bgsave': ['No', 'triggers RDB save on the node'],
  'client|caching': ['Yes', 'connection-local tracking toggle'],
  'client|getname': ['Yes', 'connection-local read'],
  'client|getredir': ['Yes', 'connection-local read'],
  'client|id': ['Yes', 'connection-local read'],
  'client|info': ['Yes', 'connection-local read'],
  'client|kill': ['No', 'mutates other connections (admin)'],
  'client|list': ['Yes', 'reads connections (per-node view)'],
  'client|no-evict': ['Yes', 'connection-local toggle'],
  'client|no-touch': ['Yes', 'connection-local toggle'],
  'client|pause': ['No', 'pauses command processing (server state)'],
  'client|setname': ['Yes', 'sets own connection name'],
  'client|tracking': ['Yes', 'connection-local toggle'],
  'client|trackinginfo': ['Yes', 'connection-local read'],
  'client|unblock': ['No', 'mutates another client (admin)'],
  'client|unpause': ['No', 'resumes command processing (server state)'],
  'cluster|addslots': ['No', 'mutates slot map'],
  'cluster|addslotsrange': ['No', 'mutates slot map'],
  'cluster|bumpepoch': ['No', 'mutates cluster epoch'],
  'cluster|count-failure-reports': ['Yes', 'reads failure reports'],
  'cluster|countkeysinslot': ['Yes', 'reads (per-node)'],
  'cluster|delslots': ['No', 'mutates slot map'],
  'cluster|delslotsrange': ['No', 'mutates slot map'],
  'cluster|failover': ['No', 'triggers failover'],
  'cluster|flushslots': ['No', 'mutates slot map'],
  'cluster|forget': ['No', 'mutates node set'],
  'cluster|getkeysinslot': ['Yes', 'reads keys in slot (per-node)'],
  'cluster|info': ['Yes', 'reads cluster state'],
  'cluster|keyslot': ['Yes', 'pure hash computation'],
  'cluster|links': ['Yes', 'reads links'],
  'cluster|meet': ['No', 'mutates node set'],
  'cluster|myid': ['Yes', 'reads node id'],
  'cluster|myshardid': ['Yes', 'reads shard id'],
  'cluster|nodes': ['Yes', 'reads topology (per-node view)'],
  'cluster|replicas': ['Yes', 'reads replicas'],
  'cluster|replicate': ['No', 'changes replication target'],
  'cluster|reset': ['No', 'resets cluster node'],
  'cluster|saveconfig': ['No', 'writes nodes.conf'],
  'cluster|set-config-epoch': ['No', 'mutates epoch'],
  'cluster|setslot': ['No', 'mutates slot map'],
  'cluster|slots': ['Yes', 'reads slot map'],
  'command': ['Yes', 'static command metadata, node-local'],
  'command|count': ['Yes', 'static metadata'],
  'command|getkeys': ['Yes', 'pure arg parse'],
  'command|getkeysandflags': ['Yes', 'pure arg parse'],
  'command|info': ['Yes', 'static metadata'],
  'command|list': ['Yes', 'static metadata'],
  'config|get': ['Yes', 'reads config (per-node)'],
  'config|resetstat': ['No', 'resets stats counters'],
  'config|rewrite': ['No', 'writes config file'],
  'config|set': ['No', 'mutates config'],
  'echo': ['Yes', 'node-local no-op'],
  'function|dump': ['Yes', 'reads function payload'],
  'function|kill': ['No', 'kills running function'],
  'function|stats': ['Yes', 'reads runtime (per-node)'],
  'hotkeys|get': ['Yes', 'reads hotkey stats'],
  'info': ['Yes', 'reads server stats (per-node)'],
  'lastsave': ['Yes', 'reads last-save time (per-node)'],
  'latency|doctor': ['Yes', 'reads latency report'],
  'latency|graph': ['Yes', 'reads latency graph'],
  'latency|histogram': ['Yes', 'reads latency histogram'],
  'latency|history': ['Yes', 'reads latency history'],
  'latency|latest': ['Yes', 'reads latency samples'],
  'memory|doctor': ['Yes', 'reads memory report'],
  'memory|malloc-stats': ['Yes', 'reads allocator stats'],
  'memory|stats': ['Yes', 'reads memory stats'],
  'module|list': ['Yes', 'reads loaded modules'],
  'module|load': ['No', 'loads module (server state)'],
  'module|unload': ['No', 'unloads module (server state)'],
  'ping': ['Yes', 'node-local no-op'],
  'publish': ['Yes', 'keyless; propagates cluster-wide via bus'],
  'pubsub|channels': ['Yes', 'reads pubsub state (per-node)'],
  'pubsub|numpat': ['Yes', 'reads pubsub state'],
  'pubsub|numsub': ['Yes', 'reads pubsub state'],
  'pubsub|shardchannels': ['Yes', 'reads shard pubsub state'],
  'pubsub|shardnumsub': ['Yes', 'reads shard pubsub state'],
  'readonly': ['Yes', 'connection-local cluster mode toggle'],
  'readwrite': ['Yes', 'connection-local cluster mode toggle'],
  'replicaof': ['No', 'changes replication topology'],
  'role': ['Yes', 'reads role (per-node)'],
  'save': ['No', 'blocking RDB save'],
  'script|debug': ['Yes', 'connection-local debug toggle'],
  'script|exists': ['Yes', 'reads script cache (per-node)'],
  'script|flush': ['No', 'flushes script cache'],
  'script|kill': ['No', 'kills running script'],
  'script|load': ['No', 'writes to node script cache; primary needed for EVALSHA'],
  'spublish': ['Yes', 'keyless; shard pubsub'],
  'time': ['Yes', 'reads node clock, node-local'],
  'wait': ['No', 'waits for replica acks; must run on primary']
};

for (const bucket of ['BUG_WRITE_AS_RO', 'MISSED_RO', 'NOISE']) {
  const rows = discrepancies.filter(d => d.bucket === bucket);
  console.log(`## ${bucket} (${rows.length})`);
  console.log(`\n${BUCKET_DESC[bucket]}\n`);
  const noise = bucket === 'NOISE';
  if (noise) {
    console.log('| Command | Ours IS_READ_ONLY | Server readonly | Server flags | RO ok? | Why | File |');
    console.log('| --- | --- | --- | --- | --- | --- | --- |');
  } else {
    console.log('| Command | Ours IS_READ_ONLY | Server readonly | Server flags | File |');
    console.log('| --- | --- | --- | --- | --- |');
  }
  for (const d of rows) {
    const cmd = d.command.replaceAll('|', '\\|'); // escape pipe for md cell
    if (noise) {
      const [ok, why] = NOISE_VERDICT[d.command] ?? ['?', 'UNMAPPED — review'];
      console.log(
        `| \`${cmd}\` | ${d.ours} | ${d.server} | ${d.serverFlags.join(', ')} | ${ok} | ${why} | \`${d.file}\` |`
      );
    } else {
      console.log(
        `| \`${cmd}\` | ${d.ours} | ${d.server} | ${d.serverFlags.join(', ')} | \`${d.file}\` |`
      );
    }
  }
  console.log('');
}

if (process.env.SHOW_UNKNOWN) {
  console.log(`\n=== UNKNOWN (${unknown.length}) ===`);
  for (const u of unknown) {
    console.log(`${nameFor(u, u.tokens.length, '_')}  ${u.file}`);
  }
}
