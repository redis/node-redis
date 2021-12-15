// import { strict as assert } from 'assert';
// import testUtils, { GLOBAL } from '../../test-utils';
// import { transformArguments } from './INFO';

// describe('BF INFO', () => {
//     it('transformArguments', () => {
//         assert.deepEqual(
//             transformArguments('BLOOM'),
//             ['BF.INFO', 'BLOOM']
//         );
//     });

//     testUtils.testWithClient('client.bf.info', async client => {
//         await client.bf.reserve('BLOOM', { errorRate: 0.01, capacity: 100 });

//         assert.deepEqual(
//             await client.bf.info('BLOOM'),
//             {
//                 capacity: 100,
//                 size: 296,
//                 numberOfFilters: 1,
//                 numberOfInsertedItems: 0,
//                 expansionRate: 2
//             }
//         );
//     }, GLOBAL.SERVERS.OPEN);
// });
