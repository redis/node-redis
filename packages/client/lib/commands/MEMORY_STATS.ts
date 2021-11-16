export function transformArguments(): Array<string> {
    return ['MEMORY', 'STATS'];
}

interface MemoryStatsReply {
    peakAllocated: number;
    totalAllocated: number;
    startupAllocated: number;
    replicationBacklog: number;
    clientsReplicas: number;
    clientsNormal: number;
    aofBuffer: number;
    luaCaches: number;
    overheadTotal: number;
    keysCount: number;
    keysBytesPerKey: number;
    datasetBytes: number;
    datasetPercentage: number;
    peakPercentage: number;
    allocatorAllocated?: number,
    allocatorActive?: number;
    allocatorResident?: number;
    allocatorFragmentationRatio?: number;
    allocatorFragmentationBytes?: number;
    allocatorRssRatio?: number;
    allocatorRssBytes?: number;
    rssOverheadRatio?: number;
    rssOverheadBytes?: number;
    fragmentation?: number;
    fragmentationBytes: number;
    db: {
        [key: number]: {
            overheadHashtableMain: number;
            overheadHashtableExpires: number;
        };
    };
}

const FIELDS_MAPPING = {
        'peak.allocated': 'peakAllocated',
        'total.allocated': 'totalAllocated',
        'startup.allocated': 'startupAllocated',
        'replication.backlog': 'replicationBacklog',
        'clients.slaves': 'clientsReplicas',
        'clients.normal': 'clientsNormal',
        'aof.buffer': 'aofBuffer',
        'lua.caches': 'luaCaches',
        'overhead.total': 'overheadTotal',
        'keys.count': 'keysCount',
        'keys.bytes-per-key': 'keysBytesPerKey',
        'dataset.bytes': 'datasetBytes',
        'dataset.percentage': 'datasetPercentage',
        'peak.percentage': 'peakPercentage',
        'allocator.allocated': 'allocatorAllocated',
        'allocator.active': 'allocatorActive',
        'allocator.resident': 'allocatorResident',
        'allocator-fragmentation.ratio': 'allocatorFragmentationRatio',
        'allocator-fragmentation.bytes': 'allocatorFragmentationBytes',
        'allocator-rss.ratio': 'allocatorRssRatio',
        'allocator-rss.bytes': 'allocatorRssBytes',
        'rss-overhead.ratio': 'rssOverheadRatio',
        'rss-overhead.bytes': 'rssOverheadBytes',
        'fragmentation': 'fragmentation',
        'fragmentation.bytes': 'fragmentationBytes'
    },
    DB_FIELDS_MAPPING = {
        'overhead.hashtable.main': 'overheadHashtableMain',
        'overhead.hashtable.expires': 'overheadHashtableExpires'
    };

export function transformReply(rawReply: Array<string | number | Array<string | number>>): MemoryStatsReply {
    const reply: any = {
        db: {}
    };

    for (let i = 0; i < rawReply.length; i += 2) {
        const key = rawReply[i] as string;
        if (key.startsWith('db.')) {
            const dbTuples = rawReply[i + 1] as Array<string | number>,
                db: any = {};
            for (let j = 0; j < dbTuples.length; j += 2) {
                db[DB_FIELDS_MAPPING[dbTuples[j] as keyof typeof DB_FIELDS_MAPPING]] = dbTuples[j + 1];
            }

            reply.db[key.substring(3)] = db;
            continue;
        }

        reply[FIELDS_MAPPING[key as keyof typeof FIELDS_MAPPING]] = Number(rawReply[i + 1]);
    }

    return reply as MemoryStatsReply;
}
