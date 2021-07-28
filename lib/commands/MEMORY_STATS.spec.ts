import { strict as assert } from 'assert';
import { transformArguments, transformReply } from './MEMORY_STATS';

describe('MEMORY STATS', () => {
    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments(),
            ['MEMORY', 'STATS']
        );
    });

    it('transformReply', () => {
        assert.deepEqual(
            transformReply([
                'peak.allocated',
                952728,
                'total.allocated',
                892904,
                'startup.allocated',
                809952,
                'replication.backlog',
                0,
                'clients.slaves',
                0,
                'clients.normal',
                41000,
                'aof.buffer',
                0,
                'lua.caches',
                0,
                'db.0',
                [
                    'overhead.hashtable.main',
                    72,
                    'overhead.hashtable.expires',
                    0
                ],
                'overhead.total',
                850952,
                'keys.count',
                0,
                'keys.bytes-per-key',
                0,
                'dataset.bytes',
                41952,
                'dataset.percentage',
                '50.573825836181641',
                'peak.percentage',
                '93.720771789550781',
                'allocator.allocated',
                937632,
                'allocator.active',
                1191936,
                'allocator.resident',
                4005888,
                'allocator-fragmentation.ratio',
                '1.2712193727493286',
                'allocator-fragmentation.bytes',
                254304,
                'allocator-rss.ratio',
                '3.3608248233795166',
                'allocator-rss.bytes',
                2813952,
                'rss-overhead.ratio',
                '2.4488751888275146',
                'rss-overhead.bytes',
                5804032,
                'fragmentation',
                '11.515504837036133',
                'fragmentation.bytes',
                8958032
            ]),
            {
                peakAllocated: 952728,
                totalAllocated: 892904,
                startupAllocated: 809952,
                replicationBacklog: 0,
                clientsReplicas: 0,
                clientsNormal: 41000,
                aofBuffer: 0,
                luaCaches: 0,
                overheadTotal: 850952,
                keysCount: 0,
                keysBytesPerKey: 0,
                datasetBytes: 41952,
                datasetPercentage: 50.573825836181641,
                peakPercentage: 93.720771789550781,
                allocatorAllocated: 937632,
                allocatorActive: 1191936,
                allocatorResident: 4005888,
                allocatorFragmentationRatio: 1.2712193727493286,
                allocatorFragmentationBytes: 254304,
                allocatorRssRatio: 3.3608248233795166,
                allocatorRssBytes: 2813952,
                rssOverheadRatio: 2.4488751888275146,
                rssOverheadBytes: 5804032,
                fragmentation: 11.515504837036133,
                fragmentationBytes: 8958032,
                db: {
                    0: {
                        overheadHashtableMain: 72,
                        overheadHashtableExpires: 0
                    }
                }
            }
        );
    });
});
