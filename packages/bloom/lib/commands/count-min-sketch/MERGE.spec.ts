// import { strict as assert } from 'assert';
// import testUtils, { GLOBAL } from '../../test-utils';
// import { transformArguments } from './MERGE';

// describe('CMS MERGE', () => {
//     describe('transformArguments', () => {
//         it('without WEIGHTS', () => {
//             assert.deepEqual(
//                 transformArguments('dest', ['test']),
//                 ['CMS.MERGE', 'dest', '1', 'test']
//             );
//         });

//         it('with WEIGHTS', () => {
//             assert.deepEqual(
//                 transformArguments('dest', ['test'], [3]),
//                 ['CMS.MERGE', 'dest', '1', 'test', 'WEIGHTS', '3']
//             );
//         });
//     });

//     testUtils.testWithClient('client.cms.query', async client => {
//         await Promise.all([
//             client.bf.initByDim('A', 1000, 5),
//             client.bf.initByDim('B', 1000, 5),
//             client.bf.initByDim('C', 1000, 5),
//         ]);

//         assert.equal(
//             await client.bf.merge('C', ['A', 'B']),
//             'OK'
//         );
//     }, GLOBAL.SERVERS.OPEN);
// });
