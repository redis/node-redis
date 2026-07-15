// Mocha configuration for running the @redis/client command specs against a managed
// Redis Enterprise database (RE_CLUSTER=true). The TestUtils harness routes the
// client-half of each spec to the RE endpoint (see packages/test-utils re-cluster.ts)
// and skips the cluster/sentinel halves.
//
// The specs below are ignored on Redis Enterprise because they exercise behaviour a
// managed Enterprise database does not expose. Each group has a rationale; when running
// against OSS Redis the normal `mocha ./lib/**/*.spec.ts` config is unaffected.
module.exports = {
  require: 'tsx',
  timeout: 60000,
  spec: 'lib/commands/**/*.spec.ts',
  ignore: [
    // AR.* array preview commands - not shipped in managed Redis Enterprise
    'lib/commands/AR*.spec.ts',
    // INCREX / INCREXBYFLOAT - OSS preview commands not implemented on RE
    'lib/commands/INCREX*.spec.ts',
    // Brand-new set-cardinality commands not yet available on the RE server version
    'lib/commands/SDIFFCARD.spec.ts',
    'lib/commands/SUNIONCARD.spec.ts',
    // New XREAD / XREADGROUP options (MAXCOUNT / MAXSIZE) not available on RE yet
    'lib/commands/XREAD.spec.ts',
    'lib/commands/XREADGROUP.spec.ts',
    // HGETEX PERSIST reply differs on RE
    'lib/commands/HGETEX.spec.ts',
    // Server administration / persistence - restricted for the default user on RE
    'lib/commands/BGREWRITEAOF.spec.ts',
    'lib/commands/BGSAVE.spec.ts',
    'lib/commands/LASTSAVE.spec.ts',
    'lib/commands/ROLE.spec.ts',
    'lib/commands/CONFIG_SET.spec.ts',
    'lib/commands/SCRIPT_DEBUG.spec.ts',
    'lib/commands/LATENCY_*.spec.ts',
    'lib/commands/MEMORY_DOCTOR.spec.ts',
    'lib/commands/MEMORY_MALLOC-STATS.spec.ts',
    'lib/commands/MEMORY_PURGE.spec.ts',
    'lib/commands/MEMORY_STATS.spec.ts',
    'lib/commands/HOTKEYS_*.spec.ts',
    // ACL user management / log - not permitted for the default user on RE
    'lib/commands/ACL_DELUSER.spec.ts',
    'lib/commands/ACL_GENPASS.spec.ts',
    'lib/commands/ACL_LOG.spec.ts',
    'lib/commands/ACL_LOG_RESET.spec.ts',
    // FUNCTION LIST library shape differs behind the RE proxy
    'lib/commands/FUNCTION_LIST.spec.ts',
    'lib/commands/FUNCTION_LIST_WITHCODE.spec.ts',
    // CLIENT admin / proxy behaviour differs on RE
    'lib/commands/CLIENT_INFO.spec.ts',
    'lib/commands/CLIENT_LIST.spec.ts',
    'lib/commands/CLIENT_NO-EVICT.spec.ts',
    'lib/commands/CLIENT_PAUSE.spec.ts',
    'lib/commands/CLIENT_UNPAUSE.spec.ts',
    // Cross-DB operations - a managed RE database is a single logical DB
    'lib/commands/MOVE.spec.ts',
    'lib/commands/SWAPDB.spec.ts',
    // Commands / options not available across the whole managed RE version matrix
    // (present on RE 8.8 but missing on RE 8.0.x): vector set VRANGE, XNACK, the
    // HELLO reply shape, and the newer ZUNION/ZINTER AGGREGATE option.
    'lib/commands/VRANGE.spec.ts',
    'lib/commands/XNACK.spec.ts',
    'lib/commands/HELLO.spec.ts',
    'lib/commands/ZUNION.spec.ts',
    'lib/commands/ZUNIONSTORE.spec.ts',
    'lib/commands/ZINTER.spec.ts',
    'lib/commands/ZINTERSTORE.spec.ts'
  ]
};
